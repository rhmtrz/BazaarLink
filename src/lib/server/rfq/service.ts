import type { RfqStatus } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';

const RFQ_EXPIRY_DAYS = Number(process.env.RFQ_EXPIRY_DAYS ?? '7');
const MS_PER_DAY = 86_400_000;

export type { RfqStatus };
export type TransitionActor = { kind: 'user'; userId: string } | { kind: 'system' };

export type RfqInputForTransition = {
	status: RfqStatus;
	buyerId: string;
	listing: { supplier: { userId: string } };
};

export type CanTransitionResult = { ok: true } | { ok: false; reason: string };

type AllowedActor = 'buyer' | 'supplier' | 'system';

const ALLOWED: Record<RfqStatus, Partial<Record<RfqStatus, AllowedActor[]>>> = {
	DRAFT: {
		SUBMITTED: ['buyer'],
		REJECTED: ['buyer']
	},
	SUBMITTED: {
		QUOTED: ['supplier'],
		REJECTED: ['buyer'],
		EXPIRED: ['system']
	},
	QUOTED: {
		ACCEPTED: ['buyer'],
		REJECTED: ['buyer'],
		EXPIRED: ['system']
	},
	ACCEPTED: {},
	REJECTED: {},
	EXPIRED: {}
};

function matchesActor(
	actor: TransitionActor,
	kind: AllowedActor,
	rfq: RfqInputForTransition
): boolean {
	if (kind === 'system') return actor.kind === 'system';
	if (actor.kind !== 'user') return false;
	if (kind === 'buyer') return actor.userId === rfq.buyerId;
	if (kind === 'supplier') return actor.userId === rfq.listing.supplier.userId;
	return false;
}

export function canTransition(
	rfq: RfqInputForTransition,
	from: RfqStatus,
	to: RfqStatus,
	actor: TransitionActor,
	reason?: string
): CanTransitionResult {
	if (rfq.status !== from) {
		return { ok: false, reason: `RFQ is in ${rfq.status}, not ${from}` };
	}

	const allowedKinds = ALLOWED[from][to];
	if (!allowedKinds) {
		return { ok: false, reason: `Transition ${from} → ${to} is not allowed` };
	}

	const actorOk = allowedKinds.some((kind) => matchesActor(actor, kind, rfq));
	if (!actorOk) {
		return { ok: false, reason: `Not permitted to perform ${from} → ${to}` };
	}

	if (to === 'REJECTED' && (!reason || reason.trim() === '')) {
		return { ok: false, reason: 'Rejection requires a reason' };
	}

	return { ok: true };
}

const submitRfqSchema = z.object({
	message: z.string().trim().min(10).max(2000),
	quantity: z.number().int().min(1).optional().nullable()
});

const sendQuoteSchema = z.object({
	priceCents: z.number().int().min(1).max(1_000_000_000),
	quantity: z.number().int().min(1),
	message: z.string().trim().min(10).max(1000),
	validUntil: z.date().optional().nullable()
});

const rejectRfqSchema = z.object({
	reason: z.string().trim().min(1).max(500)
});

export async function submitRfq(buyerUserId: string, listingId: string, input: unknown) {
	const parsed = submitRfqSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: { supplier: { select: { userId: true, kycStatus: true } } }
	});
	if (!listing) throw error(404, 'Listing not found');
	if (listing.status !== 'PUBLISHED' || listing.supplier.kycStatus !== 'APPROVED') {
		throw error(409, 'Listing is not available for quotes');
	}
	if (listing.supplier.userId === buyerUserId) {
		throw error(400, 'You cannot request a quote on your own listing');
	}

	return prisma.rFQ.create({
		data: {
			buyerId: buyerUserId,
			listingId,
			message: parsed.data.message,
			quantity: parsed.data.quantity ?? null,
			status: 'SUBMITTED',
			expiresAt: new Date(Date.now() + RFQ_EXPIRY_DAYS * MS_PER_DAY)
		}
	});
}

export async function findExpiredRfqIds(now: Date = new Date()): Promise<string[]> {
	const rows = await prisma.rFQ.findMany({
		where: { status: { in: ['SUBMITTED', 'QUOTED'] }, expiresAt: { lt: now } },
		select: { id: true },
		take: 500
	});
	return rows.map((r) => r.id);
}

export async function expireRfq(rfqId: string): Promise<void> {
	const rfq = await prisma.rFQ.findUnique({
		where: { id: rfqId },
		include: { listing: { include: { supplier: { select: { userId: true } } } } }
	});
	if (!rfq) return;

	const check = canTransition(rfq, rfq.status, 'EXPIRED', { kind: 'system' });
	if (!check.ok) return;

	await prisma.$transaction(async (tx) => {
		await tx.rFQ.update({ where: { id: rfqId }, data: { status: 'EXPIRED' } });
		await tx.quote.updateMany({
			where: { rfqId, status: 'ACTIVE' },
			data: { status: 'EXPIRED' }
		});
		await tx.transition.create({
			data: { rfqId, actorId: null, fromStatus: rfq.status, toStatus: 'EXPIRED' }
		});
	});
}

export async function sendQuote(supplierUserId: string, rfqId: string, input: unknown) {
	const parsed = sendQuoteSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const rfq = await prisma.rFQ.findUnique({
		where: { id: rfqId },
		include: {
			listing: {
				include: { supplier: { select: { id: true, userId: true, kycStatus: true } } }
			},
			quotes: { where: { status: 'ACTIVE' } }
		}
	});
	if (!rfq) throw error(404, 'RFQ not found');
	if (rfq.listing.supplier.userId !== supplierUserId) throw error(404, 'RFQ not found');
	if (rfq.listing.supplier.kycStatus !== 'APPROVED') {
		throw error(403, 'KYC approval required before sending quotes');
	}
	if (rfq.quotes.length > 0) {
		throw error(409, 'A quote is already active for this RFQ');
	}

	const check = canTransition(rfq, rfq.status, 'QUOTED', {
		kind: 'user',
		userId: supplierUserId
	});
	if (!check.ok) throw error(409, check.reason);

	return prisma.$transaction(async (tx) => {
		const quote = await tx.quote.create({
			data: {
				rfqId,
				supplierId: rfq.listing.supplier.id,
				priceCents: parsed.data.priceCents,
				quantity: parsed.data.quantity,
				message: parsed.data.message,
				validUntil: parsed.data.validUntil ?? null,
				status: 'ACTIVE'
			}
		});
		await tx.rFQ.update({ where: { id: rfqId }, data: { status: 'QUOTED' } });
		await tx.transition.create({
			data: { rfqId, actorId: supplierUserId, fromStatus: rfq.status, toStatus: 'QUOTED' }
		});
		return quote;
	});
}

export async function acceptQuote(buyerUserId: string, quoteId: string) {
	const quote = await prisma.quote.findUnique({
		where: { id: quoteId },
		include: {
			rfq: {
				include: { listing: { include: { supplier: { select: { userId: true } } } } }
			}
		}
	});
	if (!quote) throw error(404, 'Quote not found');
	if (quote.rfq.buyerId !== buyerUserId) throw error(404, 'Quote not found');
	if (quote.status !== 'ACTIVE') throw error(409, 'Quote is no longer active');

	const check = canTransition(quote.rfq, quote.rfq.status, 'ACCEPTED', {
		kind: 'user',
		userId: buyerUserId
	});
	if (!check.ok) throw error(409, check.reason);

	return prisma.$transaction(async (tx) => {
		const updated = await tx.quote.update({
			where: { id: quoteId },
			data: { status: 'ACCEPTED' }
		});
		await tx.quote.updateMany({
			where: { rfqId: quote.rfqId, status: 'ACTIVE', id: { not: quoteId } },
			data: { status: 'REJECTED' }
		});
		await tx.rFQ.update({ where: { id: quote.rfqId }, data: { status: 'ACCEPTED' } });
		await tx.transition.create({
			data: {
				rfqId: quote.rfqId,
				actorId: buyerUserId,
				fromStatus: quote.rfq.status,
				toStatus: 'ACCEPTED'
			}
		});
		return updated;
	});
}

export async function rejectRfq(buyerUserId: string, rfqId: string, input: unknown) {
	const parsed = rejectRfqSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const rfq = await prisma.rFQ.findUnique({
		where: { id: rfqId },
		include: { listing: { include: { supplier: { select: { userId: true } } } } }
	});
	if (!rfq) throw error(404, 'RFQ not found');
	if (rfq.buyerId !== buyerUserId) throw error(404, 'RFQ not found');

	const check = canTransition(
		rfq,
		rfq.status,
		'REJECTED',
		{ kind: 'user', userId: buyerUserId },
		parsed.data.reason
	);
	if (!check.ok) throw error(409, check.reason);

	return prisma.$transaction(async (tx) => {
		const updated = await tx.rFQ.update({
			where: { id: rfqId },
			data: { status: 'REJECTED' }
		});
		await tx.quote.updateMany({
			where: { rfqId, status: 'ACTIVE' },
			data: { status: 'REJECTED' }
		});
		await tx.transition.create({
			data: {
				rfqId,
				actorId: buyerUserId,
				fromStatus: rfq.status,
				toStatus: 'REJECTED',
				reason: parsed.data.reason
			}
		});
		return updated;
	});
}

export async function listMyRfqs(buyerUserId: string) {
	return prisma.rFQ.findMany({
		where: { buyerId: buyerUserId },
		include: {
			listing: {
				select: {
					id: true,
					title: true,
					supplier: { select: { companyName: true, country: true } }
				}
			}
		},
		orderBy: { createdAt: 'desc' },
		take: 100
	});
}

export async function getMyRfqById(buyerUserId: string, rfqId: string) {
	const rfq = await prisma.rFQ.findUnique({
		where: { id: rfqId },
		include: {
			listing: {
				include: {
					supplier: { select: { companyName: true, country: true } },
					photos: { take: 1, orderBy: { createdAt: 'asc' } }
				}
			},
			quotes: { orderBy: { createdAt: 'desc' } },
			transitions: {
				include: { actor: { select: { email: true } } },
				orderBy: { createdAt: 'asc' }
			}
		}
	});
	if (!rfq || rfq.buyerId !== buyerUserId) throw error(404, 'RFQ not found');
	return rfq;
}

export const SUPPLIER_RFQ_TABS = ['PENDING', 'QUOTED', 'CLOSED', 'ALL'] as const;
export type SupplierRfqTab = (typeof SUPPLIER_RFQ_TABS)[number];

export async function listIncomingRfqs(supplierUserId: string, tab?: SupplierRfqTab) {
	const statusWhere =
		tab === 'PENDING'
			? { status: 'SUBMITTED' as const }
			: tab === 'QUOTED'
				? { status: 'QUOTED' as const }
				: tab === 'CLOSED'
					? { status: { in: ['ACCEPTED', 'REJECTED', 'EXPIRED'] as RfqStatus[] } }
					: {};

	return prisma.rFQ.findMany({
		where: { listing: { supplier: { userId: supplierUserId } }, ...statusWhere },
		include: {
			listing: { select: { id: true, title: true } },
			buyer: { select: { email: true } }
		},
		orderBy: { createdAt: 'desc' },
		take: 100
	});
}

export async function getIncomingRfqById(supplierUserId: string, rfqId: string) {
	const rfq = await prisma.rFQ.findUnique({
		where: { id: rfqId },
		include: {
			listing: {
				include: {
					supplier: { select: { userId: true, kycStatus: true } },
					photos: { take: 1, orderBy: { createdAt: 'asc' } }
				}
			},
			buyer: { select: { email: true } },
			quotes: { orderBy: { createdAt: 'desc' } },
			transitions: {
				include: { actor: { select: { email: true } } },
				orderBy: { createdAt: 'asc' }
			}
		}
	});
	if (!rfq || rfq.listing.supplier.userId !== supplierUserId) {
		throw error(404, 'RFQ not found');
	}
	return rfq;
}

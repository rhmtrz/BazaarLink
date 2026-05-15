import type { Supplier } from '@prisma/client';
import { z } from 'zod';
import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { recordAuditEvent } from '$lib/server/audit';

const profileSchema = z.object({
	companyName: z.string().trim().min(1).max(200),
	country: z.string().trim().min(1).max(100),
	phone: z
		.string()
		.trim()
		.max(50)
		.optional()
		.or(z.literal('').transform(() => undefined))
});

const rejectSchema = z.object({
	reason: z.string().trim().min(1).max(500)
});

type ListInput = { status?: 'PENDING' | 'APPROVED' | 'REJECTED' };
type SupplierWithEmail = Supplier & { user: { email: string } };

export type UpsertSupplierInput = {
	companyName: string;
	country: string;
	phone?: string;
};

export async function getSupplierByUserId(userId: string): Promise<Supplier | null> {
	return prisma.supplier.findUnique({ where: { userId } });
}

export async function listSuppliers(input: ListInput): Promise<SupplierWithEmail[]> {
	return prisma.supplier.findMany({
		where: input.status ? { kycStatus: input.status } : undefined,
		include: { user: { select: { email: true } } },
		orderBy: { createdAt: 'desc' },
		take: 100
	});
}

export async function getSupplierById(id: string): Promise<SupplierWithEmail | null> {
	return prisma.supplier.findUnique({
		where: { id },
		include: { user: { select: { email: true } } }
	});
}

export async function approveSupplier(supplierId: string, adminUserId: string): Promise<Supplier> {
	const supplier = await prisma.supplier.findUnique({
		where: { id: supplierId },
		include: { user: { select: { email: true } } }
	});
	if (!supplier) throw error(404, 'Supplier not found');

	const updated = await prisma.supplier.update({
		where: { id: supplierId },
		data: {
			kycStatus: 'APPROVED',
			kycReason: null,
			kycReviewedAt: new Date(),
			kycReviewedById: adminUserId
		}
	});

	await recordAuditEvent({
		type: 'KYC_APPROVED',
		actorUserId: adminUserId,
		payload: {
			supplierId: supplier.id,
			supplierUserId: supplier.userId,
			supplierEmail: supplier.user.email
		}
	});

	return updated;
}

export async function rejectSupplier(
	supplierId: string,
	adminUserId: string,
	input: unknown
): Promise<Supplier> {
	const parsed = rejectSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const supplier = await prisma.supplier.findUnique({
		where: { id: supplierId },
		include: { user: { select: { email: true } } }
	});
	if (!supplier) throw error(404, 'Supplier not found');

	const updated = await prisma.supplier.update({
		where: { id: supplierId },
		data: {
			kycStatus: 'REJECTED',
			kycReason: parsed.data.reason,
			kycReviewedAt: new Date(),
			kycReviewedById: adminUserId
		}
	});

	await recordAuditEvent({
		type: 'KYC_REJECTED',
		actorUserId: adminUserId,
		payload: {
			supplierId: supplier.id,
			supplierUserId: supplier.userId,
			supplierEmail: supplier.user.email,
			reason: parsed.data.reason
		}
	});

	return updated;
}

export async function upsertSupplier(userId: string, input: unknown): Promise<Supplier> {
	const parsed = profileSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const existing = await prisma.supplier.findUnique({ where: { userId } });
	const phone = parsed.data.phone ?? null;

	if (!existing) {
		return prisma.supplier.create({
			data: {
				userId,
				companyName: parsed.data.companyName,
				country: parsed.data.country,
				phone
			}
		});
	}

	const isResubmission = existing.kycStatus === 'REJECTED';

	return prisma.supplier.update({
		where: { userId },
		data: {
			companyName: parsed.data.companyName,
			country: parsed.data.country,
			phone,
			...(isResubmission && {
				kycStatus: 'PENDING',
				kycReason: null,
				kycReviewedAt: null,
				kycReviewedById: null
			})
		}
	});
}

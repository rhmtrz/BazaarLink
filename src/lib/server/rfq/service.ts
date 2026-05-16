import type { RfqStatus } from '@prisma/client';

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

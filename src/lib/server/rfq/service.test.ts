import { describe, it, expect } from 'vitest';
import {
	canTransition,
	type RfqInputForTransition,
	type RfqStatus,
	type TransitionActor
} from './service';

const ALL_STATUSES: RfqStatus[] = [
	'DRAFT',
	'SUBMITTED',
	'QUOTED',
	'ACCEPTED',
	'REJECTED',
	'EXPIRED'
];

// Hard-coded duplicate of the ALLOWED matrix in service.ts. If service drifts
// from this expectation, the matrix-coverage tests fail loudly — that's the
// point. Don't refactor to import ALLOWED.
type Kind = 'buyer' | 'supplier' | 'system';
const EXPECTED: Partial<Record<RfqStatus, Partial<Record<RfqStatus, Kind>>>> = {
	DRAFT: {
		SUBMITTED: 'buyer',
		REJECTED: 'buyer'
	},
	SUBMITTED: {
		QUOTED: 'supplier',
		REJECTED: 'buyer',
		EXPIRED: 'system'
	},
	QUOTED: {
		ACCEPTED: 'buyer',
		REJECTED: 'buyer',
		EXPIRED: 'system'
	}
};

const BUYER_ID = 'buyer-user-id';
const SUPPLIER_USER_ID = 'supplier-user-id';
const STRANGER_ID = 'stranger-user-id';

function makeRfq(status: RfqStatus): RfqInputForTransition {
	return {
		status,
		buyerId: BUYER_ID,
		listing: { supplier: { userId: SUPPLIER_USER_ID } }
	};
}

const buyerActor: TransitionActor = { kind: 'user', userId: BUYER_ID };
const supplierActor: TransitionActor = { kind: 'user', userId: SUPPLIER_USER_ID };
const strangerActor: TransitionActor = { kind: 'user', userId: STRANGER_ID };
const systemActor: TransitionActor = { kind: 'system' };

function actorByKind(kind: Kind): TransitionActor {
	if (kind === 'buyer') return buyerActor;
	if (kind === 'supplier') return supplierActor;
	return systemActor;
}

describe('canTransition — matrix (allowed transitions)', () => {
	for (const from of ALL_STATUSES) {
		const allowed = EXPECTED[from];
		if (!allowed) continue;
		for (const to of Object.keys(allowed) as RfqStatus[]) {
			const kind = allowed[to]!;
			it(`${from} → ${to} succeeds for ${kind}`, () => {
				const rfq = makeRfq(from);
				const reason = to === 'REJECTED' ? 'buyer changed mind' : undefined;
				const result = canTransition(rfq, from, to, actorByKind(kind), reason);
				expect(result).toEqual({ ok: true });
			});
		}
	}
});

describe('canTransition — matrix (denied transitions)', () => {
	for (const from of ALL_STATUSES) {
		for (const to of ALL_STATUSES) {
			const isAllowed = EXPECTED[from]?.[to] !== undefined;
			if (isAllowed) continue;
			it(`${from} → ${to} is denied`, () => {
				const rfq = makeRfq(from);
				// Try each actor; every one must fail (with a non-empty reason so the
				// REJECTED-reason guard doesn't mask the real denial).
				for (const actor of [buyerActor, supplierActor, systemActor]) {
					const result = canTransition(rfq, from, to, actor, 'because');
					expect(result.ok).toBe(false);
				}
			});
		}
	}
});

describe('canTransition — actor permission', () => {
	it('DRAFT → SUBMITTED denied for supplier (only buyer may submit)', () => {
		const result = canTransition(makeRfq('DRAFT'), 'DRAFT', 'SUBMITTED', supplierActor);
		expect(result.ok).toBe(false);
	});

	it('SUBMITTED → QUOTED denied for buyer (only supplier may quote)', () => {
		const result = canTransition(makeRfq('SUBMITTED'), 'SUBMITTED', 'QUOTED', buyerActor);
		expect(result.ok).toBe(false);
	});

	it('SUBMITTED → EXPIRED denied for user actor (system only)', () => {
		const result = canTransition(makeRfq('SUBMITTED'), 'SUBMITTED', 'EXPIRED', buyerActor);
		expect(result.ok).toBe(false);
	});

	it('QUOTED → EXPIRED denied for supplier (system only)', () => {
		const result = canTransition(makeRfq('QUOTED'), 'QUOTED', 'EXPIRED', supplierActor);
		expect(result.ok).toBe(false);
	});

	it('DRAFT → SUBMITTED denied for unrelated user (stranger)', () => {
		const result = canTransition(makeRfq('DRAFT'), 'DRAFT', 'SUBMITTED', strangerActor);
		expect(result.ok).toBe(false);
	});

	it('SUBMITTED → QUOTED denied for system actor (supplier only)', () => {
		const result = canTransition(makeRfq('SUBMITTED'), 'SUBMITTED', 'QUOTED', systemActor);
		expect(result.ok).toBe(false);
	});
});

describe('canTransition — REJECTED reason required', () => {
	it('fails when no reason provided', () => {
		const result = canTransition(makeRfq('DRAFT'), 'DRAFT', 'REJECTED', buyerActor);
		expect(result).toEqual({ ok: false, reason: 'Rejection requires a reason' });
	});

	it('fails on empty-string reason', () => {
		const result = canTransition(makeRfq('DRAFT'), 'DRAFT', 'REJECTED', buyerActor, '');
		expect(result.ok).toBe(false);
	});

	it('fails on whitespace-only reason', () => {
		const result = canTransition(makeRfq('DRAFT'), 'DRAFT', 'REJECTED', buyerActor, '   ');
		expect(result.ok).toBe(false);
	});

	it('succeeds with a non-empty trimmed reason', () => {
		const result = canTransition(
			makeRfq('DRAFT'),
			'DRAFT',
			'REJECTED',
			buyerActor,
			'too expensive'
		);
		expect(result).toEqual({ ok: true });
	});

	it('reason not required for ACCEPTED', () => {
		const result = canTransition(makeRfq('QUOTED'), 'QUOTED', 'ACCEPTED', buyerActor);
		expect(result).toEqual({ ok: true });
	});

	it('reason not required for EXPIRED', () => {
		const result = canTransition(makeRfq('SUBMITTED'), 'SUBMITTED', 'EXPIRED', systemActor);
		expect(result).toEqual({ ok: true });
	});
});

describe('canTransition — optimistic-locking state drift', () => {
	it('fails when rfq.status differs from `from` (caller passed stale read)', () => {
		const rfq = makeRfq('SUBMITTED');
		const result = canTransition(rfq, 'DRAFT', 'SUBMITTED', buyerActor);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toContain('SUBMITTED');
			expect(result.reason).toContain('DRAFT');
		}
	});

	it('the actual rfq.status is reported in the error', () => {
		const rfq = makeRfq('ACCEPTED');
		const result = canTransition(rfq, 'QUOTED', 'REJECTED', buyerActor, 'because');
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.reason).toMatch(/ACCEPTED/);
	});
});

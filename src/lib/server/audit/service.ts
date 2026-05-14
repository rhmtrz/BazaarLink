import type { AuditEventType, Prisma } from '@prisma/client';
import { prisma } from '$lib/server/prisma';

export type RecordAuditEventInput = {
	type: AuditEventType;
	actorUserId?: string | null;
	sessionId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	payload?: Prisma.InputJsonValue;
};

export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
	await prisma.auditEvent.create({
		data: {
			type: input.type,
			actorUserId: input.actorUserId ?? null,
			sessionId: input.sessionId ?? null,
			ipAddress: input.ipAddress ?? null,
			userAgent: input.userAgent ?? null,
			payload: input.payload
		}
	});
}

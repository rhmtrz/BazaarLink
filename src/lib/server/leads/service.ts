import type { LeadRoleIntent } from '@prisma/client';
import { z } from 'zod';
import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const inquirySchema = z.object({
	email: z.email().max(254),
	name: z.string().trim().max(120).optional(),
	message: z.string().trim().min(10).max(2000),
	roleIntent: z.enum(['BUYER', 'SUPPLIER']).optional()
});

export type CreateLeadInput = {
	email: string;
	name?: string;
	message: string;
	roleIntent?: LeadRoleIntent;
	ipAddress?: string;
	userAgent?: string;
};

export async function createLead(input: CreateLeadInput): Promise<{ id: string }> {
	const parsed = inquirySchema.safeParse({
		email: input.email,
		name: input.name,
		message: input.message,
		roleIntent: input.roleIntent
	});
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const lead = await prisma.lead.create({
		data: {
			email: parsed.data.email.toLowerCase(),
			name: parsed.data.name,
			message: parsed.data.message,
			roleIntent: parsed.data.roleIntent ?? null,
			ipAddress: input.ipAddress,
			userAgent: input.userAgent
		}
	});
	return { id: lead.id };
}

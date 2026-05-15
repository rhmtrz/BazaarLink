import type { Supplier } from '@prisma/client';
import { z } from 'zod';
import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

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

export type UpsertSupplierInput = {
	companyName: string;
	country: string;
	phone?: string;
};

export async function getSupplierByUserId(userId: string): Promise<Supplier | null> {
	return prisma.supplier.findUnique({ where: { userId } });
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

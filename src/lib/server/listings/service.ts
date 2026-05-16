import { randomUUID } from 'node:crypto';
import type { Listing, Photo } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { deleteImage, saveImage } from '$lib/server/storage';

const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

const listingSchema = z.object({
	title: z.string().trim().min(1).max(200),
	description: z.string().trim().min(1).max(5000),
	material: z
		.string()
		.trim()
		.max(100)
		.optional()
		.or(z.literal('').transform(() => undefined)),
	origin: z
		.string()
		.trim()
		.max(100)
		.optional()
		.or(z.literal('').transform(() => undefined)),
	size: z
		.string()
		.trim()
		.max(50)
		.optional()
		.or(z.literal('').transform(() => undefined)),
	dimensions: z
		.string()
		.trim()
		.max(50)
		.optional()
		.or(z.literal('').transform(() => undefined)),
	weave: z
		.string()
		.trim()
		.max(100)
		.optional()
		.or(z.literal('').transform(() => undefined)),
	indicativePriceCents: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
	tags: z.array(z.string().trim().min(1).max(50)).max(20).optional()
});

async function supplierForUser(userId: string) {
	const supplier = await prisma.supplier.findUnique({ where: { userId } });
	if (!supplier) throw error(404, 'Supplier profile not found');
	return supplier;
}

export async function getListingById(id: string) {
	return prisma.listing.findUnique({
		where: { id },
		include: { supplier: { select: { id: true, userId: true } } }
	});
}

const APPROVED_PUBLISHED = {
	status: 'PUBLISHED' as const,
	supplier: { kycStatus: 'APPROVED' as const }
};

export async function listPublishedListings() {
	return prisma.listing.findMany({
		where: APPROVED_PUBLISHED,
		include: {
			supplier: { select: { companyName: true, country: true } },
			photos: { take: 1, orderBy: { createdAt: 'asc' } }
		},
		orderBy: { createdAt: 'desc' },
		take: 100
	});
}

export async function getPublishedListingById(id: string) {
	return prisma.listing.findFirst({
		where: { id, ...APPROVED_PUBLISHED },
		include: {
			supplier: { select: { companyName: true, country: true } },
			photos: { orderBy: { createdAt: 'asc' } }
		}
	});
}

export async function getListingWithPhotos(listingId: string, userId: string) {
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: {
			supplier: { select: { userId: true, kycStatus: true } },
			photos: { orderBy: { createdAt: 'asc' } }
		}
	});
	if (!listing) throw error(404, 'Listing not found');
	if (listing.supplier.userId !== userId) throw error(403, 'Not your listing');
	return listing;
}

export async function listMyListings(userId: string) {
	const supplier = await supplierForUser(userId);
	return prisma.listing.findMany({
		where: { supplierId: supplier.id },
		include: {
			photos: { take: 1, orderBy: { createdAt: 'asc' } },
			_count: { select: { photos: true } }
		},
		orderBy: { createdAt: 'desc' }
	});
}

export async function createListing(userId: string, input: unknown): Promise<Listing> {
	const parsed = listingSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);
	const supplier = await supplierForUser(userId);
	return prisma.listing.create({
		data: {
			supplierId: supplier.id,
			title: parsed.data.title,
			description: parsed.data.description,
			material: parsed.data.material,
			origin: parsed.data.origin,
			size: parsed.data.size,
			dimensions: parsed.data.dimensions,
			weave: parsed.data.weave,
			indicativePriceCents: parsed.data.indicativePriceCents ?? null,
			tags: parsed.data.tags ?? []
		}
	});
}

export async function updateListing(
	listingId: string,
	userId: string,
	input: unknown
): Promise<Listing> {
	const parsed = listingSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: { supplier: { select: { userId: true } } }
	});
	if (!listing) throw error(404, 'Listing not found');
	if (listing.supplier.userId !== userId) throw error(403, 'Not your listing');
	return prisma.listing.update({
		where: { id: listingId },
		data: {
			title: parsed.data.title,
			description: parsed.data.description,
			material: parsed.data.material,
			origin: parsed.data.origin,
			size: parsed.data.size,
			dimensions: parsed.data.dimensions,
			weave: parsed.data.weave,
			indicativePriceCents: parsed.data.indicativePriceCents ?? null,
			tags: parsed.data.tags ?? []
		}
	});
}

export async function publishListing(listingId: string, userId: string): Promise<Listing> {
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: { supplier: { select: { userId: true, kycStatus: true } } }
	});
	if (!listing) throw error(404, 'Listing not found');
	if (listing.supplier.userId !== userId) throw error(403, 'Not your listing');
	if (listing.supplier.kycStatus !== 'APPROVED') {
		throw error(403, 'KYC approval required before publishing listings');
	}
	return prisma.listing.update({ where: { id: listingId }, data: { status: 'PUBLISHED' } });
}

export async function unpublishListing(listingId: string, userId: string): Promise<Listing> {
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: { supplier: { select: { userId: true } } }
	});
	if (!listing) throw error(404, 'Listing not found');
	if (listing.supplier.userId !== userId) throw error(403, 'Not your listing');
	return prisma.listing.update({ where: { id: listingId }, data: { status: 'DRAFT' } });
}

export async function deleteListing(listingId: string, userId: string): Promise<void> {
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: {
			supplier: { select: { userId: true } },
			photos: { select: { objectKey: true } }
		}
	});
	if (!listing) throw error(404, 'Listing not found');
	if (listing.supplier.userId !== userId) throw error(403, 'Not your listing');
	const keys = listing.photos.map((p) => p.objectKey);
	await prisma.listing.delete({ where: { id: listingId } });
	for (const k of keys) await deleteImage(k);
}

export async function getPhotoByObjectKey(objectKey: string) {
	return prisma.photo.findUnique({ where: { objectKey } });
}

export async function addPhotoToListing(
	listingId: string,
	userId: string,
	file: { originalName: string; mimeType: string; sizeBytes: number; buffer: Buffer }
): Promise<Photo> {
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: { supplier: { select: { userId: true } } }
	});
	if (!listing) throw error(404, 'Listing not found');
	if (listing.supplier.userId !== userId) throw error(403, 'Not your listing');

	const ext = EXT_BY_MIME[file.mimeType];
	if (!ext) throw error(400, 'Unsupported file type');

	const photoId = randomUUID();
	const objectKey = `${listingId}/${photoId}.${ext}`;

	await saveImage(objectKey, file.buffer);

	return prisma.photo.create({
		data: {
			id: photoId,
			listingId,
			objectKey,
			originalName: file.originalName,
			mimeType: file.mimeType,
			sizeBytes: file.sizeBytes
		}
	});
}

export async function removePhotoFromListing(photoId: string, userId: string): Promise<void> {
	const photo = await prisma.photo.findUnique({
		where: { id: photoId },
		include: { listing: { select: { supplier: { select: { userId: true } } } } }
	});
	if (!photo) throw error(404, 'Photo not found');
	if (photo.listing.supplier.userId !== userId) throw error(403, 'Not your photo');

	await prisma.photo.delete({ where: { id: photoId } });
	await deleteImage(photo.objectKey);
}

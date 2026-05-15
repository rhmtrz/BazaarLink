import { randomUUID } from 'node:crypto';
import type { Photo } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { deleteImage, saveImage } from '$lib/server/storage';

const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

export async function getListingById(id: string) {
	return prisma.listing.findUnique({
		where: { id },
		include: { supplier: { select: { id: true, userId: true } } }
	});
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

import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addPhotoToListing } from '$lib/server/listings';

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 25 * 1024 * 1024;

export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) throw error(401, 'Sign in required');

	const formData = await request.formData();
	const file = formData.get('file');
	if (!(file instanceof File)) throw error(400, 'Missing file');
	if (!ALLOWED_MIMES.has(file.type)) throw error(400, 'Unsupported file type');
	if (file.size > MAX_BYTES) throw error(413, 'File too large (25 MB max)');
	if (file.size === 0) throw error(400, 'Empty file');

	const buffer = Buffer.from(await file.arrayBuffer());
	const photo = await addPhotoToListing(params.id, locals.user.id, {
		originalName: file.name,
		mimeType: file.type,
		sizeBytes: file.size,
		buffer
	});

	return json({
		id: photo.id,
		objectKey: photo.objectKey,
		url: `/uploads/${photo.objectKey}`
	});
};

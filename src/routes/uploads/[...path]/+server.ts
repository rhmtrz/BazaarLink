import { error } from '@sveltejs/kit';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { RequestHandler } from './$types';
import { getImageFullPath } from '$lib/server/storage';
import { getPhotoByObjectKey } from '$lib/server/listings';

export const GET: RequestHandler = async ({ params }) => {
	const objectKey = params.path;
	const photo = await getPhotoByObjectKey(objectKey);
	if (!photo) throw error(404, 'Not found');

	const fp = getImageFullPath(objectKey);
	try {
		await stat(fp);
	} catch {
		throw error(404, 'File missing');
	}

	const nodeStream = createReadStream(fp);
	const webStream = Readable.toWeb(nodeStream) as ReadableStream;
	return new Response(webStream, {
		headers: {
			'content-type': photo.mimeType,
			'content-length': String(photo.sizeBytes),
			'cache-control': 'public, max-age=31536000, immutable'
		}
	});
};

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { removePhotoFromListing } from '$lib/server/listings';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Sign in required');
	await removePhotoFromListing(params.photoId, locals.user.id);
	return new Response(null, { status: 204 });
};

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listMyListings } from '$lib/server/listings';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const listings = await listMyListings(locals.user.id);
	return { listings };
};

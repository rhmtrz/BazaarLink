import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublishedListingById } from '$lib/server/listings';

export const load: PageServerLoad = async ({ params }) => {
	const listing = await getPublishedListingById(params.id);
	if (!listing) throw error(404, 'Listing not found');
	return { listing };
};

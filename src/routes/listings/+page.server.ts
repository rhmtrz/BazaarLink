import type { PageServerLoad } from './$types';
import { listPublishedListings } from '$lib/server/listings';

export const load: PageServerLoad = async () => {
	const listings = await listPublishedListings();
	return { listings };
};

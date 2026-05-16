import type { PageServerLoad } from './$types';
import { listAllListings } from '$lib/server/listings';

const ALLOWED = ['PUBLISHED', 'DRAFT', 'HIDDEN'] as const;
type Status = (typeof ALLOWED)[number];

export const load: PageServerLoad = async ({ url }) => {
	const raw = url.searchParams.get('status');
	const status: Status | undefined = (ALLOWED as readonly string[]).includes(raw ?? '')
		? (raw as Status)
		: raw === 'ALL'
			? undefined
			: 'PUBLISHED';
	const listings = await listAllListings({ status });
	return { listings, currentStatus: status ?? 'ALL' };
};

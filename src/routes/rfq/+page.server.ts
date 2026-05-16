import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listMyRfqs } from '$lib/server/rfq';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}
	const rfqs = await listMyRfqs(locals.user.id);
	return { rfqs };
};

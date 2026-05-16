import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getListingForAdmin, hideListing, restoreListing } from '$lib/server/listings';

export const load: PageServerLoad = async ({ params }) => {
	const listing = await getListingForAdmin(params.id);
	if (!listing) throw error(404, 'Listing not found');
	return { listing };
};

export const actions: Actions = {
	hide: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw error(403, 'Admin only');
		const data = await request.formData();
		const reason = String(data.get('reason') ?? '');
		try {
			await hideListing(params.id, locals.user.id, { reason });
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { reason, error: err.body.message });
			throw err;
		}
		throw redirect(303, '/admin/listings');
	},
	restore: async ({ params, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw error(403, 'Admin only');
		try {
			await restoreListing(params.id, locals.user.id);
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { error: err.body.message });
			throw err;
		}
		throw redirect(303, '/admin/listings');
	}
};

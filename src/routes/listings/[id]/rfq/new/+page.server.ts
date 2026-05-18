import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPublishedListingById } from '$lib/server/listings';
import { submitRfq } from '$lib/server/rfq';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!locals.user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}
	const listing = await getPublishedListingById(params.id);
	if (!listing) throw error(404, 'Listing not found');
	return { listing };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const message = String(data.get('message') ?? '');
		const quantityRaw = String(data.get('quantity') ?? '').trim();
		const quantity = quantityRaw === '' ? null : Math.floor(Number(quantityRaw));

		const input = {
			message,
			quantity: quantityRaw === '' || Number.isNaN(quantity) ? null : quantity
		};

		let rfqId: string;
		try {
			const rfq = await submitRfq(locals.user.id, params.id, input);
			rfqId = rfq.id;
		} catch (err) {
			if (isHttpError(err)) {
				return fail(err.status, {
					message,
					quantity: quantityRaw,
					error: err.body.message
				});
			}
			throw err;
		}

		throw redirect(303, `/rfq/${rfqId}`);
	}
};

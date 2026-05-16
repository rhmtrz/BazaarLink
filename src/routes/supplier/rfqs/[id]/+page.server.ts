import { fail, isHttpError } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getIncomingRfqById, sendQuote } from '$lib/server/rfq';

export const load: PageServerLoad = async ({ params, locals }) => {
	const rfq = await getIncomingRfqById(locals.user!.id, params.id);
	return { rfq };
};

export const actions: Actions = {
	sendQuote: async ({ request, params, locals }) => {
		const data = await request.formData();
		const priceRaw = String(data.get('price') ?? '').trim();
		const quantityRaw = String(data.get('quantity') ?? '').trim();
		const message = String(data.get('message') ?? '');
		const validUntilRaw = String(data.get('validUntil') ?? '').trim();

		const priceCents = priceRaw === '' ? NaN : Math.round(Number(priceRaw) * 100);
		const quantity = quantityRaw === '' ? NaN : Math.floor(Number(quantityRaw));
		const validUntil = validUntilRaw === '' ? null : new Date(validUntilRaw);

		const input = {
			priceCents,
			quantity,
			message,
			validUntil: validUntil && !Number.isNaN(validUntil.getTime()) ? validUntil : null
		};

		try {
			await sendQuote(locals.user!.id, params.id, input);
			return { success: true as const };
		} catch (err) {
			if (isHttpError(err)) {
				return fail(err.status, {
					price: priceRaw,
					quantity: quantityRaw,
					message,
					validUntil: validUntilRaw,
					error: err.body.message
				});
			}
			throw err;
		}
	}
};

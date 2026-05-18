import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { acceptQuote, getMyRfqById, rejectRfq } from '$lib/server/rfq';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!locals.user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}
	const rfq = await getMyRfqById(locals.user.id, params.id);
	return { rfq };
};

export const actions: Actions = {
	acceptQuote: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const quoteId = String(data.get('quoteId') ?? '');
		if (!quoteId) return fail(400, { error: 'Missing quote id' });
		try {
			await acceptQuote(locals.user.id, quoteId);
			return { success: true, action: 'accepted' as const };
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { error: err.body.message });
			throw err;
		}
	},
	rejectRfq: async ({ request, params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const reason = String(data.get('reason') ?? '');
		try {
			await rejectRfq(locals.user.id, params.id, { reason });
			return { success: true, action: 'rejected' as const };
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { error: err.body.message, reason });
			throw err;
		}
	}
};

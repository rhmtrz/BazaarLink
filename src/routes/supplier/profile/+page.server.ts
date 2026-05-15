import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSupplierByUserId, upsertSupplier } from '$lib/server/suppliers';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const supplier = await getSupplierByUserId(locals.user.id);
	return { supplier };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const companyName = String(data.get('companyName') ?? '');
		const country = String(data.get('country') ?? '');
		const phone = String(data.get('phone') ?? '').trim() || undefined;

		try {
			await upsertSupplier(locals.user.id, { companyName, country, phone });
		} catch (err) {
			if (isHttpError(err)) {
				return fail(err.status, { companyName, country, phone, error: err.body.message });
			}
			throw err;
		}

		return { success: true };
	}
};

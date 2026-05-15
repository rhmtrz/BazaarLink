import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { approveSupplier, getSupplierById, rejectSupplier } from '$lib/server/suppliers';

export const load: PageServerLoad = async ({ params }) => {
	const supplier = await getSupplierById(params.id);
	if (!supplier) throw error(404, 'Supplier not found');
	return { supplier };
};

export const actions: Actions = {
	approve: async ({ params, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw error(403, 'Admin only');
		try {
			await approveSupplier(params.id, locals.user.id);
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { error: err.body.message });
			throw err;
		}
		throw redirect(303, '/admin/suppliers');
	},
	reject: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw error(403, 'Admin only');
		const data = await request.formData();
		const reason = String(data.get('reason') ?? '');
		try {
			await rejectSupplier(params.id, locals.user.id, { reason });
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { reason, error: err.body.message });
			throw err;
		}
		throw redirect(303, '/admin/suppliers');
	}
};

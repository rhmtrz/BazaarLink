import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { changePassword } from '$lib/server/auth';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const data = await request.formData();
		const currentPassword = String(data.get('currentPassword') ?? '');
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match' });
		}

		try {
			await changePassword(locals.user.id, { currentPassword, newPassword });
		} catch (err) {
			if (isHttpError(err)) {
				return fail(err.status, { error: err.body.message });
			}
			throw err;
		}

		throw redirect(303, '/');
	}
};

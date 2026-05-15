import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { inviteUser } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		if (locals.user.role !== 'ADMIN') throw error(403, 'Admin only');

		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const role = String(data.get('role') ?? '');

		try {
			const result = await inviteUser({ email, role }, locals.user.id);
			return {
				success: true,
				email: result.email,
				role: result.role,
				tempPassword: result.tempPassword
			};
		} catch (err) {
			if (isHttpError(err)) {
				return fail(err.status, { email, role, error: err.body.message });
			}
			throw err;
		}
	}
};

import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { clearAuthCookie, logout } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ cookies, locals, request, getClientAddress }) => {
		if (locals.session) {
			await logout(locals.session.id, {
				ipAddress: getClientAddress(),
				userAgent: request.headers.get('user-agent') ?? undefined
			});
		}
		clearAuthCookie(cookies);
		throw redirect(303, '/login');
	}
};

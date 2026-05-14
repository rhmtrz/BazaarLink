import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { login, setAuthCookie } from '$lib/server/auth';
import { enforceRateLimit } from '$lib/server/rate-limit';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent') ?? undefined;
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		try {
			await enforceRateLimit(`login:${ip}`, 5, 60_000);
			const result = await login({ email, password }, { ipAddress: ip, userAgent });
			setAuthCookie(cookies, result.token);
		} catch (err) {
			if (isHttpError(err)) {
				return fail(err.status, { email, error: err.body.message });
			}
			throw err;
		}

		throw redirect(303, '/');
	}
};

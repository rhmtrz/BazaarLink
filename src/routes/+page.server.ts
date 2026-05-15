import { fail, isHttpError } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createLead } from '$lib/server/leads';
import { enforceRateLimit } from '$lib/server/rate-limit';

export const actions: Actions = {
	inquire: async ({ request, getClientAddress }) => {
		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent') ?? undefined;
		const data = await request.formData();

		if (String(data.get('company_url') ?? '').length > 0) {
			return { success: true };
		}

		const email = String(data.get('email') ?? '');
		const name = String(data.get('name') ?? '').trim() || undefined;
		const message = String(data.get('message') ?? '');
		const roleIntentRaw = String(data.get('roleIntent') ?? '');
		const roleIntent =
			roleIntentRaw === 'BUYER' || roleIntentRaw === 'SUPPLIER' ? roleIntentRaw : undefined;

		try {
			await enforceRateLimit(`inquire:${ip}`, 3, 15 * 60_000);
			await createLead({ email, name, message, roleIntent, ipAddress: ip, userAgent });
		} catch (err) {
			if (isHttpError(err)) {
				return fail(err.status, { email, name, message, roleIntent, error: err.body.message });
			}
			throw err;
		}

		return { success: true };
	}
};

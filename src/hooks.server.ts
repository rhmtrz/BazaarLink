import { randomUUID } from 'node:crypto';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';
import { AUTH_COOKIE_NAME, clearAuthCookie, loadSession } from '$lib/server/auth';

Sentry.init({
	dsn: env.SENTRY_DSN,
	tracesSampleRate: 0,
	enabled: !!env.SENTRY_DSN
});

const userHandle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.session = null;

	const token = event.cookies.get(AUTH_COOKIE_NAME);
	if (token) {
		const loaded = await loadSession(token);
		if (loaded) {
			event.locals.user = {
				id: loaded.user.id,
				email: loaded.user.email,
				role: loaded.user.role,
				mustChangePassword: loaded.user.mustChangePassword,
				supplier: loaded.user.supplier
					? { id: loaded.user.supplier.id, kycStatus: loaded.user.supplier.kycStatus }
					: null
			};
			event.locals.session = { id: loaded.session.id };
			Sentry.setUser({ id: loaded.user.id });
		} else {
			clearAuthCookie(event.cookies);
		}
	}

	if (
		event.locals.user?.mustChangePassword &&
		event.route.id &&
		event.route.id !== '/change-password' &&
		event.route.id !== '/logout'
	) {
		throw redirect(303, '/change-password');
	}

	if (
		event.locals.user?.role === 'SUPPLIER' &&
		event.locals.user.supplier === null &&
		event.route.id &&
		event.route.id !== '/supplier/profile' &&
		event.route.id !== '/logout' &&
		event.route.id !== '/change-password'
	) {
		throw redirect(303, '/supplier/profile');
	}

	return resolve(event);
};

const requestHandle: Handle = async ({ event, resolve }) => {
	const requestId = event.request.headers.get('x-request-id') ?? randomUUID();
	event.locals.requestId = requestId;

	const start = Date.now();
	const response = await resolve(event);
	const durationMs = Date.now() - start;

	response.headers.set('x-request-id', requestId);

	logger.info(
		{
			requestId,
			userId: event.locals.user?.id ?? null,
			method: event.request.method,
			path: event.url.pathname,
			status: response.status,
			durationMs
		},
		'request'
	);

	return response;
};

export const handle = sequence(Sentry.sentryHandle(), userHandle, requestHandle);

const requestHandleError: HandleServerError = ({ error, event, status, message }) => {
	const requestId = event.locals.requestId ?? 'unknown';
	const isServerError = status >= 500;

	logger.error(
		{
			requestId,
			method: event.request.method,
			path: event.url.pathname,
			status,
			err: error
		},
		message
	);

	return {
		message: isServerError ? 'Internal server error' : message,
		requestId
	};
};

export const handleError = Sentry.handleErrorWithSentry(requestHandleError);

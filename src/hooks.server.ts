import { randomUUID } from 'node:crypto';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';

Sentry.init({
	dsn: env.SENTRY_DSN,
	tracesSampleRate: 0,
	enabled: !!env.SENTRY_DSN
});

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
			method: event.request.method,
			path: event.url.pathname,
			status: response.status,
			durationMs
		},
		'request'
	);

	return response;
};

export const handle = sequence(Sentry.sentryHandle(), requestHandle);

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

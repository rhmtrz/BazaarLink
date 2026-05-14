import { randomUUID } from 'node:crypto';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';

export const handle: Handle = async ({ event, resolve }) => {
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

export const handleError: HandleServerError = ({ error, event, status, message }) => {
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

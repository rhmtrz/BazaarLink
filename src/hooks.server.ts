import { randomUUID } from 'node:crypto';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const requestId = event.request.headers.get('x-request-id') ?? randomUUID();
	event.locals.requestId = requestId;

	const start = Date.now();
	const response = await resolve(event);
	const durationMs = Date.now() - start;

	response.headers.set('x-request-id', requestId);

	console.log(
		JSON.stringify({
			level: 'info',
			requestId,
			method: event.request.method,
			path: event.url.pathname,
			status: response.status,
			durationMs
		})
	);

	return response;
};

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const requestId = event.locals.requestId ?? 'unknown';
	const isServerError = status >= 500;

	console.error(
		JSON.stringify({
			level: 'error',
			requestId,
			method: event.request.method,
			path: event.url.pathname,
			status,
			message,
			error:
				error instanceof Error
					? { name: error.name, message: error.message, stack: error.stack }
					: error
		})
	);

	return {
		message: isServerError ? 'Internal server error' : message,
		requestId
	};
};

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = ({ locals }) => {
	return json({ status: 'ok', requestId: locals.requestId });
};

import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	deleteListing,
	getListingWithPhotos,
	publishListing,
	unpublishListing,
	updateListing
} from '$lib/server/listings';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const listing = await getListingWithPhotos(params.id, locals.user.id);
	return { listing };
};

function parseListingForm(data: FormData) {
	const indicativeRaw = String(data.get('indicativePrice') ?? '').trim();
	const indicativePriceCents =
		indicativeRaw === '' ? undefined : Math.round(Number(indicativeRaw) * 100);
	const tagsRaw = String(data.get('tags') ?? '');
	const tags = Array.from(
		new Set(
			tagsRaw
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		)
	);
	return {
		title: String(data.get('title') ?? ''),
		description: String(data.get('description') ?? ''),
		material: String(data.get('material') ?? '').trim() || undefined,
		origin: String(data.get('origin') ?? '').trim() || undefined,
		size: String(data.get('size') ?? '').trim() || undefined,
		dimensions: String(data.get('dimensions') ?? '').trim() || undefined,
		weave: String(data.get('weave') ?? '').trim() || undefined,
		indicativePriceCents,
		tags
	};
}

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const input = parseListingForm(data);
		try {
			await updateListing(params.id, locals.user.id, input);
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { error: err.body.message });
			throw err;
		}
		return { success: true };
	},

	publish: async ({ params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		try {
			await publishListing(params.id, locals.user.id);
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { error: err.body.message });
			throw err;
		}
		return { success: true };
	},

	unpublish: async ({ params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		try {
			await unpublishListing(params.id, locals.user.id);
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { error: err.body.message });
			throw err;
		}
		return { success: true };
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		try {
			await deleteListing(params.id, locals.user.id);
		} catch (err) {
			if (isHttpError(err)) return fail(err.status, { error: err.body.message });
			throw err;
		}
		throw redirect(303, '/supplier/listings');
	}
};

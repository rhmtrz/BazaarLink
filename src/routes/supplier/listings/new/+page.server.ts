import { fail, isHttpError, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createListing } from '$lib/server/listings';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
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
	default: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const input = parseListingForm(data);

		let createdId: string;
		try {
			const listing = await createListing(locals.user.id, input);
			createdId = listing.id;
		} catch (err) {
			if (isHttpError(err)) {
				return fail(err.status, {
					title: input.title,
					description: input.description,
					material: input.material,
					origin: input.origin,
					size: input.size,
					dimensions: input.dimensions,
					weave: input.weave,
					indicativePrice:
						input.indicativePriceCents != null ? String(input.indicativePriceCents / 100) : '',
					tags: input.tags.join(', '),
					error: err.body.message
				});
			}
			throw err;
		}

		throw redirect(303, `/supplier/listings/${createdId}/edit`);
	}
};

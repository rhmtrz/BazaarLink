<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const listing = $derived(data.listing);

	function formatPrice(cents: number | null): string {
		if (cents == null) return 'Price on request';
		return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
	}
</script>

<svelte:head><title>Request a quote — {listing.title}</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-2xl space-y-6 py-12">
		<header class="space-y-2">
			<a
				href={resolve(`/listings/${listing.id}`)}
				class="text-sm text-primary-light hover:underline"
			>
				← Back to listing
			</a>
			<h1 class="text-2xl font-semibold">Request a quote</h1>
			<p class="text-sm text-neutral-400">
				The supplier will see your email and message. They'll reply with a quote.
			</p>
		</header>

		<section class="flex gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
			{#if listing.photos.length > 0}
				<img
					src="/uploads/{listing.photos[0].objectKey}"
					alt={listing.title}
					class="h-20 w-20 rounded object-cover"
				/>
			{/if}
			<div class="space-y-1">
				<div class="font-medium">{listing.title}</div>
				<div class="text-xs text-neutral-500">
					by {listing.supplier.companyName} · {listing.supplier.country}
				</div>
				<div class="text-sm">{formatPrice(listing.indicativePriceCents)}</div>
			</div>
		</section>

		{#if form?.error}
			<div
				role="alert"
				class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
			>
				{form.error}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<div class="space-y-1">
				<label for="message" class="block text-sm">Message to supplier</label>
				<textarea
					id="message"
					name="message"
					required
					rows="6"
					minlength="10"
					maxlength="2000"
					placeholder="Describe what you need — quantity, target lead time, any customisation."
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					>{form?.message ?? ''}</textarea
				>
				<p class="text-xs text-neutral-500">10–2000 characters.</p>
			</div>

			<div class="space-y-1">
				<label for="quantity" class="block text-sm">
					Quantity <span class="text-neutral-500">(optional)</span>
				</label>
				<input
					id="quantity"
					name="quantity"
					type="number"
					min="1"
					step="1"
					placeholder="1"
					value={form?.quantity ?? ''}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
			>
				Send request
			</button>
		</form>
	</div>
</main>

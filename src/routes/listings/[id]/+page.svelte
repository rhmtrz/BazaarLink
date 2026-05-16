<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const listing = $derived(data.listing);

	function formatPrice(cents: number | null): string {
		if (cents == null) return 'Price on request';
		return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
	}

	const attributes = $derived(
		(
			[
				['Material', listing.material],
				['Origin', listing.origin],
				['Size', listing.size],
				['Dimensions', listing.dimensions],
				['Weave', listing.weave]
			] as const
		).filter(([, v]) => v !== null && v !== '')
	);
</script>

<svelte:head><title>{listing.title} — bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-3xl space-y-6 py-12">
		<a href={resolve('/listings')} class="text-sm text-primary-light hover:underline"
			>← Back to rugs</a
		>

		<header class="space-y-1">
			<h1 class="text-3xl font-semibold">{listing.title}</h1>
			<p class="text-sm text-neutral-400">
				by {listing.supplier.companyName} · {listing.supplier.country}
			</p>
		</header>

		{#if listing.photos.length > 0}
			<section class="space-y-3">
				{#each listing.photos as p (p.id)}
					<img
						src="/uploads/{p.objectKey}"
						alt={p.originalName}
						loading="lazy"
						class="w-full rounded-lg border border-neutral-800"
					/>
				{/each}
			</section>
		{/if}

		{#if attributes.length > 0}
			<section class="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
				<dl class="grid grid-cols-2 gap-3 text-sm">
					{#each attributes as [label, value] (label)}
						<div>
							<dt class="text-neutral-500">{label}</dt>
							<dd>{value}</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/if}

		<section class="space-y-2">
			<h2 class="text-lg font-semibold">Description</h2>
			<p class="text-sm whitespace-pre-line text-neutral-300">{listing.description}</p>
		</section>

		{#if listing.tags.length > 0}
			<section class="flex flex-wrap gap-2">
				{#each listing.tags as tag (tag)}
					<span class="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-300">{tag}</span>
				{/each}
			</section>
		{/if}

		<section
			class="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 p-4"
		>
			<div>
				<div class="text-xs text-neutral-500">Indicative price</div>
				<div class="text-xl font-semibold">{formatPrice(listing.indicativePriceCents)}</div>
			</div>

			{#if data.user}
				<button
					type="button"
					disabled
					title="RFQ flow coming soon"
					class="cursor-not-allowed rounded bg-primary px-4 py-2 text-sm font-medium text-white opacity-50"
				>
					Request a quote
				</button>
			{:else}
				<a
					href={resolve('/login')}
					class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
				>
					Sign in to request a quote
				</a>
			{/if}
		</section>
	</div>
</main>

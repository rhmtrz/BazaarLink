<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function formatPrice(cents: number | null): string {
		if (cents == null) return 'Price on request';
		return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
	}
</script>

<svelte:head><title>Rugs — bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-6xl space-y-6 py-12">
		<header class="space-y-2">
			<h1 class="text-3xl font-semibold">Rugs</h1>
			<p class="text-sm text-neutral-400">
				Hand-knotted and flat-weave rugs from approved Afghan suppliers.
			</p>
		</header>

		{#if data.listings.length === 0}
			<div class="rounded-lg border border-neutral-800 bg-neutral-950 p-8 text-center">
				<p class="text-neutral-400">No listings yet — check back soon.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.listings as l (l.id)}
					<a
						href={resolve(`/listings/${l.id}`)}
						class="group block overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 transition-colors hover:border-primary"
					>
						{#if l.photos.length > 0}
							<img
								src="/uploads/{l.photos[0].objectKey}"
								alt={l.title}
								loading="lazy"
								class="aspect-square w-full object-cover"
							/>
						{:else}
							<div
								class="flex aspect-square w-full items-center justify-center bg-primary-dark/20 text-neutral-500"
							>
								<span class="text-xs">no photo</span>
							</div>
						{/if}
						<div class="space-y-1 p-3">
							<h2 class="font-medium group-hover:text-primary-light">{l.title}</h2>
							<p class="text-sm text-neutral-300">{formatPrice(l.indicativePriceCents)}</p>
							<p class="text-xs text-neutral-500">
								by {l.supplier.companyName} · {l.supplier.country}
							</p>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</main>

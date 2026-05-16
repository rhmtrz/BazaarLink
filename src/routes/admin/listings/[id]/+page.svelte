<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const l = $derived(data.listing);

	function formatPrice(cents: number | null): string {
		if (cents == null) return 'Price on request';
		return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
	}

	const attributes = $derived(
		(
			[
				['Material', l.material],
				['Origin', l.origin],
				['Size', l.size],
				['Dimensions', l.dimensions],
				['Weave', l.weave]
			] as const
		).filter(([, v]) => v !== null && v !== '')
	);
</script>

<svelte:head><title>{l.title} — Admin</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-3xl space-y-6 py-12">
		<header class="space-y-2">
			<a href={resolve('/admin/listings')} class="text-sm text-primary-light hover:underline">
				← Back to listings
			</a>
			<div class="flex items-center justify-between gap-4">
				<h1 class="text-2xl font-semibold">{l.title}</h1>
				<span
					class="rounded px-2 py-0.5 text-xs {l.status === 'DRAFT'
						? 'bg-neutral-800 text-neutral-300'
						: l.status === 'PUBLISHED'
							? 'bg-emerald-950 text-emerald-200'
							: 'bg-red-950 text-red-200'}"
				>
					{l.status}
				</span>
			</div>
			<p class="text-sm text-neutral-400">
				by {l.supplier.companyName} · {l.supplier.country} · {l.supplier.user.email}
			</p>
		</header>

		{#if l.photos.length > 0}
			<section class="grid grid-cols-3 gap-3">
				{#each l.photos as p (p.id)}
					<img
						src="/uploads/{p.objectKey}"
						alt={p.originalName}
						loading="lazy"
						class="aspect-square w-full rounded border border-neutral-800 object-cover"
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
			<p class="text-sm whitespace-pre-line text-neutral-300">{l.description}</p>
		</section>

		{#if l.tags.length > 0}
			<section class="flex flex-wrap gap-2">
				{#each l.tags as tag (tag)}
					<span class="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-300">{tag}</span>
				{/each}
			</section>
		{/if}

		<section class="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
			<div class="text-xs text-neutral-500">Indicative price</div>
			<div class="text-xl font-semibold">{formatPrice(l.indicativePriceCents)}</div>
		</section>

		{#if form?.error}
			<div
				role="alert"
				class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
			>
				{form.error}
			</div>
		{/if}

		{#if l.status === 'HIDDEN'}
			<section class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
				<h2 class="text-lg font-semibold">Restore</h2>
				<p class="text-sm text-neutral-400">
					Moves the listing back to DRAFT. The supplier can republish it (if their KYC is approved).
				</p>
				<form method="POST" action="?/restore" use:enhance>
					<button
						type="submit"
						class="rounded bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-600"
					>
						Restore listing
					</button>
				</form>
			</section>
		{:else}
			<section class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
				<h2 class="text-lg font-semibold">Hide</h2>
				<p class="text-sm text-neutral-400">
					Removes the listing from public browsing and blocks the supplier from republishing until
					restored. Reason goes into the audit log (admin-only).
				</p>
				<form method="POST" action="?/hide" use:enhance class="space-y-3">
					<div class="space-y-1">
						<label for="reason" class="block text-sm">Reason</label>
						<textarea
							id="reason"
							name="reason"
							required
							minlength="1"
							maxlength="500"
							rows="3"
							placeholder="e.g. Stock photo from competitor site, suspected counterfeit."
							class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
							>{form?.reason ?? ''}</textarea
						>
					</div>
					<button
						type="submit"
						class="rounded bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-600"
					>
						Hide listing
					</button>
				</form>
			</section>
		{/if}
	</div>
</main>

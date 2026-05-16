<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const listing = $derived(data.listing);
	const supplier = $derived(data.user?.supplier ?? null);
	const canPublish = $derived(supplier?.kycStatus === 'APPROVED');

	let uploading = $state(false);
	let uploadError = $state<string | null>(null);

	async function uploadPhoto(event: SubmitEvent) {
		event.preventDefault();
		const formEl = event.currentTarget as HTMLFormElement;
		const fileInput = formEl.elements.namedItem('file') as HTMLInputElement;
		const file = fileInput.files?.[0];
		if (!file) return;

		uploading = true;
		uploadError = null;
		const fd = new FormData();
		fd.append('file', file);

		const r = await fetch(`/supplier/listings/${listing.id}/photos`, {
			method: 'POST',
			body: fd
		});
		uploading = false;
		if (!r.ok) {
			uploadError = (await r.text()) || `Upload failed (${r.status})`;
			return;
		}
		formEl.reset();
		await invalidateAll();
	}

	async function deletePhoto(photoId: string) {
		const r = await fetch(`/supplier/listings/${listing.id}/photos/${photoId}`, {
			method: 'DELETE'
		});
		if (r.ok) await invalidateAll();
		else uploadError = `Delete failed (${r.status})`;
	}
</script>

<svelte:head><title>Edit listing — bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-3xl space-y-6 py-12">
		<header class="space-y-2">
			<a href={resolve('/supplier/listings')} class="text-sm text-primary-light hover:underline">
				← Back to listings
			</a>
			<div class="flex items-center justify-between gap-4">
				<h1 class="text-2xl font-semibold">Edit listing</h1>
				<span
					class="rounded px-2 py-0.5 text-xs {listing.status === 'DRAFT'
						? 'bg-neutral-800 text-neutral-300'
						: listing.status === 'PUBLISHED'
							? 'bg-emerald-950 text-emerald-200'
							: 'bg-red-950 text-red-200'}"
				>
					{listing.status}
				</span>
			</div>
		</header>

		{#if listing.status === 'HIDDEN'}
			<div
				role="status"
				class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
			>
				This listing was hidden by an admin. You can still edit it, but you can't republish until
				it's restored. Contact us if you'd like to discuss.
			</div>
		{:else if !canPublish && listing.status === 'DRAFT'}
			<div
				role="status"
				class="rounded border border-amber-700 bg-amber-950 px-3 py-2 text-sm text-amber-100"
			>
				You can save drafts, but publishing requires KYC approval. Submit your
				<a href={resolve('/supplier/profile')} class="underline">supplier profile</a> and wait for review.
			</div>
		{/if}

		{#if form?.success}
			<div
				role="status"
				class="rounded border border-emerald-700 bg-emerald-950 px-3 py-2 text-sm text-emerald-100"
			>
				Saved.
			</div>
		{/if}

		{#if form?.error}
			<div
				role="alert"
				class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
			>
				{form.error}
			</div>
		{/if}

		<!-- Photos -->
		<section class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
			<h2 class="text-lg font-semibold">Photos</h2>

			{#if listing.photos.length === 0}
				<p class="text-sm text-neutral-500">No photos yet.</p>
			{:else}
				<div class="grid grid-cols-3 gap-3">
					{#each listing.photos as p (p.id)}
						<div class="space-y-1">
							<img
								src="/uploads/{p.objectKey}"
								alt={p.originalName}
								class="aspect-square w-full rounded border border-neutral-800 object-cover"
							/>
							<button
								type="button"
								onclick={() => deletePhoto(p.id)}
								class="w-full rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-red-700 hover:text-red-200"
							>
								Delete
							</button>
						</div>
					{/each}
				</div>
			{/if}

			{#if uploadError}
				<div
					role="alert"
					class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
				>
					{uploadError}
				</div>
			{/if}

			<form onsubmit={uploadPhoto} class="flex items-center gap-3">
				<input
					name="file"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					required
					disabled={uploading}
					class="text-sm text-neutral-300"
				/>
				<button
					type="submit"
					disabled={uploading}
					class="rounded bg-primary px-3 py-1 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
				>
					{uploading ? 'Uploading…' : 'Upload'}
				</button>
			</form>
			<p class="text-xs text-neutral-500">JPEG / PNG / WebP, up to 25 MB.</p>
		</section>

		<!-- Listing fields -->
		<form method="POST" use:enhance class="space-y-4">
			<div class="space-y-1">
				<label for="title" class="block text-sm">Title</label>
				<input
					id="title"
					name="title"
					type="text"
					required
					maxlength="200"
					value={listing.title}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>

			<div class="space-y-1">
				<label for="description" class="block text-sm">Description</label>
				<textarea
					id="description"
					name="description"
					required
					rows="5"
					maxlength="5000"
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					>{listing.description}</textarea
				>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1">
					<label for="material" class="block text-sm"
						>Material <span class="text-neutral-500">(optional)</span></label
					>
					<input
						id="material"
						name="material"
						type="text"
						maxlength="100"
						value={listing.material ?? ''}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					/>
				</div>
				<div class="space-y-1">
					<label for="origin" class="block text-sm"
						>Origin <span class="text-neutral-500">(optional)</span></label
					>
					<input
						id="origin"
						name="origin"
						type="text"
						maxlength="100"
						value={listing.origin ?? ''}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					/>
				</div>
				<div class="space-y-1">
					<label for="size" class="block text-sm"
						>Size <span class="text-neutral-500">(optional)</span></label
					>
					<input
						id="size"
						name="size"
						type="text"
						maxlength="50"
						value={listing.size ?? ''}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					/>
				</div>
				<div class="space-y-1">
					<label for="dimensions" class="block text-sm"
						>Dimensions <span class="text-neutral-500">(optional)</span></label
					>
					<input
						id="dimensions"
						name="dimensions"
						type="text"
						maxlength="50"
						value={listing.dimensions ?? ''}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					/>
				</div>
				<div class="space-y-1">
					<label for="weave" class="block text-sm"
						>Weave <span class="text-neutral-500">(optional)</span></label
					>
					<input
						id="weave"
						name="weave"
						type="text"
						maxlength="100"
						value={listing.weave ?? ''}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					/>
				</div>
				<div class="space-y-1">
					<label for="indicativePrice" class="block text-sm"
						>Indicative price (USD) <span class="text-neutral-500">(optional)</span></label
					>
					<input
						id="indicativePrice"
						name="indicativePrice"
						type="number"
						min="0"
						step="1"
						value={listing.indicativePriceCents != null
							? String(Math.round(listing.indicativePriceCents / 100))
							: ''}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					/>
				</div>
			</div>

			<div class="space-y-1">
				<label for="tags" class="block text-sm"
					>Tags <span class="text-neutral-500">(comma-separated)</span></label
				>
				<input
					id="tags"
					name="tags"
					type="text"
					value={listing.tags.join(', ')}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>

			<div class="flex flex-wrap gap-2 pt-2">
				<button
					type="submit"
					formaction="?/save"
					class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
				>
					Save changes
				</button>
				{#if listing.status === 'DRAFT'}
					<button
						type="submit"
						formaction="?/publish"
						disabled={!canPublish}
						class="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
					>
						Publish
					</button>
				{:else if listing.status === 'PUBLISHED'}
					<button
						type="submit"
						formaction="?/unpublish"
						class="rounded border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-900"
					>
						Unpublish
					</button>
				{/if}
				<span class="grow"></span>
				<button
					type="submit"
					formaction="?/delete"
					class="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
				>
					Delete
				</button>
			</div>
		</form>
	</div>
</main>

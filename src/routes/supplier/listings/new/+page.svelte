<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>New listing — bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-2xl space-y-6 py-12">
		<header class="space-y-2">
			<a href={resolve('/supplier/listings')} class="text-sm text-primary-light hover:underline">
				← Back to listings
			</a>
			<h1 class="text-2xl font-semibold">New listing</h1>
			<p class="text-sm text-neutral-400">
				Save as draft first. You can add photos and publish on the next screen.
			</p>
		</header>

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
				<label for="title" class="block text-sm">Title</label>
				<input
					id="title"
					name="title"
					type="text"
					required
					maxlength="200"
					value={form?.title ?? ''}
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
					>{form?.description ?? ''}</textarea
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
						placeholder="Wool, silk…"
						value={form?.material ?? ''}
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
						placeholder="Mazar-i-Sharif"
						value={form?.origin ?? ''}
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
						placeholder="Runner / Medium"
						value={form?.size ?? ''}
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
						placeholder="200×300 cm"
						value={form?.dimensions ?? ''}
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
						placeholder="Hand-knotted"
						value={form?.weave ?? ''}
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
						placeholder="150"
						value={form?.indicativePrice ?? ''}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					/>
				</div>
			</div>

			<div class="space-y-1">
				<label for="tags" class="block text-sm"
					>Tags <span class="text-neutral-500">(optional, comma-separated)</span></label
				>
				<input
					id="tags"
					name="tags"
					type="text"
					placeholder="vintage, geometric, red"
					value={form?.tags ?? ''}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
			>
				Save as draft
			</button>
		</form>
	</div>
</main>

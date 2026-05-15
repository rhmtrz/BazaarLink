<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>My listings — bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-4xl space-y-6 py-12">
		<header class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold">My listings</h1>
			<a
				href={resolve('/supplier/listings/new')}
				class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
			>
				+ New listing
			</a>
		</header>

		{#if data.listings.length === 0}
			<div class="rounded-lg border border-neutral-800 bg-neutral-950 p-8 text-center">
				<p class="text-neutral-400">You haven't created any listings yet.</p>
				<a
					href={resolve('/supplier/listings/new')}
					class="mt-3 inline-block text-sm text-primary-light hover:underline"
				>
					Get started →
				</a>
			</div>
		{:else}
			<table class="w-full text-sm">
				<thead class="border-b border-neutral-800 text-left text-neutral-400">
					<tr>
						<th class="py-2 pr-3 font-medium">Title</th>
						<th class="py-2 pr-3 font-medium">Status</th>
						<th class="py-2 pr-3 font-medium">Photos</th>
						<th class="py-2 pr-3 font-medium">Created</th>
					</tr>
				</thead>
				<tbody>
					{#each data.listings as l (l.id)}
						<tr class="border-b border-neutral-900 hover:bg-neutral-900">
							<td class="py-2 pr-3">
								<a
									href={resolve(`/supplier/listings/${l.id}/edit`)}
									class="text-primary-light hover:underline"
								>
									{l.title}
								</a>
							</td>
							<td class="py-2 pr-3">
								<span
									class="rounded px-2 py-0.5 text-xs {l.status === 'DRAFT'
										? 'bg-neutral-800 text-neutral-300'
										: l.status === 'PUBLISHED'
											? 'bg-emerald-950 text-emerald-200'
											: 'bg-red-950 text-red-200'}"
								>
									{l.status}
								</span>
							</td>
							<td class="py-2 pr-3 text-neutral-300">{l._count.photos}</td>
							<td class="py-2 pr-3 text-neutral-400">
								{new Date(l.createdAt).toISOString().slice(0, 10)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</main>

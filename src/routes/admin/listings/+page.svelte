<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tabs = [
		{ key: 'PUBLISHED', label: 'Published' },
		{ key: 'DRAFT', label: 'Draft' },
		{ key: 'HIDDEN', label: 'Hidden' },
		{ key: 'ALL', label: 'All' }
	] as const;
</script>

<svelte:head><title>Listings — Admin</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-5xl space-y-6 py-12">
		<header class="space-y-2">
			<h1 class="text-2xl font-semibold">Listings</h1>
			<p class="text-sm text-neutral-400">
				Review supplier listings. Hide spam or policy violations; restore later if needed.
			</p>
		</header>

		<nav class="flex gap-2 border-b border-neutral-800 text-sm">
			{#each tabs as tab (tab.key)}
				<a
					href={resolve(`/admin/listings?status=${tab.key}`)}
					class="border-b-2 px-3 py-2 {data.currentStatus === tab.key
						? 'border-primary text-light'
						: 'border-transparent text-neutral-400 hover:text-light'}"
				>
					{tab.label}
				</a>
			{/each}
		</nav>

		{#if data.listings.length === 0}
			<p class="text-sm text-neutral-500">No listings in this view.</p>
		{:else}
			<table class="w-full text-sm">
				<thead class="border-b border-neutral-800 text-left text-neutral-400">
					<tr>
						<th class="py-2 pr-3 font-medium">Title</th>
						<th class="py-2 pr-3 font-medium">Status</th>
						<th class="py-2 pr-3 font-medium">Supplier</th>
						<th class="py-2 pr-3 font-medium">Email</th>
						<th class="py-2 pr-3 font-medium">Photos</th>
						<th class="py-2 pr-3 font-medium">Created</th>
					</tr>
				</thead>
				<tbody>
					{#each data.listings as l (l.id)}
						<tr class="border-b border-neutral-900 hover:bg-neutral-900">
							<td class="py-2 pr-3">
								<a
									href={resolve(`/admin/listings/${l.id}`)}
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
							<td class="py-2 pr-3 text-neutral-300">{l.supplier.companyName}</td>
							<td class="py-2 pr-3 text-neutral-400">{l.supplier.user.email}</td>
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

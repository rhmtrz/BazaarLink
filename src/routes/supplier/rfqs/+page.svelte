<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const TABS: { id: 'PENDING' | 'QUOTED' | 'CLOSED' | 'ALL'; label: string }[] = [
		{ id: 'PENDING', label: 'Pending' },
		{ id: 'QUOTED', label: 'Quoted' },
		{ id: 'CLOSED', label: 'Closed' },
		{ id: 'ALL', label: 'All' }
	];

	const STATUS_CLASS: Record<string, string> = {
		SUBMITTED: 'bg-amber-900/40 text-amber-200',
		QUOTED: 'bg-sky-900/40 text-sky-200',
		ACCEPTED: 'bg-emerald-900/40 text-emerald-200',
		REJECTED: 'bg-red-900/40 text-red-200',
		EXPIRED: 'bg-neutral-800 text-neutral-400'
	};

	function fmt(d: Date | string) {
		return new Date(d).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head><title>Incoming RFQs — bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-5xl space-y-6 py-12">
		<header class="space-y-1">
			<h1 class="text-3xl font-semibold">Incoming RFQs</h1>
			<p class="text-sm text-neutral-400">Quote requests sent by buyers on your listings.</p>
		</header>

		<nav class="flex gap-1 border-b border-neutral-800 text-sm">
			{#each TABS as t (t.id)}
				<a
					href={resolve(`/supplier/rfqs?tab=${t.id}`)}
					class="border-b-2 px-3 py-2 {data.tab === t.id
						? 'border-primary text-primary-light'
						: 'border-transparent text-neutral-400 hover:text-neutral-200'}"
				>
					{t.label}
				</a>
			{/each}
		</nav>

		{#if data.rfqs.length === 0}
			<div class="rounded-lg border border-neutral-800 bg-neutral-950 p-8 text-center">
				<p class="text-neutral-400">No RFQs in this tab.</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
				<table class="w-full text-sm">
					<thead class="bg-neutral-900 text-left text-xs text-neutral-400 uppercase">
						<tr>
							<th class="px-4 py-2 font-medium">Listing</th>
							<th class="px-4 py-2 font-medium">Buyer</th>
							<th class="px-4 py-2 font-medium">Status</th>
							<th class="px-4 py-2 font-medium">Received</th>
						</tr>
					</thead>
					<tbody>
						{#each data.rfqs as r (r.id)}
							<tr class="border-t border-neutral-800 hover:bg-neutral-900">
								<td class="px-4 py-3">
									<a
										href={resolve(`/supplier/rfqs/${r.id}`)}
										class="font-medium text-primary-light hover:underline"
									>
										{r.listing.title}
									</a>
								</td>
								<td class="px-4 py-3 text-neutral-300">{r.buyer.email}</td>
								<td class="px-4 py-3">
									<span
										class="rounded px-2 py-0.5 text-xs font-medium {STATUS_CLASS[r.status] ?? ''}"
									>
										{r.status}
									</span>
								</td>
								<td class="px-4 py-3 text-neutral-400">{fmt(r.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</main>

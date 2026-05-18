<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const STATUS_CLASS: Record<string, string> = {
		SUBMITTED: 'bg-amber-900/40 text-amber-200',
		QUOTED: 'bg-sky-900/40 text-sky-200',
		ACCEPTED: 'bg-emerald-900/40 text-emerald-200',
		REJECTED: 'bg-red-900/40 text-red-200',
		EXPIRED: 'bg-neutral-800 text-neutral-400',
		DRAFT: 'bg-neutral-800 text-neutral-400'
	};

	function fmt(d: Date | string) {
		return new Date(d).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head><title>Your RFQs — bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-4xl space-y-6 py-12">
		<header class="space-y-1">
			<h1 class="text-3xl font-semibold">Your RFQs</h1>
			<p class="text-sm text-neutral-400">Quote requests you've sent to suppliers.</p>
		</header>

		{#if data.rfqs.length === 0}
			<div class="rounded-lg border border-neutral-800 bg-neutral-950 p-8 text-center">
				<p class="mb-2 text-neutral-400">You haven't requested any quotes yet.</p>
				<a href={resolve('/listings')} class="text-sm text-primary-light hover:underline">
					Browse rugs →
				</a>
			</div>
		{:else}
			<div class="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
				<table class="w-full text-sm">
					<thead class="bg-neutral-900 text-left text-xs text-neutral-400 uppercase">
						<tr>
							<th class="px-4 py-2 font-medium">Listing</th>
							<th class="px-4 py-2 font-medium">Supplier</th>
							<th class="px-4 py-2 font-medium">Status</th>
							<th class="px-4 py-2 font-medium">Sent</th>
						</tr>
					</thead>
					<tbody>
						{#each data.rfqs as r (r.id)}
							<tr class="border-t border-neutral-800 hover:bg-neutral-900">
								<td class="px-4 py-3">
									<a
										href={resolve(`/rfq/${r.id}`)}
										class="font-medium text-primary-light hover:underline"
									>
										{r.listing.title}
									</a>
								</td>
								<td class="px-4 py-3 text-neutral-300">
									{r.listing.supplier.companyName} · {r.listing.supplier.country}
								</td>
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

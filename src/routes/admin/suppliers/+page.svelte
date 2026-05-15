<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tabs = [
		{ key: 'PENDING', label: 'Pending' },
		{ key: 'APPROVED', label: 'Approved' },
		{ key: 'REJECTED', label: 'Rejected' },
		{ key: 'ALL', label: 'All' }
	] as const;
</script>

<svelte:head><title>Suppliers — Admin</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-4xl space-y-6 py-12">
		<header class="space-y-2">
			<h1 class="text-2xl font-semibold">Suppliers</h1>
			<p class="text-sm text-neutral-400">
				Triage KYC submissions. Click a row to review the full profile and approve or reject.
			</p>
		</header>

		<nav class="flex gap-2 border-b border-neutral-800 text-sm">
			{#each tabs as tab (tab.key)}
				<a
					href={resolve(`/admin/suppliers?status=${tab.key}`)}
					class="border-b-2 px-3 py-2 {data.currentStatus === tab.key
						? 'border-primary text-light'
						: 'border-transparent text-neutral-400 hover:text-light'}"
				>
					{tab.label}
				</a>
			{/each}
		</nav>

		{#if data.suppliers.length === 0}
			<p class="text-sm text-neutral-500">No suppliers in this view.</p>
		{:else}
			<table class="w-full text-sm">
				<thead class="border-b border-neutral-800 text-left text-neutral-400">
					<tr>
						<th class="py-2 pr-3 font-medium">Company</th>
						<th class="py-2 pr-3 font-medium">Email</th>
						<th class="py-2 pr-3 font-medium">Country</th>
						<th class="py-2 pr-3 font-medium">Status</th>
						<th class="py-2 pr-3 font-medium">Submitted</th>
					</tr>
				</thead>
				<tbody>
					{#each data.suppliers as s (s.id)}
						<tr class="border-b border-neutral-900 hover:bg-neutral-900">
							<td class="py-2 pr-3">
								<a
									href={resolve(`/admin/suppliers/${s.id}`)}
									class="text-primary-light hover:underline"
								>
									{s.companyName}
								</a>
							</td>
							<td class="py-2 pr-3 text-neutral-300">{s.user.email}</td>
							<td class="py-2 pr-3 text-neutral-300">{s.country}</td>
							<td class="py-2 pr-3">
								<span
									class="rounded px-2 py-0.5 text-xs {s.kycStatus === 'PENDING'
										? 'bg-amber-950 text-amber-200'
										: s.kycStatus === 'APPROVED'
											? 'bg-emerald-950 text-emerald-200'
											: 'bg-red-950 text-red-200'}"
								>
									{s.kycStatus}
								</span>
							</td>
							<td class="py-2 pr-3 text-neutral-400">
								{new Date(s.createdAt).toISOString().slice(0, 10)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</main>

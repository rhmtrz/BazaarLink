<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const s = $derived(data.supplier);
</script>

<svelte:head><title>{s.companyName} — Admin</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-2xl space-y-6 py-12">
		<header class="space-y-2">
			<a href={resolve('/admin/suppliers')} class="text-sm text-primary-light hover:underline">
				← Back to suppliers
			</a>
			<h1 class="text-2xl font-semibold">{s.companyName}</h1>
		</header>

		<section class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
			<div class="grid grid-cols-2 gap-3 text-sm">
				<div>
					<div class="text-neutral-500">Email</div>
					<div>{s.user.email}</div>
				</div>
				<div>
					<div class="text-neutral-500">Country</div>
					<div>{s.country}</div>
				</div>
				<div>
					<div class="text-neutral-500">Phone</div>
					<div>{s.phone ?? '—'}</div>
				</div>
				<div>
					<div class="text-neutral-500">Status</div>
					<span
						class="inline-block rounded px-2 py-0.5 text-xs {s.kycStatus === 'PENDING'
							? 'bg-amber-950 text-amber-200'
							: s.kycStatus === 'APPROVED'
								? 'bg-emerald-950 text-emerald-200'
								: 'bg-red-950 text-red-200'}"
					>
						{s.kycStatus}
					</span>
				</div>
			</div>

			{#if s.kycStatus === 'REJECTED' && s.kycReason}
				<div class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200">
					<div class="font-medium">Rejection reason</div>
					<div>{s.kycReason}</div>
				</div>
			{/if}

			{#if s.kycReviewedAt}
				<p class="text-xs text-neutral-500">
					Last reviewed {new Date(s.kycReviewedAt).toISOString().slice(0, 16).replace('T', ' ')}
				</p>
			{/if}
		</section>

		{#if form?.error}
			<div
				role="alert"
				class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
			>
				{form.error}
			</div>
		{/if}

		<section class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
			<h2 class="text-lg font-semibold">Approve</h2>
			<p class="text-sm text-neutral-400">
				Marks the supplier as APPROVED. Clears any prior rejection reason.
			</p>
			<form method="POST" action="?/approve" use:enhance>
				<button
					type="submit"
					class="rounded bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-600"
				>
					Approve supplier
				</button>
			</form>
		</section>

		<section class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
			<h2 class="text-lg font-semibold">Reject</h2>
			<p class="text-sm text-neutral-400">
				Records a rejection with a reason the supplier will see on their profile page.
			</p>
			<form method="POST" action="?/reject" use:enhance class="space-y-3">
				<div class="space-y-1">
					<label for="reason" class="block text-sm">Reason</label>
					<textarea
						id="reason"
						name="reason"
						required
						minlength="1"
						maxlength="500"
						rows="3"
						placeholder="e.g. Trade-license document not provided."
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
						>{form?.reason ?? ''}</textarea
					>
				</div>
				<button
					type="submit"
					class="rounded bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-600"
				>
					Reject supplier
				</button>
			</form>
		</section>
	</div>
</main>

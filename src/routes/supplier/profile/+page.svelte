<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let supplier = $derived(form?.success ? null : data.supplier);
	let status = $derived(data.supplier?.kycStatus ?? null);
</script>

<svelte:head><title>Supplier profile — bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-lg space-y-6 py-12">
		<header class="space-y-2">
			<h1 class="text-2xl font-semibold">Supplier profile</h1>
			<p class="text-sm text-neutral-400">
				Tell us about your business. We'll review and get back to you within a few business days.
			</p>
		</header>

		{#if status === 'PENDING'}
			<div
				role="status"
				class="rounded border border-amber-700 bg-amber-950 px-3 py-2 text-sm text-amber-100"
			>
				Under review. We'll be in touch shortly.
			</div>
		{:else if status === 'APPROVED'}
			<div
				role="status"
				class="rounded border border-emerald-700 bg-emerald-950 px-3 py-2 text-sm text-emerald-100"
			>
				Approved.
			</div>
		{:else if status === 'REJECTED'}
			<div
				role="status"
				class="space-y-1 rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
			>
				<p>Profile rejected.</p>
				{#if data.supplier?.kycReason}
					<p class="text-red-300">Reason: {data.supplier.kycReason}</p>
				{/if}
				<p class="text-xs text-red-300">Update your details and save to resubmit for review.</p>
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

		<form method="POST" use:enhance class="space-y-4">
			<div class="space-y-1">
				<label for="companyName" class="block text-sm">Company name</label>
				<input
					id="companyName"
					name="companyName"
					type="text"
					required
					maxlength="200"
					autocomplete="organization"
					value={form?.companyName ?? supplier?.companyName ?? ''}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>

			<div class="space-y-1">
				<label for="country" class="block text-sm">Country</label>
				<input
					id="country"
					name="country"
					type="text"
					required
					maxlength="100"
					autocomplete="country-name"
					value={form?.country ?? supplier?.country ?? ''}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>

			<div class="space-y-1">
				<label for="phone" class="block text-sm"
					>Phone <span class="text-neutral-500">(optional)</span></label
				>
				<input
					id="phone"
					name="phone"
					type="tel"
					maxlength="50"
					autocomplete="tel"
					value={form?.phone ?? supplier?.phone ?? ''}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
			>
				Save profile
			</button>
		</form>
	</div>
</main>

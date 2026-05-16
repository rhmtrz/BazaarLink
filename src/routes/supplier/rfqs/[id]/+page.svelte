<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const rfq = $derived(data.rfq);
	const activeQuote = $derived(rfq.quotes.find((q) => q.status === 'ACTIVE') ?? null);
	const sentQuote = $derived(rfq.quotes[0] ?? null);
	const canQuote = $derived(rfq.status === 'SUBMITTED' && activeQuote === null);
	const kycPending = $derived(rfq.listing.supplier.kycStatus !== 'APPROVED');

	const STATUS_TEXT: Record<string, string> = {
		SUBMITTED: 'Awaiting your response.',
		QUOTED: 'Quote sent. Awaiting buyer decision.',
		ACCEPTED: 'Buyer accepted your quote.',
		REJECTED: 'This RFQ was rejected.',
		EXPIRED: 'This RFQ expired before a quote was accepted.'
	};

	const STATUS_CLASS: Record<string, string> = {
		SUBMITTED: 'border-amber-700 bg-amber-950/60 text-amber-200',
		QUOTED: 'border-sky-700 bg-sky-950/60 text-sky-200',
		ACCEPTED: 'border-emerald-700 bg-emerald-950/60 text-emerald-200',
		REJECTED: 'border-red-700 bg-red-950/60 text-red-200',
		EXPIRED: 'border-neutral-700 bg-neutral-900 text-neutral-300'
	};

	function formatPrice(cents: number): string {
		return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
	}

	function fmt(d: Date | string) {
		return new Date(d).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head><title>RFQ — {rfq.listing.title}</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-3xl space-y-6 py-12">
		<a href={resolve('/supplier/rfqs')} class="text-sm text-primary-light hover:underline">
			← Incoming RFQs
		</a>

		<header class="space-y-2">
			<h1 class="text-2xl font-semibold">RFQ for {rfq.listing.title}</h1>
			<p class="text-sm text-neutral-400">From buyer: {rfq.buyer.email}</p>
		</header>

		<div class="rounded-lg border px-4 py-3 text-sm {STATUS_CLASS[rfq.status] ?? ''}">
			<span class="font-medium">{rfq.status}</span> — {STATUS_TEXT[rfq.status] ?? ''}
		</div>

		{#if form?.error}
			<div
				role="alert"
				class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
			>
				{form.error}
			</div>
		{/if}

		<section class="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
			<h2 class="text-sm font-semibold text-neutral-300">Buyer's message</h2>
			<p class="text-sm whitespace-pre-line text-neutral-200">{rfq.message}</p>
			{#if rfq.quantity != null}
				<p class="text-xs text-neutral-500">Quantity requested: {rfq.quantity}</p>
			{/if}
		</section>

		{#if canQuote && kycPending}
			<div
				role="alert"
				class="rounded border border-amber-700 bg-amber-950/40 px-3 py-2 text-sm text-amber-200"
			>
				Your KYC isn't approved yet — you can't send quotes until an admin reviews your profile.
			</div>
		{:else if canQuote}
			<section class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
				<h2 class="text-sm font-semibold text-neutral-300">Send a quote</h2>
				<form method="POST" action="?/sendQuote" use:enhance class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1">
							<label for="price" class="block text-sm">Price (USD)</label>
							<input
								id="price"
								name="price"
								type="number"
								min="1"
								step="1"
								required
								value={form?.price ?? ''}
								class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
							/>
						</div>
						<div class="space-y-1">
							<label for="quantity" class="block text-sm">Quantity</label>
							<input
								id="quantity"
								name="quantity"
								type="number"
								min="1"
								step="1"
								required
								value={form?.quantity ?? rfq.quantity ?? 1}
								class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
							/>
						</div>
					</div>
					<div class="space-y-1">
						<label for="message" class="block text-sm">Message to buyer</label>
						<textarea
							id="message"
							name="message"
							required
							rows="4"
							minlength="10"
							maxlength="1000"
							placeholder="Lead time, shipping, customisation notes…"
							class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
							>{form?.message ?? ''}</textarea
						>
					</div>
					<div class="space-y-1">
						<label for="validUntil" class="block text-sm">
							Valid until <span class="text-neutral-500">(optional)</span>
						</label>
						<input
							id="validUntil"
							name="validUntil"
							type="date"
							value={form?.validUntil ?? ''}
							class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
						/>
					</div>
					<button
						type="submit"
						class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
					>
						Send quote
					</button>
				</form>
			</section>
		{:else if sentQuote}
			<section class="space-y-2 rounded-lg border border-sky-800 bg-sky-950/30 p-4">
				<h2 class="text-sm font-semibold text-sky-200">Your quote</h2>
				<div class="grid grid-cols-2 gap-3 text-sm">
					<div>
						<dt class="text-xs text-neutral-500">Price</dt>
						<dd class="text-lg font-semibold">{formatPrice(sentQuote.priceCents)}</dd>
					</div>
					<div>
						<dt class="text-xs text-neutral-500">Quantity</dt>
						<dd>{sentQuote.quantity}</dd>
					</div>
					<div>
						<dt class="text-xs text-neutral-500">Status</dt>
						<dd>{sentQuote.status}</dd>
					</div>
					{#if sentQuote.validUntil}
						<div>
							<dt class="text-xs text-neutral-500">Valid until</dt>
							<dd>{fmt(sentQuote.validUntil)}</dd>
						</div>
					{/if}
				</div>
				<p class="text-sm whitespace-pre-line text-neutral-200">{sentQuote.message}</p>
			</section>
		{/if}

		{#if rfq.transitions.length > 0}
			<section class="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
				<h2 class="text-sm font-semibold text-neutral-300">History</h2>
				<ul class="space-y-1 text-xs text-neutral-400">
					{#each rfq.transitions as t (t.id)}
						<li>
							<span class="text-neutral-300">{t.fromStatus} → {t.toStatus}</span>
							by {t.actor.email} · {fmt(t.createdAt)}
							{#if t.reason}
								<div class="ml-2 text-neutral-500">"{t.reason}"</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</main>

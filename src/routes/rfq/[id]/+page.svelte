<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const rfq = $derived(data.rfq);
	const activeQuote = $derived(rfq.quotes.find((q) => q.status === 'ACTIVE') ?? null);
	const acceptedQuote = $derived(rfq.quotes.find((q) => q.status === 'ACCEPTED') ?? null);
	const canReject = $derived(rfq.status === 'SUBMITTED' || rfq.status === 'QUOTED');

	const STATUS_TEXT: Record<string, string> = {
		SUBMITTED: 'Awaiting supplier response.',
		QUOTED: 'Quote received. Review it below.',
		ACCEPTED: 'Quote accepted. Order processing coming with Epic 6.',
		REJECTED: 'This RFQ was rejected.',
		EXPIRED: 'This RFQ expired before a quote was accepted.',
		DRAFT: 'Draft.'
	};

	const STATUS_CLASS: Record<string, string> = {
		SUBMITTED: 'border-amber-700 bg-amber-950/60 text-amber-200',
		QUOTED: 'border-sky-700 bg-sky-950/60 text-sky-200',
		ACCEPTED: 'border-emerald-700 bg-emerald-950/60 text-emerald-200',
		REJECTED: 'border-red-700 bg-red-950/60 text-red-200',
		EXPIRED: 'border-neutral-700 bg-neutral-900 text-neutral-300',
		DRAFT: 'border-neutral-700 bg-neutral-900 text-neutral-300'
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
		<a href={resolve('/rfq')} class="text-sm text-primary-light hover:underline">← Your RFQs</a>

		<header class="space-y-2">
			<h1 class="text-2xl font-semibold">RFQ for {rfq.listing.title}</h1>
			<p class="text-sm text-neutral-400">
				Supplier: {rfq.listing.supplier.companyName} · {rfq.listing.supplier.country}
			</p>
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
			<h2 class="text-sm font-semibold text-neutral-300">Your message</h2>
			<p class="text-sm whitespace-pre-line text-neutral-200">{rfq.message}</p>
			{#if rfq.quantity != null}
				<p class="text-xs text-neutral-500">Quantity requested: {rfq.quantity}</p>
			{/if}
		</section>

		{#if activeQuote}
			<section class="space-y-3 rounded-lg border border-sky-800 bg-sky-950/30 p-4">
				<h2 class="text-sm font-semibold text-sky-200">Supplier quote</h2>
				<div class="grid grid-cols-2 gap-3 text-sm">
					<div>
						<dt class="text-xs text-neutral-500">Price</dt>
						<dd class="text-lg font-semibold">{formatPrice(activeQuote.priceCents)}</dd>
					</div>
					<div>
						<dt class="text-xs text-neutral-500">Quantity</dt>
						<dd>{activeQuote.quantity}</dd>
					</div>
					{#if activeQuote.validUntil}
						<div class="col-span-2">
							<dt class="text-xs text-neutral-500">Valid until</dt>
							<dd>{fmt(activeQuote.validUntil)}</dd>
						</div>
					{/if}
				</div>
				<p class="text-sm whitespace-pre-line text-neutral-200">{activeQuote.message}</p>

				<form method="POST" action="?/acceptQuote" use:enhance class="pt-2">
					<input type="hidden" name="quoteId" value={activeQuote.id} />
					<button
						type="submit"
						class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
					>
						Accept quote
					</button>
				</form>
			</section>
		{:else if acceptedQuote}
			<section class="space-y-3 rounded-lg border border-emerald-800 bg-emerald-950/30 p-4">
				<h2 class="text-sm font-semibold text-emerald-200">Accepted quote</h2>
				<div class="grid grid-cols-2 gap-3 text-sm">
					<div>
						<dt class="text-xs text-neutral-500">Price</dt>
						<dd class="text-lg font-semibold">{formatPrice(acceptedQuote.priceCents)}</dd>
					</div>
					<div>
						<dt class="text-xs text-neutral-500">Quantity</dt>
						<dd>{acceptedQuote.quantity}</dd>
					</div>
				</div>
				<p class="text-sm whitespace-pre-line text-neutral-200">{acceptedQuote.message}</p>
			</section>
		{/if}

		{#if canReject}
			<section class="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
				<h2 class="text-sm font-semibold text-neutral-300">Reject this RFQ</h2>
				<form method="POST" action="?/rejectRfq" use:enhance class="space-y-2">
					<textarea
						name="reason"
						required
						rows="2"
						minlength="1"
						maxlength="500"
						placeholder="Why are you rejecting?"
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
						>{form?.reason ?? ''}</textarea
					>
					<button
						type="submit"
						class="rounded border border-red-800 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950"
					>
						Reject RFQ
					</button>
				</form>
			</section>
		{/if}

		{#if rfq.transitions.length > 0}
			<section class="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
				<h2 class="text-sm font-semibold text-neutral-300">History</h2>
				<ul class="space-y-1 text-xs text-neutral-400">
					{#each rfq.transitions as t (t.id)}
						<li>
							<span class="text-neutral-300">{t.fromStatus} → {t.toStatus}</span>
							by {t.actor?.email ?? 'system'} · {fmt(t.createdAt)}
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

<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>bazaarLink</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-xl space-y-8 py-12">
		{#if data.user}
			<header class="space-y-2 text-center">
				<h1 class="text-3xl font-semibold">bazaarLink</h1>
				<p class="text-neutral-300">
					Signed in as <strong>{data.user.email}</strong>
					<span class="text-neutral-500">({data.user.role})</span>
				</p>
			</header>
			<div class="flex justify-center">
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
					>
						Sign out
					</button>
				</form>
			</div>
		{:else}
			<header class="space-y-3 text-center">
				<h1 class="text-4xl font-semibold tracking-tight">bazaarLink</h1>
				<p class="text-lg text-neutral-300">B2B sourcing marketplace for Afghan rugs.</p>
				<p class="text-sm text-neutral-400">
					Concierge onboarding. Suppliers and buyers join by inquiry &mdash; tell us a bit about
					yourself and we'll get back to you.
				</p>
			</header>

			{#if form?.success}
				<div
					role="status"
					class="space-y-2 rounded border border-emerald-700 bg-emerald-950 px-4 py-3 text-center text-emerald-100"
				>
					<p class="font-medium">Thanks &mdash; we'll be in touch within two business days.</p>
					<p class="text-sm text-emerald-300">
						Watch the inbox you provided. If it doesn't arrive, check spam.
					</p>
				</div>
			{:else}
				<section class="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
					<h2 class="text-xl font-semibold">Request access</h2>

					{#if form?.error}
						<div
							role="alert"
							class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200"
						>
							{form.error}
						</div>
					{/if}

					<form method="POST" action="?/inquire" use:enhance class="space-y-4">
						<div class="space-y-1">
							<label for="name" class="block text-sm"
								>Your name <span class="text-neutral-500">(optional)</span></label
							>
							<input
								id="name"
								name="name"
								type="text"
								autocomplete="name"
								maxlength="120"
								value={form?.name ?? ''}
								class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
							/>
						</div>

						<div class="space-y-1">
							<label for="email" class="block text-sm">Email</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								autocomplete="email"
								value={form?.email ?? ''}
								class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
							/>
						</div>

						<fieldset class="space-y-2">
							<legend class="text-sm"
								>I'm interested in <span class="text-neutral-500">(optional)</span></legend
							>
							<div class="flex gap-4 text-sm">
								<label class="flex items-center gap-2">
									<input
										type="radio"
										name="roleIntent"
										value="BUYER"
										checked={form?.roleIntent === 'BUYER'}
									/>
									Buying rugs
								</label>
								<label class="flex items-center gap-2">
									<input
										type="radio"
										name="roleIntent"
										value="SUPPLIER"
										checked={form?.roleIntent === 'SUPPLIER'}
									/>
									Selling rugs
								</label>
							</div>
						</fieldset>

						<div class="space-y-1">
							<label for="message" class="block text-sm">Message</label>
							<textarea
								id="message"
								name="message"
								required
								minlength="10"
								maxlength="2000"
								rows="5"
								placeholder="Tell us about your business and what you're looking for."
								class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
								>{form?.message ?? ''}</textarea
							>
							<p class="text-xs text-neutral-500">10&ndash;2000 characters.</p>
						</div>

						<!-- Honeypot: visually hidden, off keyboard-tab order. Real users skip it; bots fill it. -->
						<div aria-hidden="true" class="absolute -left-[9999px] h-0 w-0 overflow-hidden">
							<label for="company_url">Company URL</label>
							<input
								id="company_url"
								name="company_url"
								type="text"
								tabindex="-1"
								autocomplete="off"
							/>
						</div>

						<button
							type="submit"
							class="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
						>
							Send inquiry
						</button>
					</form>
				</section>
			{/if}

			<p class="text-center text-sm text-neutral-400">
				Already have an account?
				<a href={resolve('/login')} class="text-primary-light hover:underline">Sign in</a>
			</p>
		{/if}
	</div>
</main>

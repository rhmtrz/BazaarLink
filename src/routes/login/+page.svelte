<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Sign in — bazaarLink</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-dark p-4 text-light">
	<div class="w-full max-w-sm space-y-6">
		<h1 class="text-2xl font-semibold">Sign in</h1>

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
			<div class="space-y-1">
				<label for="password" class="block text-sm">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>
			<button
				type="submit"
				class="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
			>
				Sign in
			</button>
		</form>

		<p class="text-sm text-neutral-400">
			Don't have an account?
			<a href={resolve('/register')} class="text-primary-light hover:underline">Create one</a>
		</p>
	</div>
</main>

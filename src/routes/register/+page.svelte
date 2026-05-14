<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Create your account — bazaarLink</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-dark p-4 text-light">
	<div class="w-full max-w-sm space-y-6">
		<h1 class="text-2xl font-semibold">Create your account</h1>

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
					minlength="8"
					autocomplete="new-password"
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
				<p class="text-xs text-neutral-500">8 characters or more.</p>
			</div>
			<button
				type="submit"
				class="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
			>
				Create account
			</button>
		</form>

		<p class="text-sm text-neutral-400">
			Already have an account?
			<a href={resolve('/login')} class="text-primary-light hover:underline">Sign in</a>
		</p>
	</div>
</main>

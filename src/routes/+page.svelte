<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>bazaarLink</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-dark p-4 text-light">
	<div class="w-full max-w-md space-y-6 text-center">
		<h1 class="text-3xl font-semibold">bazaarLink</h1>
		{#if data.user}
			<p class="text-neutral-300">
				Signed in as <strong>{data.user.email}</strong>
				<span class="text-neutral-500">({data.user.role})</span>
			</p>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
				>
					Sign out
				</button>
			</form>
		{:else}
			<p class="text-neutral-400">B2B sourcing marketplace for Afghan rugs.</p>
			<div class="flex justify-center gap-3">
				<a
					href={resolve('/login')}
					class="rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
				>
					Sign in
				</a>
				<a
					href={resolve('/register')}
					class="rounded border border-neutral-700 px-4 py-2 font-medium hover:border-primary"
				>
					Register
				</a>
			</div>
		{/if}
	</div>
</main>

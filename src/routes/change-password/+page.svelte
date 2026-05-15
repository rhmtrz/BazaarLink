<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form, data }: PageProps = $props();
	let mustChange = $derived(data.user?.mustChangePassword ?? false);
</script>

<svelte:head><title>Change password — bazaarLink</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-dark p-4 text-light">
	<div class="w-full max-w-sm space-y-6">
		<header class="space-y-2">
			<h1 class="text-2xl font-semibold">Change password</h1>
			{#if mustChange}
				<p class="text-sm text-amber-200">
					Your password was set by an admin. Please choose a new one before continuing.
				</p>
			{/if}
		</header>

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
				<label for="currentPassword" class="block text-sm">Current password</label>
				<input
					id="currentPassword"
					name="currentPassword"
					type="password"
					required
					autocomplete="current-password"
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>
			<div class="space-y-1">
				<label for="newPassword" class="block text-sm">New password</label>
				<input
					id="newPassword"
					name="newPassword"
					type="password"
					required
					minlength="8"
					maxlength="72"
					autocomplete="new-password"
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
				<p class="text-xs text-neutral-500">8&ndash;72 characters.</p>
			</div>
			<div class="space-y-1">
				<label for="confirmPassword" class="block text-sm">Confirm new password</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					minlength="8"
					maxlength="72"
					autocomplete="new-password"
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
				/>
			</div>
			<button
				type="submit"
				class="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
			>
				Update password
			</button>
		</form>
	</div>
</main>

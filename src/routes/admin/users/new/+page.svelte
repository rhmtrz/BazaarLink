<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Invite user — Admin</title></svelte:head>

<main class="min-h-screen bg-dark p-4 text-light">
	<div class="mx-auto w-full max-w-lg space-y-6 py-12">
		<header class="space-y-2">
			<h1 class="text-2xl font-semibold">Invite user</h1>
			<p class="text-sm text-neutral-400">
				Creates an account with a temporary password. Share the credentials with the user
				out-of-band (WhatsApp, phone, in-person). They will be forced to change the password on
				first login.
			</p>
		</header>

		{#if form?.success}
			<section class="space-y-3 rounded border border-emerald-700 bg-emerald-950 p-4">
				<p class="font-medium text-emerald-100">
					&check; Account created for <strong>{form.email}</strong> as
					<strong>{form.role}</strong>
				</p>
				<div class="space-y-1 rounded bg-neutral-900 p-3 font-mono text-sm">
					<p>email: {form.email}</p>
					<p>temp password: <strong>{form.tempPassword}</strong></p>
				</div>
				<p class="text-xs text-amber-200">
					This temp password is shown once. Copy it now &mdash; the server cannot retrieve it again.
				</p>
				<a href={resolve('/admin/users/new')} class="text-sm text-primary-light hover:underline">
					Invite another user →
				</a>
			</section>
		{:else}
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
						autocomplete="off"
						value={form?.email ?? ''}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					/>
				</div>

				<div class="space-y-1">
					<label for="role" class="block text-sm">Role</label>
					<select
						id="role"
						name="role"
						required
						value={form?.role ?? 'BUYER'}
						class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-primary focus:outline-none"
					>
						<option value="BUYER">Buyer</option>
						<option value="SUPPLIER">Supplier</option>
						<option value="INSPECTOR">Inspector</option>
						<option value="ADMIN">Admin</option>
					</select>
				</div>

				<button
					type="submit"
					class="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
				>
					Create account
				</button>
			</form>
		{/if}
	</div>
</main>

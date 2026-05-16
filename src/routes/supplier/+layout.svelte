<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: '/supplier/profile', label: 'Profile' },
		{ href: '/supplier/listings', label: 'Listings' },
		{ href: '/supplier/rfqs', label: 'Incoming RFQs' }
	] as const;

	const path = $derived(page.url.pathname);
</script>

<nav class="border-b border-neutral-800 bg-neutral-950/60">
	<div class="mx-auto flex max-w-5xl gap-1 px-4 text-sm">
		{#each links as l (l.href)}
			<a
				href={resolve(l.href)}
				class="border-b-2 px-3 py-2 {path === l.href || path.startsWith(`${l.href}/`)
					? 'border-primary text-primary-light'
					: 'border-transparent text-neutral-400 hover:text-neutral-200'}"
			>
				{l.label}
			</a>
		{/each}
	</div>
</nav>

{@render children()}

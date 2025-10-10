<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
	const navLinks = [
		{ name: 'Home', href: '/' },
		{ name: 'Dashboard', href: '/dashboard' },
		{ name: 'Profile', href: '/profile' }
	];

	const handleLogout = () => {
		// TODO: Handle cookie deletion
		goto('/login');
	};

	const hiddenRoutes = ['/land', '/login'];
	const pathname = $derived(page.url.pathname);
	const hideLayout = $derived(hiddenRoutes.includes(pathname));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>


{#if !hideLayout}
	<Header />
{/if}

<div class="min-h-screen bg-gradient-to-b from-yellow-100 to-sky-100">
	{@render children?.()}
</div>

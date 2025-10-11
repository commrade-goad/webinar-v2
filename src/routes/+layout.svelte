<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();

	const hiddenRoutes = ['/', '/login', '/register'];
	const pathname = $derived(page.url.pathname);
	const hideLayout = $derived(hiddenRoutes.includes(pathname));

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-yellow-100 to-sky-100">
	{#if !hideLayout}
		<Header/>
	{/if}
	{@render children?.()}
</div>

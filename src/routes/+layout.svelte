<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

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
	<header class="bg-sky-600 text-white shadow-md">
		<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
			<div class="cursor-pointer text-xl font-semibold" on:click={() => goto('/')}>MyApp</div>

			<ul class="flex gap-6">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class="transition hover:text-sky-200"
							class:selected={pathname === link.href ? 'underline' : ''}
						>
							{link.name}
						</a>
					</li>
				{/each}
			</ul>

			<button
				on:click={handleLogout}
				class="rounded-lg bg-white px-4 py-2 font-semibold text-sky-600 transition hover:bg-sky-100"
			>
				Logout
			</button>
		</nav>
	</header>
{/if}

{@render children?.()}

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';

	const user = $derived(page.data.user); 

	let navLinks = $state([] as { name: string; href: string }[]);
	$effect(() => {
		const admin = user?.admin === 1;
		navLinks = [
			{ name: 'Dashboard', href: '/dashboard' },
			{ name: 'Profile', href: '/profile' },
			{ name: 'History', href: '/history' },
			...(admin ? [{ name: 'Admin', href: '/admin' }] : [])
		];
	});

	const handleLogout = async () => {
		await fetch('/api/logout', {
			method: 'POST',
			credentials: 'include' // ensure cookie is sent with request
		});
		await invalidateAll();
		goto('/login');
	};

	const pathname = $derived(page.url.pathname);
	
	// Add state for mobile menu
	let mobileMenuOpen = $state(false);
	
	// Toggle mobile menu
	const toggleMobileMenu = () => {
		mobileMenuOpen = !mobileMenuOpen;
	};
</script>

<div class="w-full flex justify-center pt-4 pb-6 bg-transparent">
	<header
		class="relative z-50 w-[98%] rounded-2xl border border-white/40
			   bg-white/30 backdrop-blur-md shadow-lg transition-all duration-300"
	>
		<nav class="flex items-center justify-between px-6 py-3 text-sky-600">
			<button
				type="button"
				class="cursor-pointer text-xl font-semibold hover:text-sky-800"
				onclick={() => goto('/')}
			>
				WebU
			</button>

			<!-- Desktop Navigation -->
			<ul class="hidden md:flex gap-6">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class="transition hover:text-sky-800"
							class:underline={pathname === link.href}
							class:font-bold={pathname === link.href}
						>
							{link.name}
						</a>
					</li>
				{/each}
			</ul>

			<!-- Desktop Logout Button -->
			<button
				onclick={handleLogout}
				class="hidden md:block rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
			>
				Logout
			</button>
			
			<!-- Hamburger Menu Button -->
			<button 
				class="md:hidden text-sky-600 hover:text-sky-800" 
				onclick={toggleMobileMenu}
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<!-- X Icon (Close) -->
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<!-- Hamburger Icon -->
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</nav>
		
		<!-- Mobile Menu Dropdown -->
		{#if mobileMenuOpen}
			<div class="md:hidden px-6 pb-4 pt-1 rounded-b-2xl">
				<ul class="flex flex-col gap-4">
					{#each navLinks as link}
						<li>
							<a
								href={link.href}
								class="block transition hover:text-sky-800"
								class:underline={pathname === link.href}
								onclick={() => mobileMenuOpen = false}
							>
								{link.name}
							</a>
						</li>
					{/each}
					<li class="pt-2">
						<button
							onclick={handleLogout}
							class="w-full rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
						>
							Logout
						</button>
					</li>
				</ul>
			</div>
		{/if}
	</header>
</div>
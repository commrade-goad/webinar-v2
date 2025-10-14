<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Body from '$lib/components/Body.svelte';

	let certificateHtml = $state('');
	let isLoading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const code = $derived(page.params.base64);
			// Use PUBLIC_ environment variables for client-side code
			const response = await fetch('/api/get-cert', {
                method: "POST",
				headers: {
					Accept: 'text/html'
				},
                body: JSON.stringify({b64: code})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
                error = errorData.message;
                isLoading = false;
				throw new Error(errorData.message || `Error ${response.status}: Failed to fetch certificate`);
			}

			certificateHtml = await response.text();
		} catch (err) {
			console.error('Error loading certificate:', err);
			error = err instanceof Error ? err.message : 'Failed to load certificate';
		} finally {
			isLoading = false;
		}
	});
</script>

<Body>
	{#if isLoading}
		<div class="flex justify-center py-12">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded p-4">
			<p class="text-red-600">{error}</p>
		</div>
	{:else}
		<div class="certificate">
			{@html certificateHtml}
		</div>
	{/if}
</Body>
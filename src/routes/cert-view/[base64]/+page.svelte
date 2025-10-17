<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Body from '$lib/components/Body.svelte';
	import html2canvas from 'html2canvas';

	let certificateHtml = $state('');
	let isLoading = $state(true);
	let error = $state('');

	async function downloadCertificate() {
		const certEl = document.querySelector('.inner-cert') as HTMLElement;
		if (!certEl) return alert('Certificate not found');

		try {
			const canvas = await html2canvas(certEl, {
				scale: 2, // better resolution
				useCORS: true
			});

			const imgData = canvas.toDataURL('image/png');
			const link = document.createElement('a');
			link.href = imgData;
			link.download = 'certificate.png';
			link.click();
		} catch (err) {
			console.error('Failed to generate image:', err);
			alert('Failed to generate image');
		}
	}

	onMount(async () => {
		try {
			const code = $derived(page.params.base64);
			const response = await fetch('/api/get-cert', {
				method: 'POST',
				headers: {
					Accept: 'text/html'
				},
				body: JSON.stringify({ b64: code })
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
		<div class="flex justify-end mb-4">
			<button
				onclick={downloadCertificate}
				class="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
			>
				Download as Image
			</button>
		</div>

		<div class="certificate p-4 rounded flex justify-center items-center">
			<div class="inner-cert">
				{@html certificateHtml}
			</div>
		</div>
	{/if}
</Body>

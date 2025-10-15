<script lang="ts">
	import { onMount } from 'svelte';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
	import type { IEvent, ApiResponse, AttTypeEnum } from '$lib/types/api';
	import { goto } from '$app/navigation';

	// State for webinars
	let webinars = $state<IEvent[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let refresh = $state(0);

	// Search and filter states
	let searchQuery = $state('');
	let sortBy = $state('date'); // 'date', 'name'
	let filterStatus = $state('all'); // 'all', 'live', 'upcoming', 'ended'
	let filterType = $state('all'); // 'all', 'online', 'offline'
	let roleFilter = $state('normal'); // 'normal', 'committee', 'all'

	// Pagination states
	let pageSize = $state(10);
	let currentPage = $state(1);
	let totalItems = $state(0);
	let totalPages = $state(1);

	// Current date/time and user info
	let currentDateTime = $state('');

	$effect(() => {
		if (refresh > 0 || currentPage > 0) {
			fetchWebinars();
		}
	});

	// Effect for when search/filter changes - reset to page 1
	$effect(() => {
		// Reset to page 1 when search/filters change
		if (searchQuery !== '' || sortBy !== 'date' || filterStatus !== 'all' || filterType !== 'all' || roleFilter !== 'normal') {
			currentPage = 1;
			fetchWebinars();
		}
	});

	// Get current UTC date/time in YYYY-MM-DD HH:MM:SS format
	function updateCurrentDateTime() {
		const now = new Date();
		const year = now.getUTCFullYear();
		const month = String(now.getUTCMonth() + 1).padStart(2, '0');
		const day = String(now.getUTCDate()).padStart(2, '0');
		const hours = String(now.getUTCHours()).padStart(2, '0');
		const minutes = String(now.getUTCMinutes()).padStart(2, '0');
		const seconds = String(now.getUTCSeconds()).padStart(2, '0');

		currentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	// Format date for display
	function formatDate(dateString: string) {
		if (!dateString) return 'Not specified';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Function to construct URL with query parameters
	const createSearchParams = () => {
		return {
			limit: pageSize,
			offset: (currentPage - 1) * pageSize,
			search: searchQuery || undefined,
			sort: sortBy !== 'date' ? sortBy : undefined,
			status: filterStatus !== 'all' ? filterStatus : undefined,
			type: filterType !== 'all' ? filterType : undefined,
			role: roleFilter
		};
	};

	// Fetch webinars with search, filtering and pagination
	async function fetchWebinars() {
		try {
			isLoading = true;
			error = '';

			// Use the new API endpoint
			const response = await fetch('/api/search-event-his', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(createSearchParams())
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const apiResponse: ApiResponse<{ events: IEvent[]; total: number }> = await response.json();

			if (!apiResponse.success) {
				throw new Error(apiResponse.message || 'Failed to fetch webinars');
			}

			webinars = apiResponse.data.events || [];
			totalItems = apiResponse.data.total || 0;
			totalPages = Math.ceil(totalItems / pageSize);
		} catch (err) {
			console.error('Error fetching webinars:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch webinars';
		} finally {
			isLoading = false;
		}
	}

	// Navigation functions for pagination
	function goToPage(page: number) {
		if (page < 1 || page > totalPages || page === currentPage) return;
		currentPage = page;
		fetchWebinars();
	}

	// Helper function to create array of page numbers for pagination
	function getPageNumbers(): (number | string)[] {
		const pageNumbers: (number | string)[] = [];
		const maxDisplayedPages = 5;

		if (totalPages <= maxDisplayedPages) {
			// If total pages is small, show all pages
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			// Always show first page
			pageNumbers.push(1);

			if (currentPage > 3) {
				// Show ellipsis if current page is far from start
				pageNumbers.push('...');
			}

			// Show pages around current page
			const startPage = Math.max(2, currentPage - 1);
			const endPage = Math.min(totalPages - 1, currentPage + 1);

			for (let i = startPage; i <= endPage; i++) {
				pageNumbers.push(i);
			}

			if (currentPage < totalPages - 2) {
				// Show ellipsis if current page is far from end
				pageNumbers.push('...');
			}

			// Always show last page
			if (totalPages > 1) {
				pageNumbers.push(totalPages);
			}
		}

		return pageNumbers;
	}

	// Initialize
	onMount(() => {
		updateCurrentDateTime();
		fetchWebinars();

		// Update time every second
		const timer = setInterval(() => {
			updateCurrentDateTime();
		}, 1000);

		return () => clearInterval(timer);
	});
</script>

<Body>
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-sky-600">Histori Webinar</h1>
	</div>

	<!-- Items per page control -->
	<div class="text-black-500 mb-2 flex items-center text-sm">
		<span class="ml-auto"
			>Webinar per halaman:
			<select
				bind:value={pageSize}
				onchange={() => {
					currentPage = 1;
					fetchWebinars();
				}}
				class="ml-2 rounded border border-gray-300 px-2 py-1"
			>
				<option value={5}>5</option>
				<option value={10}>10</option>
				<option value={20}>20</option>
				<option value={50}>50</option>
			</select>
		</span>
	</div>

	<!-- Search and Filter Controls -->
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
		<div>
			<p class="mb-1 block text-sm font-medium text-gray-700">Cari</p>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Cari dengan nama atau pembicara..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
				onkeyup={(e) => e.key === 'Enter' && fetchWebinars()}
			/>
		</div>

		<div>
			<p class="mb-1 block text-sm font-medium text-gray-700">Urutkan</p>
			<select
				bind:value={sortBy}
				onchange={fetchWebinars}
				class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
			>
				<option value="date">Tanggal (Paling baru pertama)</option>
				<option value="name">Nama (A-Z)</option>
			</select>
		</div>

		<div>
			<p class="mb-1 block text-sm font-medium text-gray-700">Status</p>
			<select
				bind:value={filterStatus}
				onchange={fetchWebinars}
				class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
			>
				<option value="all">Semua</option>
				<option value="live">Berjalan</option>
				<option value="upcoming">Belum dimulai</option>
				<option value="ended">Selesai</option>
			</select>
		</div>

		<div>
			<p class="mb-1 block text-sm font-medium text-gray-700">Tipe</p>
			<select
				bind:value={filterType}
				onchange={fetchWebinars}
				class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
			>
				<option value="all">Semua</option>
				<option value="online">Online</option>
				<option value="offline">Offline</option>
			</select>
		</div>

		<div>
			<p class="mb-1 block text-sm font-medium text-gray-700">Peran</p>
			<select
				bind:value={roleFilter}
				onchange={fetchWebinars}
				class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
			>
				<option value="normal">Peserta</option>
				<option value="committee">Panitia</option>
				<option value="all">Semua</option>
			</select>
		</div>
	</div>

	<!-- Error message -->
	{#if error}
		<Card padding="p-4" bgColor="bg-red-50" border="border border-red-200">
			<p class="text-red-600">{error}</p>
		</Card>
	{/if}

	<!-- Loading state -->
	{#if isLoading}
		<div class="flex justify-center py-8">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"
			></div>
		</div>
		<!-- Webinar list -->
	{:else if webinars.length === 0}
		<Card padding="p-6" bgColor="bg-gray-50">
			<p class="text-center text-gray-500">
				{totalItems === 0
					? 'Tidak ada webinar yang diikuti.'
					: 'Tidak ada webinar sesuai kriteria.'}
			</p>
		</Card>
	{:else}
		<div class="mb-2 text-sm text-gray-500">
			Menampilkan {webinars.length} webinar (halaman {currentPage} dari {totalPages}, total: {totalItems})
		</div>

		<div class="grid grid-cols-1 gap-4">
			{#each webinars as webinar}
				<Card
					title={webinar.EventName}
					subtitle={webinar.EventSpeaker ? `Pembicara: ${webinar.EventSpeaker}` : undefined}
					padding="p-5"
					border="border border-gray-200"
					shadow="shadow-md"
					hover="hover:shadow-lg transition-all duration-200"
					width="w-[98.5%]"
				>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="col-span-2">
							<div class="flex items-start space-x-4">
								{#if webinar.EventImg}
									<img
										src={webinar.EventImg}
										alt={webinar.EventName}
										class="h-20 w-20 rounded-md object-cover"
									/>
								{/if}
								<div>
									<p class="mb-2 text-sm">
										<strong>Mulai:</strong>
										{formatDate(webinar.EventDStart)}
									</p>
									<p class="mb-2 text-sm">
										<strong>Berakhir:</strong>
										{formatDate(webinar.EventDEnd)}
									</p>
									<p class="mb-2 text-sm">
										<strong>Tipe:</strong>
										{webinar.EventAtt === 'online' ? 'Online' : 'Offline'}
									</p>
									{#if webinar.EventLink}
										<p class="mb-2 text-sm">
											<strong>Link/Tempat:</strong>
											{webinar.EventLink}
										</p>
									{/if}
								</div>
							</div>

							{#if webinar.EventDesc}
								<p class="mt-2 text-sm text-gray-600">{webinar.EventDesc}</p>
							{/if}
						</div>

						<div class="flex flex-col justify-between gap-2 md:items-end">
							<div class="flex gap-2">
								<button
									onclick={() => goto(`/webinar/${webinar.ID}`)}
									class="flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-white transition-colors hover:bg-sky-700"
								>
									Halaman Webinar
								</button>
							</div>

							<span
								class={`rounded-xl p-1 px-2.5 py-0.5 text-xs font-medium ${
									new Date(webinar.EventDStart) <= new Date() &&
									new Date(webinar.EventDEnd) >= new Date()
										? 'bg-green-100 text-green-800'
										: new Date(webinar.EventDStart) > new Date()
											? 'bg-blue-100 text-blue-800'
											: 'bg-gray-100 text-gray-800'
								}`}
							>
								{new Date(webinar.EventDStart) <= new Date() &&
								new Date(webinar.EventDEnd) >= new Date()
									? 'Berjalan'
									: new Date(webinar.EventDStart) > new Date()
										? 'Belum dimulai'
										: 'Selesai'}
							</span>
						</div>
					</div>
				</Card>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-6 flex justify-center">
				<div class="flex gap-1">
					<!-- First page -->
					<button
						class="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
						disabled={currentPage === 1}
						onclick={() => goToPage(1)}
					>
						&laquo;
					</button>

					<!-- Previous page -->
					<button
						class="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
						disabled={currentPage === 1}
						onclick={() => goToPage(currentPage - 1)}
					>
						&lsaquo;
					</button>

					<!-- Page numbers -->
					{#each getPageNumbers() as pageNum}
						{#if typeof pageNum === 'number'}
							<button
								class={`rounded px-3 py-1 text-sm ${
									pageNum === currentPage
										? 'bg-sky-600 text-white'
										: 'border border-gray-300 hover:bg-gray-100'
								}`}
								onclick={() => goToPage(pageNum)}
							>
								{pageNum}
							</button>
						{:else}
							<span class="px-2 py-1 text-sm">...</span>
						{/if}
					{/each}

					<!-- Next page -->
					<button
						class="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
						disabled={currentPage === totalPages}
						onclick={() => goToPage(currentPage + 1)}
					>
						&rsaquo;
					</button>

					<!-- Last page -->
					<button
						class="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
						disabled={currentPage === totalPages}
						onclick={() => goToPage(totalPages)}
					>
						&raquo;
					</button>
				</div>
			</div>
		{/if}
	{/if}
</Body>
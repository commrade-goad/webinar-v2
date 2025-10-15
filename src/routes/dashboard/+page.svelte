<script lang="ts">
	import { onMount } from 'svelte';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
	import type { ApiResponse, IEvent } from '$lib/types/api';
	import { goto } from '$app/navigation';

	let liveEvents: IEvent[] = $state([]);
	let upcomingEvents: IEvent[] = $state([]);
	let isLoading = $state(true);
	let error = $state('');

	let currentDateTime = $state('');

	// Format date for display
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get current UTC date/time in YYYY-MM-DD HH:MM:SS format
	function getCurrentDateTime() {
		const now = new Date();
		const year = now.getUTCFullYear();
		const month = String(now.getUTCMonth() + 1).padStart(2, '0');
		const day = String(now.getUTCDate()).padStart(2, '0');
		const hours = String(now.getUTCHours()).padStart(2, '0');
		const minutes = String(now.getUTCMinutes()).padStart(2, '0');
		const seconds = String(now.getUTCSeconds()).padStart(2, '0');

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	// Fetch events from API
	async function fetchEvents() {
		try {
			isLoading = true;
			error = '';

			const response = await fetch('/api/get-event', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					limit: 10,
					offset: 0
				})
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data: ApiResponse<IEvent[]> = await response.json();
			console.log(data);

			const now = new Date();

			const events = data.data;
			liveEvents = events.filter((event) => {
				const startDate = new Date(event.EventDStart);
				const endDate = new Date(event.EventDEnd);
				return startDate <= now && endDate >= now;
			});

			upcomingEvents = events.filter((event) => {
				const startDate = new Date(event.EventDStart);
				return startDate > now;
			});

			// Sort upcoming events by start date
			upcomingEvents.sort(
				(a, b) => new Date(a.EventDStart).getTime() - new Date(b.EventDStart).getTime()
			);
		} catch (err) {
			console.error('Error fetching events:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch events';
		} finally {
			isLoading = false;
		}
	}

	// Update current time every second
	function startClock() {
		currentDateTime = getCurrentDateTime();
		const timer = setInterval(() => {
			currentDateTime = getCurrentDateTime();
		}, 1000);

		return () => clearInterval(timer);
	}

	// Fetch data when component mounts
	onMount(() => {
		const cleanup = startClock();
		fetchEvents();

		// Optional: Set up polling to refresh events periodically
		// Uncomment if you want to automatically refresh events every minute
		/*
		const eventRefreshTimer = setInterval(() => {
			fetchEvents();
		}, 60000); // Refresh every minute
		
		return () => {
			cleanup();
			clearInterval(eventRefreshTimer);
		};
		*/

		return cleanup;
	});
</script>

<Body>
	{#if isLoading}
		<div class="flex justify-center py-8">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"
			></div>
		</div>
	{:else if error}
		<Card padding="p-4" bgColor="bg-red-50" border="border border-red-200">
			<p class="text-red-600">Error loading events: {error}</p>
		</Card>
	{:else}
		<h1 class="mb-4 text-2xl font-bold text-sky-600">Webinar yang sedang berlansung</h1>

		{#if liveEvents.length === 0}
			<Card padding="p-4" bgColor="bg-gray-50">
				<p class="text-center text-gray-500">Tidak ada webinar yang sedang berlansung</p>
			</Card>
		{:else}
			<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each liveEvents as event}
					<Card
						title={event.EventName}
						padding="p-4"
						rounded="rounded-xl"
						shadow="shadow-md"
						border="border-2 border-green-200"
						bgColor="bg-gradient-to-br from-green-50 to-white"
						hover="hover:shadow-lg transition-all duration-200"
						onClick={() => {
							goto(`/webinar/${event.ID}`);
						}}
					>
						<div class="space-y-2">
							<div class="flex items-center">
								<div class="mr-2 h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
								<span class="font-medium text-green-700">Berlansung</span>
							</div>

							<p class="text-sm">
								<strong>Pembicara:</strong>
								{event.EventSpeaker || 'Tidak tersedia'}
							</p>
							<p class="text-sm"><strong>Mulai:</strong> {formatDate(event.EventDStart)}</p>
							<p class="text-sm"><strong>Selesai:</strong> {formatDate(event.EventDEnd)}</p>

							{#if event.EventDesc}
								<p class="line-clamp-2 text-sm">{event.EventDesc}</p>
							{/if}
						</div>
					</Card>
				{/each}
			</div>
		{/if}

		<!-- Upcoming Webinars Section -->
		<h1 class="mt-4 mb-4 text-2xl font-bold text-sky-600">Webinar Yang akan datang</h1>

		{#if upcomingEvents.length === 0}
			<Card padding="p-4" bgColor="bg-gray-50">
				<p class="text-center text-gray-500">Tidak ada webinar yang akan datang</p>
			</Card>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each upcomingEvents as event}
					<Card
						padding="p-5"
						border="border border-gray-200"
						shadow="shadow-md"
						hover="hover:shadow-lg transition-all duration-200"
						margin="m-0"
						onClick={() => {
							goto(`/webinar/${event.ID}`);
						}}
					>
					<div>
						<div class='min-h-16 overflow-ellipsis'>
							<h1 class='text-lg font-semibold line-clamp-2'>{event.EventName}</h1>
						</div>
						<div class="w-full h-48 overflow-hidden mb-4">
							<img
								src={event.EventImg}
								alt="Event poster"
								class="h-auto max-h-64 w-full object-cover"
							/>
						</div>
						<div>
							<p class="text-sm">
								<strong>Pembicara:</strong>
								{event.EventSpeaker || 'Tidak tersedia'}
							</p>
							<p class="text-sm"><strong>Mulai:</strong> {formatDate(event.EventDStart)}</p>
							<p class="text-sm"><strong>Selesai:</strong> {formatDate(event.EventDEnd)}</p>
						</div>
					</div>
					</Card>
				{/each}
			</div>
		{/if}
	{/if}
</Body>

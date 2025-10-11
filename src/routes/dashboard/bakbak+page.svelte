<script lang="ts">
 // TODO: Need to finish the admin first!
	// import { onMount } from 'svelte';
	// import Body from '$lib/components/Body.svelte';
	// import Card from '$lib/components/Card.svelte';

	// let liveEvents = $state([]);
	// let upcomingEvents = $state([]);
	// let isLoading = $state(true);
	// let error = $state('');

	// let currentDateTime = $state('');

	// // Format date for display
	// function formatDate(dateString: string) {
	// 	const date = new Date(dateString);
	// 	return date.toLocaleDateString('id-ID', {
	// 		year: 'numeric',
	// 		month: 'long',
	// 		day: 'numeric',
	// 		hour: '2-digit',
	// 		minute: '2-digit'
	// 	});
	// }

	// // Get current UTC date/time in YYYY-MM-DD HH:MM:SS format
	// function getCurrentDateTime() {
	// 	const now = new Date();
	// 	const year = now.getUTCFullYear();
	// 	const month = String(now.getUTCMonth() + 1).padStart(2, '0');
	// 	const day = String(now.getUTCDate()).padStart(2, '0');
	// 	const hours = String(now.getUTCHours()).padStart(2, '0');
	// 	const minutes = String(now.getUTCMinutes()).padStart(2, '0');
	// 	const seconds = String(now.getUTCSeconds()).padStart(2, '0');
		
	// 	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	// }

	// // Fetch events from API
	// async function fetchEvents() {
	// 	try {
	// 		isLoading = true;
	// 		error = '';

	// 		const response = await fetch('/api/get-event', {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'application/json'
	// 			},
	// 			body: JSON.stringify({
	// 				limit: 10,
	// 				offset: 0
	// 			})
	// 		});

	// 		if (!response.ok) {
	// 			throw new Error(`Error: ${response.status}`);
	// 		}

	// 		const data = await response.json();
    //         console.log(data);
			
	// 		const now = new Date();
			
	// 		const events = data.data;
	// 		liveEvents = events.filter(event => {
	// 			const startDate = new Date(event.DStart);
	// 			const endDate = new Date(event.DEnd);
	// 			return startDate <= now && endDate >= now;
	// 		});
			
	// 		upcomingEvents = events.filter(event => {
	// 			const startDate = new Date(event.DStart);
	// 			return startDate > now;
	// 		});
			
	// 		// Sort upcoming events by start date
	// 		upcomingEvents.sort((a, b) => 
	// 			new Date(a.Dstart).getTime() - new Date(b.DStart).getTime()
	// 		);
	// 	} catch (err) {
	// 		console.error('Error fetching events:', err);
	// 		error = err instanceof Error ? err.message : 'Failed to fetch events';
	// 	} finally {
	// 		isLoading = false;
	// 	}
	// }

	// // Update current time every second
	// function startClock() {
	// 	currentDateTime = getCurrentDateTime();
	// 	const timer = setInterval(() => {
	// 		currentDateTime = getCurrentDateTime();
	// 	}, 1000);
		
	// 	return () => clearInterval(timer);
	// }

	// // Fetch data when component mounts
	// onMount(() => {
	// 	const cleanup = startClock();
	// 	fetchEvents();
		
	// 	// Optional: Set up polling to refresh events periodically
	// 	// Uncomment if you want to automatically refresh events every minute
	// 	/*
	// 	const eventRefreshTimer = setInterval(() => {
	// 		fetchEvents();
	// 	}, 60000); // Refresh every minute
		
	// 	return () => {
	// 		cleanup();
	// 		clearInterval(eventRefreshTimer);
	// 	};
	// 	*/
		
	// 	return cleanup;
	// });
</script>

<Body>
	{#if isLoading}
		<div class="flex justify-center py-8">
			<div class="animate-spin h-8 w-8 border-4 border-sky-500 rounded-full border-t-transparent"></div>
		</div>
	{:else if error}
		<Card padding="p-4" bgColor="bg-red-50" border="border border-red-200">
			<p class="text-red-600">Error loading events: {error}</p>
		</Card>
	{:else}
		<h1 class="text-2xl font-bold text-sky-600 mb-4">Live Webinar</h1>
		
		{#if liveEvents.data.length === 0}
			<Card padding="p-4" bgColor="bg-gray-50">
				<p class="text-center text-gray-500">No live webinars at the moment</p>
			</Card>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{#each liveEvents as event}
					<Card 
						title={event.title}
						subtitle="Live Now"
						padding="p-4" 
						rounded="rounded-xl"
						shadow="shadow-md"
						border="border-2 border-green-200"
						bgColor="bg-gradient-to-br from-green-50 to-white"
						hover="hover:shadow-lg transition-all duration-200"
					>
						<div class="space-y-2">
							<div class="flex items-center">
								<div class="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
								<span class="text-green-700 font-medium">Live Now</span>
							</div>
							
							<p class="text-sm"><strong>Speaker:</strong> {event.speaker || 'Not specified'}</p>
							<p class="text-sm"><strong>Start:</strong> {formatDate(event.startDate)}</p>
							<p class="text-sm"><strong>End:</strong> {formatDate(event.endDate)}</p>
							
							{#if event.description}
								<p class="text-sm line-clamp-2">{event.description}</p>
							{/if}
							
							<div class="pt-2">
								<a 
									href={`/webinar/${event.id}`}
									class="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
								>
									Join Now
								</a>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		{/if}

		<!-- Upcoming Webinars Section -->
		<h1 class="text-2xl font-bold text-sky-600 mb-4">Upcoming Webinar</h1>
		
		{#if upcomingEvents.length === 0}
			<Card padding="p-4" bgColor="bg-gray-50">
				<p class="text-center text-gray-500">No upcoming webinars scheduled</p>
			</Card>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each upcomingEvents as event}
					<Card 
						title={event.title}
						subtitle="Upcoming"
						padding="p-4" 
						rounded="rounded-xl"
						shadow="shadow-md"
						bgColor="bg-white"
						hover="hover:shadow-lg transition-all duration-200"
					>
						<div class="space-y-2">
							<p class="text-sm"><strong>Speaker:</strong> {event.speaker || 'Not specified'}</p>
							<p class="text-sm"><strong>Date:</strong> {formatDate(event.startDate)}</p>
							
							{#if event.description}
								<p class="text-sm line-clamp-2">{event.description}</p>
							{/if}
							
							<div class="pt-2">
								<a 
									href={`/webinar/${event.id}`}
									class="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm"
								>
									Details
								</a>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		{/if}
	{/if}
</Body>
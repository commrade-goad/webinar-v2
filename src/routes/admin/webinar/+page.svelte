<script lang="ts">
	import { onMount } from 'svelte';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
	import { DateTime } from 'luxon';
	import type { IEvent, ApiResponse, AttTypeEnum } from '$lib/types/api';

	// State for webinars
	let webinars = $state<IEvent[]>([]);
	let isLoading = $state(true);
	let error = $state('');
    let refresh = $state(0);

	// Form state
	let isFormOpen = $state(false);
	let isEditing = $state(false);
	let currentWebinarId = $state<number | null>(null);

	// Form fields
	let eventName = $state('');
	let eventDesc = $state('');
	let eventSpeaker = $state('');
	let eventDstart = $state(''); // Date part
	let eventTimeStart = $state(''); // Time part
	let eventDend = $state(''); // Date part
	let eventTimeEnd = $state(''); // Time part
	let eventLink = $state('');
	let eventMax = $state(100);
	let eventAtt = $state<AttTypeEnum>('online');
	let eventImg = $state('');

	// Current date/time and user info
	let currentDateTime = $state('');

	$effect(() => {
		if (refresh> 0) {
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

	function formatDateForAPI(dateString: string, timeString: string): string {
		const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const dt = DateTime.fromISO(`${dateString}T${timeString}`, { zone: systemZone });

        console.log(`got ${dateString}T${timeString} generate ${dt.toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")}`)
		return dt.toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
	}

	// Parse date from API format to date and time inputs
	function parseDateFromAPI(dateString: string): { date: string; time: string } {
		if (!dateString) {
			return { date: '', time: '' };
		}

		// Parse from UTC (what Go usually sends)
		const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const dt = DateTime.fromISO(dateString, { zone: 'utc' }).setZone(systemZone);

		// Format date and time in local timezone
		const dateFormatted = dt.toFormat('yyyy-MM-dd');
		const timeFormatted = dt.toFormat('HH:mm');

		return { date: dateFormatted, time: timeFormatted };
	}

	// Reset form fields
	function resetForm() {
		eventName = '';
		eventDesc = '';
		eventSpeaker = '';
		eventDstart = '';
		eventTimeStart = '';
		eventDend = '';
		eventTimeEnd = '';
		eventLink = '';
		eventMax = 100;
		eventAtt = 'online';
		eventImg = '';
		currentWebinarId = null;
		isEditing = false;
	}

	// Open form for adding new webinar
	function openAddForm() {
		resetForm();
		isFormOpen = true;
	}

	// Open form for editing webinar
	function openEditForm(webinar: IEvent) {
		// Parse dates for the form
		const startDates = parseDateFromAPI(webinar.EventDStart);
		const endDates = parseDateFromAPI(webinar.EventDEnd);

		// Set form fields from parsed dates
		eventDstart = startDates.date;
		eventTimeStart = startDates.time;
		eventDend = endDates.date;
		eventTimeEnd = endDates.time;

		// Set other form fields
		eventName = webinar.EventName;
		eventDesc = webinar.EventDesc || '';
		eventSpeaker = webinar.EventSpeaker || '';
		eventLink = webinar.EventLink || '';
		eventMax = webinar.EventMax || 100;
		eventAtt = webinar.EventAtt || 'online';
		eventImg = webinar.EventImg || '';
		currentWebinarId = webinar.ID;

		// Open form in edit mode
		isEditing = true;
		isFormOpen = true;
	}

	// Close form
	function closeForm() {
		isFormOpen = false;
		resetForm();
	}

	// Fetch all webinars
	async function fetchWebinars() {
		try {
			isLoading = true;
			error = '';

			const response = await fetch('/api/get-event', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ limit: 100, offset: 0 })
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const apiResponse: ApiResponse<IEvent[]> = await response.json();

			if (!apiResponse.success) {
				throw new Error(apiResponse.message || 'Failed to fetch webinars');
			}

			webinars = apiResponse.data || [];

			// Sort by start date (newest first)
			webinars.sort(
				(a, b) => new Date(b.EventDStart).getTime() - new Date(a.EventDStart).getTime()
			);
		} catch (err) {
			console.error('Error fetching webinars:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch webinars';
		} finally {
			isLoading = false;
		}
	}

	// Submit form (add or edit)
	const handleSubmit = async (event: Event) => {
		event.preventDefault();

		// Format dates for API in the required format
		const startDateTime = formatDateForAPI(eventDstart, eventTimeStart);
		const endDateTime = formatDateForAPI(eventDend, eventTimeEnd);

		// Create webinar object
		const webinarData = {
			name: eventName,
			desc: eventDesc,
			speaker: eventSpeaker,
			dstart: startDateTime,
			dend: endDateTime,
			link: eventLink,
			max: eventMax,
			att: eventAtt,
			img: eventImg
		};

		// Add ID if editing
		let edit = {
			id: -1,
			...webinarData
		};
		if (isEditing && currentWebinarId !== null) {
			edit.id = currentWebinarId;
		}

		try {
			const endpoint = isEditing ? '/api/edit-evene' : '/api/add-event';

			console.log('Sending webinar data:', JSON.stringify(webinarData, null, 2));

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(isEditing ? edit : webinarData)
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || `Error: ${response.status}`);
			}

			const apiResponse: ApiResponse<IEvent> = await response.json();

			if (!apiResponse.success) {
				throw new Error(apiResponse.message || `Error code: ${apiResponse.error_code}`);
			}

            refresh += 1;

			// Close form
			closeForm();

			// Show success message (you could add a toast notification here)
			console.log(`Webinar ${isEditing ? 'updated' : 'created'} successfully`);
		} catch (err) {
			console.error('Error saving webinar:', err);
			error = err instanceof Error ? err.message : 'Failed to save webinar';
		}
	};

	// Delete webinar
	async function deleteWebinar(id: number) {
		if (!confirm('Are you sure you want to delete this webinar?')) {
			return;
		}

		try {
			const response = await fetch('/api/del-event', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || `Error: ${response.status}`);
			}

			const apiResponse: ApiResponse<null> = await response.json();

			if (!apiResponse.success) {
				throw new Error(apiResponse.message || `Error code: ${apiResponse.error_code}`);
			}

            refresh += 1;

			console.log('Webinar deleted successfully');
		} catch (err) {
			console.error('Error deleting webinar:', err);
			error = err instanceof Error ? err.message : 'Failed to delete webinar';
		}
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
		<h1 class="text-2xl font-bold text-sky-600">Webinar Management</h1>
		<button
			class="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-700"
			onclick={openAddForm}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
					clip-rule="evenodd"
				/>
			</svg>
			Add Webinar
		</button>
	</div>

	<!-- Error message -->
	{#if error}
		<Card padding="p-4" bgColor="bg-red-50" border="border border-red-200">
			<p class="text-red-600">{error}</p>
		</Card>
	{/if}

	<!-- Webinar Form Card -->
	{#if isFormOpen}
		<Card
			title={isEditing ? 'Edit Webinar' : 'Add New Webinar'}
			padding="p-6"
			bgColor="bg-white"
			shadow="shadow-lg"
			border="border-2 border-sky-100"
		>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Event Name</p>
					<input
						type="text"
						bind:value={eventName}
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
						required
					/>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Speaker</p>
					<input
						type="text"
						bind:value={eventSpeaker}
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Start Date</p>
						<input
							type="date"
							bind:value={eventDstart}
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>

					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Start Time</p>
						<input
							type="time"
							bind:value={eventTimeStart}
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">End Date</p>
						<input
							type="date"
							bind:value={eventDend}
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>

					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">End Time</p>
						<input
							type="time"
							bind:value={eventTimeEnd}
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Event Link</p>
					<input
						type="text"
						bind:value={eventLink}
						placeholder="https://meet.google.com/..."
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Maximum Participants</p>
						<input
							type="number"
							bind:value={eventMax}
							min="1"
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>

					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Event Type</p>
						<select
							bind:value={eventAtt}
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						>
							<option value="online">Online</option>
							<option value="offline">Offline</option>
						</select>
					</div>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Image URL</p>
					<input
						type="text"
						bind:value={eventImg}
						placeholder="https://example.com/image.jpg"
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
					/>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Description</p>
					<textarea
						bind:value={eventDesc}
						rows="4"
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
					></textarea>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={closeForm}
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
					>
						{isEditing ? 'Update Webinar' : 'Create Webinar'}
					</button>
				</div>
			</form>
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
			<p class="text-center text-gray-500">No webinars found. Click "Add Webinar" to create one.</p>
		</Card>
	{:else}
		<div class="grid grid-cols-1 gap-4">
			{#each webinars as webinar}
				<Card
					title={webinar.EventName}
					subtitle={webinar.EventSpeaker ? `Speaker: ${webinar.EventSpeaker}` : undefined}
					padding="p-5"
					border="border border-gray-200"
					shadow="shadow-md"
					hover="hover:shadow-lg transition-all duration-200"
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
										<strong>Start:</strong>
										{formatDate(webinar.EventDStart)}
									</p>
									<p class="mb-2 text-sm"><strong>End:</strong> {formatDate(webinar.EventDEnd)}</p>
									<p class="mb-2 text-sm">
										<strong>Type:</strong>
										{webinar.EventAtt === 'online' ? 'Online' : 'Offline'}
									</p>
									<p class="mb-2 text-sm">
										<strong>Max Participants:</strong>
										{webinar.EventMax}
									</p>
									{#if webinar.EventLink}
										<p class="mb-2 text-sm">
											<strong>Link:</strong>
											<a
												href={webinar.EventLink}
												target="_blank"
												rel="noopener noreferrer"
												class="text-sky-600 hover:underline"
											>
												Join Webinar
											</a>
										</p>
									{/if}
								</div>
							</div>

							{#if webinar.EventDesc}
								<p class="mt-2 text-sm text-gray-600">{webinar.EventDesc}</p>
							{/if}

							{#if webinar.EventParticipants && webinar.EventParticipants.length > 0}
								<p class="mt-2 text-sm">
									<strong>Current Participants:</strong>
									{webinar.EventParticipants.length} / {webinar.EventMax}
								</p>
							{/if}
						</div>

						<div class="flex flex-col justify-between gap-2 md:items-end">
							<div class="flex gap-2">
								<button
									onclick={() => openEditForm(webinar)}
									class="flex items-center gap-1 rounded bg-amber-500 px-3 py-1.5 text-white transition-colors hover:bg-amber-600"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
										/>
									</svg>
									Edit
								</button>
								<button
									onclick={() => deleteWebinar(webinar.ID)}
									class="flex items-center gap-1 rounded bg-red-500 px-3 py-1.5 text-white transition-colors hover:bg-red-600"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
											clip-rule="evenodd"
										/>
									</svg>
									Delete
								</button>
							</div>

							<span
								class={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
									? 'Live'
									: new Date(webinar.EventDStart) > new Date()
										? 'Upcoming'
										: 'Ended'}
							</span>

							{#if webinar.EventMaterials && webinar.EventMaterials.length > 0}
								<span
									class="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
								>
									{webinar.EventMaterials.length} Materials
								</span>
							{/if}
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</Body>

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

	// Search and filter states
	let searchQuery = $state('');
	let sortBy = $state('date'); // 'date', 'name'
	let filterStatus = $state('all'); // 'all', 'live', 'upcoming', 'ended'
	let filterType = $state('all'); // 'all', 'online', 'offline'

	// Pagination states
	let pageSize = $state(10);
	let currentPage = $state(1);
	let totalItems = $state(0);
	let totalPages = $state(1);

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
	let eventImg = $state(''); // This will now hold base64 data
	let imageFile = $state<File | null>(null); // To hold the file object
	let imagePreview = $state(''); // For image preview

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
		if (searchQuery !== '' || sortBy !== 'date' || filterStatus !== 'all' || filterType !== 'all') {
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

	function formatDateForAPI(dateString: string, timeString: string): string {
		const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const dt = DateTime.fromISO(`${dateString}T${timeString}`, { zone: systemZone });

		console.log(
			`got ${dateString}T${timeString} generate ${dt.toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")}`
		);
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

	// Handle image file selection
	async function handleImageChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) {
			imageFile = null;
			imagePreview = '';
			eventImg = '';
			return;
		}

		const file = target.files[0];

		// Check file type
		const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
		if (!validTypes.includes(file.type)) {
			error = 'Invalid file type. Please upload a PNG, JPEG, or WebP image.';
			target.value = '';
			return;
		}

		// Check file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			error = 'Image size exceeds 2MB limit.';
			target.value = '';
			return;
		}

		imageFile = file;

		// Create preview
		imagePreview = URL.createObjectURL(file);

		// Convert to base64
		try {
			const base64Data = await fileToBase64(file);
			const response = await fetch('/api/upload-image-event', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data: base64Data })
			});
			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const apiResponse: ApiResponse<{ filename: string }> = await response.json();

			if (!apiResponse.success) {
				throw new Error(apiResponse.message || 'Failed to fetch webinars');
			}

			eventImg = apiResponse.data.filename;
		} catch (err) {
			console.error('Error converting image to base64:', err);
			error = 'Failed to process the image.';
		}
	}

	// Convert file to base64
	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
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
		imageFile = null;
		imagePreview = '';
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

		// Set image if available
		if (webinar.EventImg) {
			imagePreview = webinar.EventImg;
			eventImg = webinar.EventImg;
		} else {
			imagePreview = '';
			eventImg = '';
		}

		currentWebinarId = webinar.ID;

		// Open form in edit mode
		isEditing = true;
		isFormOpen = true;
	}

	// Close form
	function closeForm() {
		isFormOpen = false;
		resetForm();

		// Clear any file input
		const fileInput = document.getElementById('event-image') as HTMLInputElement;
		if (fileInput) fileInput.value = '';
	}

	// Function to construct URL with query parameters
	const createSearchParams = () => {
		return {
			limit: pageSize,
			offset: (currentPage - 1) * pageSize,
			search: searchQuery || undefined,
			sort: sortBy !== 'date' ? sortBy : undefined,
			status: filterStatus !== 'all' ? filterStatus : undefined,
			type: filterType !== 'all' ? filterType : undefined
		};
	};

	// Fetch webinars with search, filtering and pagination
	async function fetchWebinars() {
		try {
			isLoading = true;
			error = '';

			// Use new search API with POST method
			const response = await fetch('/api/search-event', {
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
			const endpoint = isEditing ? '/api/edit-event' : '/api/add-event';

			console.log('Sending webinar data:', {
				...webinarData,
				img: eventImg ? '[BASE64_DATA]' : ''
			});

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
		<h1 class="text-2xl font-bold text-sky-600">Manajement Webinar</h1>
		<button
			class="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-700"
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
			Tambahkan Webinar
		</button>
	</div>

	<!-- Items per page control -->
	<div class="mb-2 flex items-center text-sm text-black-500">
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
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
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
			title={isEditing ? 'Perbarui Webinar' : 'Tambahkan Webinar'}
			padding="p-6"
			bgColor="bg-white"
			shadow="shadow-lg"
			border="border-2 border-sky-100"
			width="w-[98.5%]"
		>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Nama Webinar</p>
					<input
						type="text"
						bind:value={eventName}
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
						required
					/>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Pembicara</p>
					<input
						type="text"
						bind:value={eventSpeaker}
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Tanggal mulai</p>
						<input
							type="date"
							bind:value={eventDstart}
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>

					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Waktu mulai</p>
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
						<p class="mb-1 block text-sm font-medium text-gray-700">Tanggal akhir</p>
						<input
							type="date"
							bind:value={eventDend}
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>

					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Waktu akhir</p>
						<input
							type="time"
							bind:value={eventTimeEnd}
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Link meeting atau tempat</p>
					<input
						type="text"
						bind:value={eventLink}
						placeholder="https://meet.google.com/... atau UKDC VL3"
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Partisipan maximal</p>
						<input
							type="number"
							bind:value={eventMax}
							min="1"
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
							required
						/>
					</div>

					<div>
						<p class="mb-1 block text-sm font-medium text-gray-700">Tipe Webinar</p>
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

				<!-- Image Upload Section -->
				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Poster Webinar</p>
					<div class="flex items-start space-x-4">
						<div class="flex-1">
							<label
								class="flex w-full cursor-pointer flex-col items-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:bg-gray-100"
							>
								<svg
									class="mb-2 h-8 w-8 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
									></path>
								</svg>
								<p class="mb-1 text-sm text-gray-500">
									<span class="font-semibold">Tekan untuk upload</span> atau drag and drop
								</p>
								<p class="text-xs text-gray-500">PNG, JPG or WebP (MAX. 2MB)</p>
								<input
									id="event-image"
									type="file"
									accept="image/png, image/jpeg, image/webp"
									class="hidden"
									onchange={handleImageChange}
								/>
							</label>
						</div>

						{#if imagePreview}
							<div class="w-32">
								<div class="relative">
									<img
										src={imagePreview}
										alt="preview"
										class="h-24 w-32 rounded-md border border-gray-200 object-cover"
									/>
									<button
										type="button"
										class="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
										onclick={() => {
											imagePreview = '';
											eventImg = '';
											imageFile = null;
											const fileInput = document.getElementById('event-image') as HTMLInputElement;
											if (fileInput) fileInput.value = '';
										}}
									>
										X
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Deskripsi</p>
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
						Batalkan
					</button>
					<button
						type="submit"
						class="rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
					>
						{isEditing ? 'Update Webinar' : 'Buat Webinar'}
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
			<p class="text-center text-gray-500">
				{totalItems === 0
					? 'Webinar tidak ditemukan. Tekan "Tambah Webinar" untuk memulai.'
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
									<p class="mb-2 text-sm"><strong>Berakhir:</strong> {formatDate(webinar.EventDEnd)}</p>
									<p class="mb-2 text-sm">
										<strong>Tipe:</strong>
										{webinar.EventAtt === 'online' ? 'Online' : 'Offline'}
									</p>
									<p class="mb-2 text-sm">
										<strong>Partisipasi maximal:</strong>
										{webinar.EventMax}
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
									onclick={() => openEditForm(webinar)}
									class="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-white transition-colors hover:bg-sky-700"
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
									onclick={() => alert("Halaman webinar belum diimplementasi")}
									class="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-white transition-colors hover:bg-sky-700"
								>
								Halaman Webinar
								</button>
								<button
									onclick={() => deleteWebinar(webinar.ID)}
									class="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-white transition-colors hover:bg-red-600"
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
									Hapus
								</button>
							</div>

							<span
								class={`p-1 rounded-xl px-2.5 py-0.5 text-xs font-medium ${
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

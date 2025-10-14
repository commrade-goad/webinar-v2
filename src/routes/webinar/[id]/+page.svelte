<script lang="ts">
	import { goto } from '$app/navigation';

	// TODO: Tambah Sertifikat, admin conrtol (tambah panitia, ubah poster, nama, pembicara, absen semua)
	// ANOTHER TODO: Selesaikan page profil dan webinar
	import { page } from '$app/state';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
	import type { ApiResponse, CertTemplate, EventParticipant, IEvent } from '$lib/types/api';
	import { onMount } from 'svelte';

	let webinarId = $derived(page.params.id);
	let data: Partial<IEvent> = $state({});
	let participantCount = $state(0);
	let participantData: Partial<EventParticipant> = $state({});
	let certExist: boolean = $state(false);
	let isLoading = $state(true);
	let error = $state('');
	let user = $derived(page.data.user);

	let isRegistered = $state(false);

	const formatDate = (dateString: string) => {
		if (!dateString) return 'Not specified';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const fetchStatus = async () => {
		try {
			const response = await fetch('/api/get-event-part-info', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: webinarId
				})
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data: ApiResponse<EventParticipant> = await response.json();
			if (data.success && data.data) {
				participantData = data.data;
				isRegistered = true;
			} else {
				participantData = {};
			}
		} catch (err) {
			console.error('Error fetching participant data:', err);
		}
	};

	const fetchPartCount = async () => {
		try {
			const response = await fetch('/api/get-event-part-count', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: webinarId
				})
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data: ApiResponse<{ count: number }> = await response.json();
			if (data.success && data.data) {
				participantCount = Number(data.data);
			}
		} catch (err) {
			console.error('Error fetching participant count:', err);
		}
	};

	const fetchData = async () => {
		try {
			isLoading = true;
			error = '';

			const response = await fetch('/api/get-event-info', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: Number(webinarId)
				})
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const retdata: ApiResponse<IEvent> = await response.json();
			if (!retdata.success) {
				throw new Error(retdata.message || 'Failed to fetch webinar data');
			}

			data = retdata.data;
		} catch (err) {
			console.error('Error fetching webinar data:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch webinar data';
		} finally {
			isLoading = false;
		}
	};

	const certIsClaimable = () => {
		const now = new Date();
		if (data.EventDEnd) {
			const end = new Date(data.EventDEnd);
			let first = now.getTime() > end.getTime();
			// Check if the cert is available and created
			return certExist && first;
		}
		return false;
	};
	const beableToEditCert = () => {
		if (participantData) {
			if (participantData.EventPRole == "committee") {
				return true;
			}
		}
		if (user.admin == 1) {
			return true;
		}
		return false;
	};

	const getCertStatus = async () => {
		try {
			const response = await fetch('/api/get-event-cert-info', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: webinarId
				})
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data: ApiResponse<EventParticipant> = await response.json();
			if (data.success && data.data) {
				certExist = data.success;
			}
		} catch (err) {
			console.error('Error fetching event cert:', err);
		}
	};

	const getEventStatus = () => {
		if (!data.EventDStart || !data.EventDEnd) return 'Unknown';

		const now = new Date();
		const start = new Date(data.EventDStart);
		const end = new Date(data.EventDEnd);

		if (now < start) return 'Upcoming';
		if (now >= start && now <= end) return 'Live';
		return 'Ended';
	};

	const regWebinar = async () => {
		try {
			error = '';

			const response = await fetch('/api/event-part-participate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: Number(webinarId),
					role: 'normal'
				})
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const retdata: ApiResponse<IEvent> = await response.json();
			if (!retdata.success) {
				throw new Error(retdata.message || 'Failed to register to webinar');
			}

			fetchStatus();
		} catch (err) {
			console.error('Error fetching webinar data:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch webinar data';
		}
	};

	const showButton = (): boolean => {
		const now = new Date();
		if (data.EventDStart) {
			const start = new Date(data.EventDStart);
			return now.getTime() <= start.getTime();
		}
		return false;
	};

	onMount(async () => {
		await fetchData();
		await fetchPartCount();
		await fetchStatus();
		await getCertStatus();
	});
</script>

<Body>
	{#if isLoading}
		<div class="flex justify-center py-12">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"
			></div>
		</div>
	{:else if error}
		<Card padding="p-4" bgColor="bg-red-50" border="border border-red-200">
			<p class="text-red-600">{error}</p>
		</Card>
	{:else}
		<div class="flex flex-col">
			<h1 class="mt-6 mb-12 text-3xl font-bold text-sky-600 sm:mb-6">{data.EventName}</h1>

			<div class="flex flex-row flex-wrap gap-5">
				<div class="w-full lg:w-[40%]">
					<Card shadow="shadow-md shadow-gray-300" border="border-gray-300">
						<div class="flex items-center justify-center">
							{#if data.EventImg}
								<img src={data.EventImg} alt="Poster webinar" class="max-h-128 max-w-full" />
							{:else}
								<div class="flex h-64 w-full items-center justify-center bg-gray-100 text-gray-400">
									Gambar tidak tersedia
								</div>
							{/if}
						</div>
					</Card>
				</div>

				<div class="flex w-full flex-col space-y-5 lg:w-[calc(60%-1.25rem)]">
					<!-- Moved the Informasi Webinar card to the top here -->
					<Card shadow="shadow-md shadow-gray-300" border="border-gray-300">
						<h2 class="mb-4 text-xl font-semibold">Informasi Webinar</h2>

						<div class="space-y-3">
							<div>
								<p class="text-sm text-gray-500">Status</p>
								<p class="font-medium">
									<span
										class={`rounded-full px-2 py-0.5 text-xs font-medium ${
											getEventStatus() === 'Live'
												? 'bg-green-100 text-green-800'
												: getEventStatus() === 'Upcoming'
													? 'bg-blue-100 text-blue-800'
													: 'bg-gray-100 text-gray-800'
										}`}
									>
										{getEventStatus() === 'Live'
											? 'Sedang Berlangsung'
											: getEventStatus() === 'Upcoming'
												? 'Akan Datang'
												: 'Selesai'}
									</span>
								</p>
							</div>

							<div>
								<p class="text-sm text-gray-500">Tipe Acara</p>
								<p class="font-medium">{data.EventAtt === 'online' ? 'Online' : 'Offline'}</p>
							</div>

							<div>
								<p class="text-sm text-gray-500">Kuota Peserta</p>
								<p class="font-medium">{participantCount} / {data.EventMax || 'Unlimited'}</p>
							</div>

							{#if !isRegistered && showButton()}
								<div class="pt-2">
									<button
										onclick={regWebinar}
										class="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
									>
										Gabung Webinar
									</button>
								</div>
							{/if}
							{#if isRegistered && certIsClaimable()}
								<div class="pt-2">
									<button
										onclick={() => {goto(`/cert-view/${participantData.EventPCode}`)}}
										class="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
									>
										Sertifikat
									</button>
								</div>
							{/if}
							{#if user.admin == 1}
								<div class="pt-2">
									<a
										href={data.EventLink}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
									>
										Tambahkan panitia Webinar(WIP)
									</a>
								</div>

							{/if}
								{#if !certExist && beableToEditCert()}
								<div class="pt-2">
									<a
										href={`${webinarId}/cert-editor`}
										class="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
									>
										Tambahkan sertifikat(WIP)
									</a>
								</div>
								{/if}
						</div>
					</Card>

					<Card shadow="shadow-md shadow-gray-300" border="border-gray-300">
						<div class="space-y-4">
							<div>
								<h2 class="mb-1 text-xl font-semibold">Pembicara</h2>
								<p class="text-lg">{data.EventSpeaker || 'Tidak Ada Informasi'}</p>
							</div>

							<div>
								<h2 class="mb-1 text-xl font-semibold">Jadwal</h2>
								<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
									<div>
										<p class="text-sm text-gray-500">Mulai</p>
										<p>{formatDate(data.EventDStart || '')}</p>
									</div>
									<div>
										<p class="text-sm text-gray-500">Selesai</p>
										<p>{formatDate(data.EventDEnd || '')}</p>
									</div>
								</div>
							</div>
						</div>
					</Card>

					<Card shadow="shadow-md shadow-gray-300" border="border-gray-300">
						<h2 class="mb-3 text-xl font-semibold">Deskripsi</h2>
						<div class="prose max-w-none">
							{#if data.EventDesc}
								<p class="whitespace-pre-line">{data.EventDesc}</p>
							{:else}
								<p class="text-gray-500 italic">Tidak ada deskripsi untuk webinar ini.</p>
							{/if}
						</div>
					</Card>

					{#if data.EventMaterials && data.EventMaterials.length > 0}
						<Card shadow="shadow-md shadow-gray-300" border="border-gray-300">
							<h2 class="mb-3 text-xl font-semibold">Materi</h2>
							<ul class="divide-y divide-gray-200">
								<!-- {#each data.EventMaterials as material}
									<li class="py-2">
										<a 
											href={material.EventmLink} 
											target="_blank" 
											rel="noopener noreferrer"
											class="flex items-center text-sky-600 hover:text-sky-800"
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
												<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
											</svg>
											{material.EventmName || 'Materi'}
										</a>
									</li>
								{/each} -->
							</ul>
						</Card>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</Body>

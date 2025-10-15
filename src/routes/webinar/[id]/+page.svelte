<script lang="ts">
	import { goto } from '$app/navigation';

	// TODO: Tambah Sertifikat
	// admin conrtol (ubah poster, nama, pembicara)
	// ANOTHER TODO: Selesaikan page profil dan webinar
	import { page } from '$app/state';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
	import type { ApiResponse, CertTemplate, EventParticipant, IEvent, User } from '$lib/types/api';
	import { onMount } from 'svelte';

	let webinarId = $derived(page.params.id);
	let data: Partial<IEvent> = $state({});
	let participantCount = $state(0);
	let participantData: Partial<EventParticipant> = $state({});
	let certExist: boolean = $state(false);
	let isLoading = $state(true);
	let error = $state('');
	let addPanitiaMenu = $state(false);
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

	const absenceAll = async () => {
		try {
			const response = await fetch('/api/event-part-absence-b', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					event_id: Number(webinarId)
				})
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data: ApiResponse<string> = await response.json();
			if (!data.success) throw new Error(`Error: ${data.message}`);
		} catch (err) {
			console.error('Error fetching participant data:', err);
		}
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

	const isWebinarFinished = () => {
		const now = new Date();
		if (data.EventDEnd) {
			const end = new Date(data.EventDEnd);
			return now.getTime() > end.getTime();
		}
		return false;
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

	const isAdminOrCommitte = () => {
		if (participantData) {
			if (participantData.EventPRole == 'committee') {
				return true;
			}
		}
		if (user.admin == 1) {
			return true;
		}
		return false;
	};

	function createSearchParams() {
		return {
			limit: 10,
			offset: 0,
			search: searchCommittee || undefined,
			sort: 'name'
		};
	}

	const getListOfUser = async () => {
		try {
			error = '';

			const response = await fetch('/api/search-user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(createSearchParams())
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const apiResponse: ApiResponse<{ users: User[]; total: number }> = await response.json();

			if (!apiResponse.success) {
				throw new Error(apiResponse.message || 'Failed to fetch users');
			}

			committeeOptions = apiResponse.data.users || [];
		} catch (err) {
			console.error('Error fetching users:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch users';
		}
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

	const delPartWebinar = async (email_u: string) => {
		try {
			error = '';

			const response = await fetch('/api/event-part-out', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					event_id: Number(webinarId),
					email: email_u
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

	const regWebinarAdmin = async (email_u: string) => {
		try {
			error = '';

			const response = await fetch('/api/event-part-participate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: Number(webinarId),
					role: 'committee',
					email: email_u
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

	const getCommitteeList = async () => {
		try {
			error = '';

			const response = await fetch('/api/get-event-part-committee', {
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

			const retdata: ApiResponse<EventParticipant[]> = await response.json();
			const users: User[] = retdata.data
				.map((item) => item.User)
				.filter((u): u is User => u !== undefined);
			selectedCommittee = [...users];

			console.log('selectedCommittee from backend:', selectedCommittee);
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
		await getCommitteeList();
	});

	////////////////
	// -- TODO -- //
	////////////////

	let showDropdown = $state(false);
	let searchCommittee = $state('');
	let selectedCommittee: Partial<User>[] = $state([]);
	let committeeOptions: Partial<User>[] = $state([]);

	function toggleCommittee(user: Partial<User>) {
		if (!user || user.ID === undefined) return;

		const index = selectedCommittee.findIndex((c) => c.ID === user.ID);

		if (index >= 0) {
			// User is already selected, remove them
			selectedCommittee = selectedCommittee.filter((c) => c.ID !== user.ID);
			// TODO: Do api call
			if (user.UserEmail) delPartWebinar(user.UserEmail);
		} else {
			// User is not selected, add them
			selectedCommittee = [...selectedCommittee, user];
			if (user.UserEmail) regWebinarAdmin(user.UserEmail);
			else console.error('dumbass');
		}
	}

	function isSelected(id: number | undefined) {
		if (!id) return false;
		return selectedCommittee.some((user) => user.ID === id);
	}
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
			<div class="flex flex-row justify-between items-center">
				<h1 class="mt-6 mb-12 text-3xl font-bold text-sky-600 sm:mb-6">{data.EventName}</h1>
				{#if isAdminOrCommitte()}
					<button
						class="items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm
						font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500
						focus:ring-offset-2 focus:outline-none h-12"
					>
						Edit
					</button>
				{/if}
			</div>

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

							{#if !isRegistered && showButton()}
								<div class="pt-2">
									<button
										onclick={regWebinar}
										class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
									>
										Gabung Webinar
									</button>
								</div>
							{/if}
							{#if isRegistered && certIsClaimable()}
								<div class="pt-2">
									<button
										onclick={() => {
											goto(`/cert-view/${participantData.EventPCode}`);
										}}
										class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
									>
										Sertifikat(WIP)
									</button>
								</div>
							{/if}
							{#if isAdminOrCommitte() && isWebinarFinished()}
								<div class="pt-2">
									<button
										onclick={absenceAll}
										class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
									>
										Absensi semua peserta
									</button>
								</div>
							{/if}
							{#if user.admin == 1}
								<div class="pt-2">
									<button
										onclick={async () => {
											addPanitiaMenu = !addPanitiaMenu;
											await getListOfUser();
										}}
										class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
									>
										Tambah Panitia
									</button>
									{#if addPanitiaMenu}
										<div class="mt-2">
											<div class="mt-4">
												<!-- Multi Select Panitia -->
												<div class="relative">
													<!-- Selected area -->
													<div
														class="flex cursor-pointer flex-wrap gap-2 rounded-xl border border-gray-300 bg-white p-2"
														onclick={() => (showDropdown = !showDropdown)}
													>
														{#if selectedCommittee.length === 0}
															<span class="text-gray-400">Pilih panitia...</span>
														{:else}
															{#each selectedCommittee as committee}
																<span
																	class="flex items-center rounded-full bg-sky-100 px-2 py-1 text-sm text-sky-700"
																>
																	{committee.UserFullName}
																	<button
																		class="ml-1 text-sky-700 hover:text-sky-900"
																		onclick={() => toggleCommittee(committee)}
																	>
																		×
																	</button>
																</span>
															{/each}
														{/if}
													</div>

													<!-- Dropdown list -->
													{#if showDropdown}
														<div
															class="absolute right-0 left-0 z-10 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg"
														>
															<input
																type="text"
																placeholder="Cari panitia..."
																bind:value={searchCommittee}
																class="w-full border-b border-gray-200 p-2 text-sm outline-none"
																onkeydown={(e) => {
																	if (e.key === 'Enter') {
																		getListOfUser();
																	}
																}}
															/>
															<ul class="max-h-40 overflow-y-auto">
																{#each committeeOptions as c}
																	<li
																		class="flex cursor-pointer items-center gap-2 p-2 text-sm hover:bg-gray-100"
																		onclick={(e) => {
																			e.stopPropagation();
																			toggleCommittee(c);
																		}}
																	>
																		<input type="checkbox" checked={isSelected(c.ID)} readonly />
																		<span>{c.UserFullName}</span>
																	</li>
																{/each}
																{#if committeeOptions.length === 0}
																	<li class="p-2 text-sm text-gray-400">Tidak ditemukan</li>
																{/if}
															</ul>
														</div>
													{/if}
												</div>
											</div>
										</div>
									{/if}
								</div>
							{/if}
							{#if !certExist && isAdminOrCommitte()}
								<div class="pt-2">
									<a
										href={`${webinarId}/cert-editor`}
										class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
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
						<h2 class="mt-3 mb-3 text-xl font-semibold">Link/Tempat</h2>
						<div class="prose max-w-none">
							{#if data.EventLink}
								{#if data.EventAtt === 'offline'}
									<p class="whitespace-pre-line">{data.EventLink}</p>
								{/if}
								{#if data.EventAtt === 'online'}
									<a class="whitespace-pre-line" href={data.EventLink} target="_blank">Link</a>
								{/if}
							{:else}
								<p class="text-gray-500 italic">Tidak ada link/tempat untuk webinar ini.</p>
							{/if}
						</div>
					</Card>
				</div>
			</div>
		</div>
	{/if}
</Body>

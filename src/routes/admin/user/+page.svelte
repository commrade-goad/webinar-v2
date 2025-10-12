<script lang="ts">
	import { onMount } from 'svelte';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
	import type { User, ApiResponse } from '$lib/types/api';

    let users = $state<User[]>([]);
    let isLoading = $state(true);
    let error = $state('');
	let isFormOpen = $state(false);
	let isEditing = $state(false);
	let isAddingAdmin = $state(false);
	let currentUserEmail = $state<string | null>(null);
	let refresh = $state(0);

    // Form fields for editing
    let editFullName = $state('');
    let editEmail = $state('');
    let editInstance = $state('');
    let editPassword = $state('');

    let searchQuery = $state('');
    let sortMode = $state('name');

	let pageSize = $state(10);
	let currentPage = $state(1);
	let totalItems = $state(0);
	let totalPages = $state(1);

	// Create search parameters object for POST request
	function createSearchParams() {
		return {
			limit: pageSize,
			offset: (currentPage - 1) * pageSize,
			search: searchQuery || undefined,
			sort: sortMode
		};
	}

	$effect(() => {
		if (refresh > 0 || currentPage > 0) {
			fetchUsers();
		}
	});
	
	$effect(() => {
		// Reset to page 1 when search changes
		if (searchQuery !== '' || sortMode !== 'name') {
			currentPage = 1;
			fetchUsers();
		}
	});

	// Function to get page numbers for pagination
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

	// Navigation for pagination
	function goToPage(page: number) {
		if (page < 1 || page > totalPages || page === currentPage) return;
		currentPage = page;
		fetchUsers();
	}

    async function fetchUsers() {
        try {
            isLoading = true;
            error = '';
            
            const response = await fetch('/api/search-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createSearchParams())
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const apiResponse: ApiResponse<{users: User[], total: number}> = await response.json();

            if (!apiResponse.success) {
                throw new Error(apiResponse.message || 'Failed to fetch users');
            }

            users = apiResponse.data.users || [];
            totalItems = apiResponse.data.total || 0;
            totalPages = Math.ceil(totalItems / pageSize);
        } catch (err) {
            console.error('Error fetching users:', err);
            error = err instanceof Error ? err.message : 'Failed to fetch users';
        } finally {
            isLoading = false;
        }
    }

    // Function to open the edit form
    function openEditForm(user: User) {
        editFullName = user.UserFullName;
        editEmail = user.UserEmail;
        editInstance = user.UserInstance || '';
        editPassword = ''; // Clear password field for security
        
        currentUserEmail = user.UserEmail;
        isEditing = true;
        isAddingAdmin = false;
        isFormOpen = true;
    }
    
    // Function to open add admin form
    function openAddAdminForm() {
        editFullName = '';
        editEmail = '';
        editInstance = '';
        editPassword = '';
        
        currentUserEmail = null;
        isEditing = false;
        isAddingAdmin = true;
        isFormOpen = true;
    }

    // Function to close the form
    function closeForm() {
        isFormOpen = false;
        isEditing = false;
        isAddingAdmin = false;
        currentUserEmail = null;
    }

    // Function to submit the edit form
    async function handleSubmit(event: Event) {
        event.preventDefault();
        
        if (isEditing && currentUserEmail) {
            await updateUser();
        } else if (isAddingAdmin) {
            await addAdminUser();
        }
    }
    
    // Function to update a user
    async function updateUser() {
        try {
            const userData = {
                email: currentUserEmail,
                name: editFullName,
                instance: editInstance,
                password: editPassword.length > 0 ? editPassword : undefined
            };
            
            const response = await fetch('/api/admin-edit-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
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
            closeForm();
            
        } catch (err) {
            console.error('Error updating user:', err);
            error = err instanceof Error ? err.message : 'Failed to update user';
        }
    }
    
    // Function to add a new admin user
    async function addAdminUser() {
        try {
            const userData = {
                email: editEmail,
                name: editFullName,
                pass: editPassword,
                instance: editInstance,
                picture: '',
                user_role: 1
            };
            
            const response = await fetch('/api/admin-add-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
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
            closeForm();
            
        } catch (err) {
            console.error('Error creating admin user:', err);
            error = err instanceof Error ? err.message : 'Failed to create admin user';
        }
    }

	// Format date for display
	function formatDate(dateString: string) {
		if (!dateString) return 'Not specified';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	// Function to determine user role text
	function getUserRole(role: number): string {
		switch(role) {
			case 1:
				return 'Admin';
			case 0:
				return 'User';
			default:
				return `Role ${role}`;
		}
	}

	// Function to delete a user
	async function deleteUser(id: number) {
		if (!confirm('Are you sure you want to delete this user?')) {
			return;
		}

		try {
			const response = await fetch('/api/admin-del-user', {
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
			console.log('User deleted successfully');
		} catch (err) {
			console.error('Error deleting user:', err);
			error = err instanceof Error ? err.message : 'Failed to delete user';
		}
	}

	onMount(() => {
		fetchUsers();
	});
</script>

<Body>
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-sky-600">Manajement User</h1>
		<div class="flex flex-row items-center">
			<button
				class="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-700 m-2"
				onclick={openAddAdminForm}
			>
				Tambahkan user admin
			</button>
		</div>
	</div>

	<div class="mb-2 flex items-center text-sm text-black-500">
		<div class="m-2">
			<p class="mb-1 block text-sm font-medium text-gray-700">Cari</p>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Cari dengan nama atau email..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
				onkeyup={(e) => e.key === 'Enter' && fetchUsers()}
			/>
		</div>
		<div class="m-2">
			<p class="mb-1 block text-sm font-medium text-gray-700">Urutkan</p>
			<select
				bind:value={sortMode}
				onchange={fetchUsers}
				class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
			>
				<option value="name">Nama (A-Z)</option>
				<option value="email">Email (A-Z)</option>
				<option value="date">Tanggal (Paling baru pertama)</option>
			</select>
		</div>

		<span class="ml-auto"
			>Users per halaman:
			<select
				bind:value={pageSize}
				onchange={() => {
					currentPage = 1;
					fetchUsers();
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

	{#if error}
		<Card padding="p-4" bgColor="bg-red-50" border="border border-red-200">
			<p class="text-red-600">{error}</p>
		</Card>
	{/if}
	
	{#if isFormOpen}
		<Card
			title={isEditing ? 'Edit User' : 'Tambah Admin Baru'}
			padding="p-6"
			bgColor="bg-white"
			shadow="shadow-lg"
			border="border-2 border-sky-100"
            width="w-[98.5%]"
		>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</p>
					<input
						type="text"
						bind:value={editFullName}
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
						required
					/>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Email</p>
					<input
						type="email"
						bind:value={editEmail}
						readonly={isEditing}
						class={`w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none ${
							isEditing 
								? 'border-gray-200 bg-gray-100 text-gray-500' 
								: 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
						}`}
						required
					/>
					{#if isEditing}
						<p class="mt-1 text-xs text-gray-500">Email tidak dapat diubah</p>
					{/if}
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">Institusi</p>
					<input
						type="text"
						bind:value={editInstance}
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
					/>
				</div>

				<div>
					<p class="mb-1 block text-sm font-medium text-gray-700">
						{isEditing ? 'Password (kosongkan jika tidak ingin mengubah)' : 'Password'}
					</p>
					<input
						type="password"
						bind:value={editPassword}
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
						required={!isEditing}
					/>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={closeForm}
						class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
					>
						Batal
					</button>
					<button
						type="submit"
						class="rounded-lg border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
					>
						{isEditing ? 'Update User' : 'Tambah Admin'}
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
	<!-- Users list -->
	{:else if users.length === 0}
		<Card padding="p-6" bgColor="bg-gray-50">
			<p class="text-center text-gray-500">
				{totalItems === 0 ? "Tidak ada user. Tambahkan user baru." : "Tidak ada user yang cocok dengan kriteria pencarian."}
			</p>
		</Card>
	{:else}
		<div class="mb-2 text-sm text-gray-500">
			Menampilkan {users.length} user (halaman {currentPage} dari {totalPages}, total: {totalItems})
		</div>
		
		<div class="grid grid-cols-1 gap-4">
			{#each users as user}
				<Card
					title={user.UserFullName}
					subtitle={user.UserEmail}
					padding="p-5"
					border="border border-gray-200"
					shadow="shadow-md"
					hover="hover:shadow-lg transition-all duration-200"
					width="w-[98%]"
				>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="col-span-2">
							<div>
								<p class="mb-2 text-sm"><strong>Institusi:</strong> {user.UserInstance || 'Tidak Ditentukan'}</p>
								<p class="mb-2 text-sm">
									<strong>Role:</strong> 
									<span class={`px-2 py-0.5 rounded-full text-xs font-medium inline-block ml-1 ${
										user.UserRole === 1 
											? 'bg-purple-100 text-purple-800' 
											: 'bg-blue-100 text-blue-800'
									}`}>
										{getUserRole(user.UserRole)}
									</span>
								</p>
								<p class="mb-2 text-sm"><strong>Bergabung:</strong> {formatDate(user.UserCreatedAt)}</p>
							</div>
						</div>

						<div class="flex flex-col justify-between gap-2 md:items-end">
							<div class="flex gap-2">
								<button
									onclick={() => openEditForm(user)}
									class="flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-white transition-colors hover:bg-sky-700"
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
									onclick={() => deleteUser(user.ID)}
									class="flex items-center gap-1 rounded-xl bg-red-500 px-3 py-1.5 text-white transition-colors hover:bg-red-600"
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

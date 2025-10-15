<script lang="ts">
	import { onMount } from 'svelte';
	import Body from "$lib/components/Body.svelte";
	import Card from "$lib/components/Card.svelte";
	import type { ApiResponse, User } from '$lib/types/api';

	// User data state
	let user = $state<Partial<User>>({});
	let isLoading = $state(true);
	let error = $state('');
	
	// Form state
	let isEditing = $state(false);
	let nameInput = $state('');
	let instanceInput = $state('');
	let currentPasswordInput = $state('');
	let newPasswordInput = $state('');
	let confirmPasswordInput = $state('');
	
	// Success message
	let successMessage = $state('');
	
	// Fetch user data
	async function fetchUserData() {
		try {
			isLoading = true;
			error = '';
			
			const response = await fetch('/api/user-info', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			
			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}
			
			const apiResponse: ApiResponse<User> = await response.json();
			
			if (!apiResponse.success) {
				throw new Error(apiResponse.message || 'Failed to fetch user data');
			}
			
			user = apiResponse.data;
			
			// Initialize form fields with current data
			nameInput = user.UserFullName || '';
			instanceInput = user.UserInstance || '';
			
		} catch (err) {
			console.error('Error fetching user data:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch user data';
		} finally {
			isLoading = false;
		}
	}
	
	// Enable editing mode
	function enableEditing() {
		isEditing = true;
		nameInput = user.UserFullName || '';
		instanceInput = user.UserInstance || '';
		currentPasswordInput = '';
		newPasswordInput = '';
		confirmPasswordInput = '';
	}
	
	// Cancel editing
	function cancelEditing() {
		isEditing = false;
		successMessage = '';
		error = '';
	}
	
	// Save user changes
	async function saveChanges() {
		try {
			error = '';
			successMessage = '';
			
			// Validate inputs
			if (nameInput.trim() === '') {
				error = 'Nama tidak boleh kosong';
				return;
			}
			
			// Validate password if any password field is filled
			if (currentPasswordInput || newPasswordInput || confirmPasswordInput) {
				if (!currentPasswordInput) {
					error = 'Password saat ini harus diisi untuk mengubah password';
					return;
				}
				
				if (!newPasswordInput) {
					error = 'Password baru harus diisi';
					return;
				}
				
				if (newPasswordInput !== confirmPasswordInput) {
					error = 'Konfirmasi password tidak cocok';
					return;
				}
				
				if (newPasswordInput.length < 8) {
					error = 'Password baru harus minimal 8 karakter';
					return;
				}
			}
			
			// Prepare data for API
			const updateData: Record<string, string> = {
				name: nameInput,
				instance: instanceInput
			};
			
			// Only include password fields if changing password
			if (currentPasswordInput && newPasswordInput) {
				updateData.old_password = currentPasswordInput;
				updateData.password = newPasswordInput;
			}
			
			// Call API to update user data
			const response = await fetch('/api/edit-user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || `Error: ${response.status}`);
			}
			
			const apiResponse: ApiResponse<User> = await response.json();
			
			if (!apiResponse.success) {
				throw new Error(apiResponse.message || 'Failed to update user data');
			}
			
			// Update local user data
			user = apiResponse.data;
			
			// Show success message and exit edit mode
			successMessage = 'Profil berhasil diperbarui';
			isEditing = false;
			
			// Clear password fields
			currentPasswordInput = '';
			newPasswordInput = '';
			confirmPasswordInput = '';
			
		} catch (err) {
			console.error('Error updating user data:', err);
			error = err instanceof Error ? err.message : 'Failed to update user data';
		}
	}
	
	// Format date for display
	function formatDate(dateString: string | undefined) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	// Initialize
	onMount(() => {
		fetchUserData();
	});
</script>

<Body>
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-sky-600">Profil</h1>
		{#if !isEditing}
			<button 
				onclick={enableEditing}
				class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
			>
				Edit Profil
			</button>
		{/if}
	</div>
	
	{#if error}
		<Card padding="p-4" bgColor="bg-red-50" border="border border-red-200" margin="mb-4">
			<p class="text-red-600">{error}</p>
		</Card>
	{/if}
	
	{#if successMessage}
		<Card padding="p-4" bgColor="bg-green-50" border="border border-green-200" margin="mb-4">
			<p class="text-green-600">{successMessage}</p>
		</Card>
	{/if}
	
	{#if isLoading}
		<div class="flex justify-center py-12">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"
			></div>
		</div>
	{:else}
		<Card shadow="shadow-md shadow-gray-300" border="border-gray-300" padding="p-6">
			{#if isEditing}
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-semibold mb-4">Edit Profil</h2>
						
						<div class="space-y-4">
							<div>
								<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
									Nama Lengkap
								</label>
								<input 
									type="text" 
									id="name" 
									bind:value={nameInput} 
									class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none" 
									placeholder="Nama Lengkap"
								/>
							</div>
							
							<div>
								<label for="instance" class="block text-sm font-medium text-gray-700 mb-1">
									Instansi
								</label>
								<input 
									type="text" 
									id="instance" 
									bind:value={instanceInput} 
									class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none" 
									placeholder="Instansi"
								/>
							</div>
							
							<div class="pt-4 border-t border-gray-200">
								<h3 class="font-medium text-gray-900 mb-2">Ubah Password (opsional)</h3>
								
								<div class="space-y-4">
									<div>
										<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
											Password Saat Ini
										</label>
										<input 
											type="password" 
											id="currentPassword" 
											bind:value={currentPasswordInput} 
											class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none" 
										/>
									</div>
									
									<div>
										<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
											Password Baru
										</label>
										<input 
											type="password" 
											id="newPassword" 
											bind:value={newPasswordInput} 
											class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none" 
										/>
									</div>
									
									<div>
										<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
											Konfirmasi Password Baru
										</label>
										<input 
											type="password" 
											id="confirmPassword" 
											bind:value={confirmPasswordInput} 
											class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none" 
										/>
									</div>
								</div>
							</div>
							
							<div class="flex justify-end gap-3 pt-4">
								<button 
									onclick={cancelEditing} 
									class="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
								>
									Batalkan
								</button>
								<button 
									onclick={saveChanges} 
									class="rounded-xl border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
								>
									Simpan Perubahan
								</button>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-semibold mb-4">Informasi Profil</h2>
						
						<div class="border-t border-gray-200 pt-4">
							<dl class="divide-y divide-gray-200">
								<div class="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3 sm:gap-6">
									<dt class="text-sm font-medium text-gray-500">Nama Lengkap</dt>
									<dd class="text-sm text-gray-900 sm:col-span-2">{user.UserFullName || '-'}</dd>
								</div>
								
								<div class="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3 sm:gap-6">
									<dt class="text-sm font-medium text-gray-500">Email</dt>
									<dd class="text-sm text-gray-900 sm:col-span-2">{user.UserEmail || '-'}</dd>
								</div>
								
								<div class="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3 sm:gap-6">
									<dt class="text-sm font-medium text-gray-500">Instansi</dt>
									<dd class="text-sm text-gray-900 sm:col-span-2">{user.UserInstance || '-'}</dd>
								</div>
								
								<div class="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3 sm:gap-6">
									<dt class="text-sm font-medium text-gray-500">Terdaftar Sejak</dt>
									<dd class="text-sm text-gray-900 sm:col-span-2">{formatDate(user.CreatedAt as string)}</dd>
								</div>
								
								{#if user.UserRole === 1}
									<div class="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3 sm:gap-6">
										<dt class="text-sm font-medium text-gray-500">Role</dt>
										<dd class="text-sm sm:col-span-2">
											<span class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
												Administrator
											</span>
										</dd>
									</div>
								{/if}
							</dl>
						</div>
					</div>
				</div>
			{/if}
		</Card>
	{/if}
</Body>
<script lang="ts">
	import { goto } from "$app/navigation";

	// Form fields
	let email = $state('');
	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let instance = $state('');
	let otpCode = $state('');
	
	// Error handling
	let error = $state('');
	let loading = $state(false);
	
	// 1 -> ask email and send otp
	// 2 -> ask rest of the info: name, pass, instance, otp_code
	let step = $state(1);

	// Send OTP function for step 1
	const sendOtp = async (event: Event) => {
		event.preventDefault();
		if (!email) {
			error = 'Email tidak boleh kosong';
			return;
		}
		
		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			error = 'Format email tidak valid';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			const res = await fetch('/api/send-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			if (!res.ok) {
				const errorData = await res.text();
				error = `Gagal mengirim OTP: ${errorData}`;
				return;
			}

			// Move to step 2
			step = 2;
		} catch (err) {
			error = `Terjadi kesalahan: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			loading = false;
		}
	};

	// Register function for step 2
	const register = async (event: Event) => {
		event.preventDefault();
		// Validate all fields
		if (!email || !name || !password || !confirmPassword || !instance || !otpCode) {
			error = 'Harap isi semua kolom';
			return;
		}
		
		if (password !== confirmPassword) {
			error = 'Password tidak cocok';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			const res = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: email,
					name: name,
					pass: password,
					instance: instance,
					otp_code: otpCode
				}),
				credentials: "include"
			});

			if (!res.ok) {
				const errorData = await res.text();
				error = `Registrasi gagal: ${errorData}`;
				return;
			}

			// Redirect to dashboard on success
			goto("/dashboard");
		} catch (err) {
			error = `Terjadi kesalahan: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			loading = false;
		}
	};
	
	// Go back to step 1
	const goBack = () => {
		step = 1;
		error = '';
	};
</script>

<section class="flex min-h-screen items-center justify-center">
	<div
		class="w-full max-w-md rounded-2xl border border-white/40 bg-white/30
           p-8 shadow-lg backdrop-blur-md transition-all duration-300"
	>
		<h1 class="mb-6 text-center text-3xl font-bold text-sky-600">Selamat Datang</h1>
		<p class="mb-8 text-center text-gray-600">
			{step === 1 ? 'Silahkan masukkan email Anda untuk memulai registrasi' : 'Lengkapi data diri Anda'}
		</p>

		{#if error}
			<div class="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
				{error}
			</div>
		{/if}

		{#if step === 1}
			<!-- Step 1: Email and OTP -->
			<form onsubmit={sendOtp} class="space-y-5">
				<div>
					<label class="mb-1 block text-gray-600" for="email">Email</label>
					<input
						id="email"
						type="email"
						placeholder="you@example.com"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-sky-300 focus:outline-none"
						bind:value={email}
						required
					/>
				</div>

				<button
					type="submit"
					class="w-full rounded-lg bg-sky-600 py-2 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70"
					disabled={loading}
				>
					{loading ? 'Mengirim...' : 'Kirim OTP'}
				</button>
			</form>
		{:else}
			<!-- Step 2: Complete registration -->
			<form onsubmit={register} class="space-y-5">
				<div>
					<label class="mb-1 block text-gray-600" for="email">Email</label>
					<input
						id="email"
						type="email"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
						value={email}
						disabled
					/>
				</div>
				
				<div>
					<label class="mb-1 block text-gray-600" for="name">Nama Lengkap</label>
					<input
						id="name"
						type="text"
						placeholder="Masukkan nama lengkap"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-sky-300 focus:outline-none"
						bind:value={name}
						required
					/>
				</div>
				
				<div>
					<label class="mb-1 block text-gray-600" for="password">Password</label>
					<input
						id="password"
						type="password"
						placeholder="Minimum 8 karakter"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-sky-300 focus:outline-none"
						bind:value={password}
						required
						minlength="8"
					/>
				</div>
				
				<div>
					<label class="mb-1 block text-gray-600" for="confirmPassword">Konfirmasi Password</label>
					<input
						id="confirmPassword"
						type="password"
						placeholder="Masukkan password kembali"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-sky-300 focus:outline-none"
						bind:value={confirmPassword}
						required
					/>
				</div>
				
				<div>
					<label class="mb-1 block text-gray-600" for="instance">Instance</label>
					<input
						id="instance"
						type="text"
						placeholder="Masukkan instance"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-sky-300 focus:outline-none"
						bind:value={instance}
						required
					/>
				</div>
				
				<div>
					<label class="mb-1 block text-gray-600" for="otpCode">Kode OTP</label>
					<input
						id="otpCode"
						type="text"
						placeholder="Masukkan kode OTP"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-sky-300 focus:outline-none"
						bind:value={otpCode}
						required
					/>
				</div>

				<div class="flex gap-3">
					<button
						type="button"
						class="w-1/3 rounded-lg border border-sky-600 py-2 font-semibold text-sky-600 transition hover:bg-sky-50"
						onclick={goBack}
						disabled={loading}
					>
						Kembali
					</button>
					
					<button
						type="submit"
						class="w-2/3 rounded-lg bg-sky-600 py-2 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70"
						disabled={loading}
					>
						{loading ? 'Memproses...' : 'Daftar'}
					</button>
				</div>
			</form>
		{/if}

		<p class="mt-6 text-center text-gray-600">
			Sudah punya akun?
			<a href="/login" class="font-medium text-sky-600 hover:underline">Login</a>
		</p>
	</div>
</section>
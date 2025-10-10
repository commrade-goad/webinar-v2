<script lang="ts">
	import { goto } from "$app/navigation";

	let email = '';
	let password = '';

	const login = async () => {
		if (!email || !password) {
			alert('Harap isi semua kolom');
			return;
		}
		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email, pass: password }),
        credentials: "include"
			});

			if (!res.ok) {
				const msg = await res.text();
				alert('Login gagal: ' + msg);
				return;
			}

      goto("/dashboard");
		} catch (err) {
			alert(err);
			return;
		}
	};
</script>

<section class="flex min-h-screen items-center justify-center">
	<div
		class="w-full max-w-md rounded-2xl rounded-xl border border-white/40 bg-white/30
           p-8 shadow-lg backdrop-blur-md transition-all duration-300"
	>
		<h1 class="mb-6 text-center text-3xl font-bold text-sky-600">Selamat Datang</h1>
		<p class="mb-8 text-center text-gray-600">Silahkan Login untuk melanjutkan</p>

		<form on:submit|preventDefault={login} class="space-y-5">
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

			<div>
				<label class="mb-1 block text-gray-600" for="password">Password</label>
				<input
					id="password"
					type="password"
					placeholder="••••••••"
					class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-sky-300 focus:outline-none"
					bind:value={password}
					required
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-lg bg-sky-600 py-2 font-semibold text-white transition hover:bg-sky-700"
			>
				Log In
			</button>
		</form>

		<p class="mt-6 text-center text-gray-600">
			Tidak punya akun?
			<a href="/register" class="font-medium text-sky-600 hover:underline">Register</a>
		</p>
	</div>
</section>

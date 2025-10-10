<script lang="ts">
  const handleStart = () => {
    window.location.href = '/login';
  };
</script>

<section class="min-h-screen flex flex-col justify-center items-center text-center">
  <h1 class="text-5xl font-bold mb-4 text-sky-600">Selamat Datang ke UKDC Webinar</h1>
  <p class="text-gray-600 mb-8 max-w-md">
    Ikuti sekarang untuk ilmu masa depanmu!
  </p>
  <button
    on:click={handleStart}
    class="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition cursor-pointer"
  >
    Mulai
  </button>
</section>
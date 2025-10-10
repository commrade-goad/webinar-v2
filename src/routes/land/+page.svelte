<script lang="ts">
  // example: you can later fetch features, or handle CTA click here
  const handleStart = () => {
    window.location.href = '/login';
  };
</script>

<section class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-yellow-100 to-sky-100 text-center">
  <h1 class="text-5xl font-bold mb-4 text-sky-600">Selamat Datang ke UKDC Webinar</h1>
  <p class="text-gray-600 mb-8 max-w-md">
    Lorem ipsum dolor sit amet.
  </p>
  <button
    on:click={handleStart}
    class="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition cursor-pointer"
  >
    Mulai
  </button>
</section>
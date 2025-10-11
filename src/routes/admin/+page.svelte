<script lang="ts">
	import { goto } from '$app/navigation';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
</script>

<Body>
  <div class="flex flex-col items-center justify-center gap-4"> 
    <Card title="Atur Webinar" width="w-[50%] min-w-[280px]" onClick={() => goto('/admin/webinar')} />
    <Card title="Atur User" width="w-[50%] min-w-[280px]" onClick={() => goto('/admin/user')} />
  </div>
</Body>

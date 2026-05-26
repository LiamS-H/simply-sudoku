<script lang="ts">
	import { theme } from '$lib/theme.svelte';
	import Button from './button.svelte';

	let open = $state(false);
</script>

<div class="absolute top-2 right-2 flex flex-col gap-2">
	<Button onclick={() => (open = !open)} intent={open ? 'secondary' : 'primary'}>Theme</Button>
	{#if open}
		<Button intent="accent" onclick={() => theme.next()}>{theme.current}</Button>
	{/if}
</div>

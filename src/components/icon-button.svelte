<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		children,
		onclick,
		disabled
	}: { children: Snippet; onclick: () => void; disabled?: boolean } = $props();
</script>

<button
	{disabled}
	class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:pointer-events-none disabled:opacity-20"
	{onclick}
>
	{@render children()}
</button>

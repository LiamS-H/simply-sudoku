<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		children,
		onclick,
		disabled,
		class: classes
	}: { children: Snippet; onclick: () => void; disabled?: boolean; class?: string } = $props();
</script>

<button
	{disabled}
	class={'flex h-9 items-center justify-center rounded-full bg-primary px-4 text-primary-foreground disabled:pointer-events-none disabled:opacity-50 ' +
		(classes ?? '')}
	{onclick}
>
	{@render children()}
</button>

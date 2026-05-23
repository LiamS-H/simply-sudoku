<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';

	const {
		children,
		onclick,
		disabled
	}: { children: Snippet; onclick: () => void; disabled?: boolean } = $props();
	import { createWebHaptics } from 'web-haptics/svelte';
	import { defaultPatterns } from 'web-haptics';
	const { trigger, destroy } = createWebHaptics();
	onDestroy(destroy);
</script>

<button
	{disabled}
	class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:pointer-events-none disabled:bg-secondary/50 disabled:text-secondary-foreground"
	onclick={() => {
		onclick?.();
		trigger(defaultPatterns.selection);
	}}
>
	{@render children()}
</button>

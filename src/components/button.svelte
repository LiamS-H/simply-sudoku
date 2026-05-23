<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';

	const {
		children,
		onclick,
		intent,
		disabled,
		class: classes
	}: {
		children: Snippet;
		onclick?: () => void;
		disabled?: boolean;
		class?: string;
		intent?: 'primary' | 'secondary' | 'destructive' | 'accent';
	} = $props();
	import { createWebHaptics } from 'web-haptics/svelte';
	import { defaultPatterns } from 'web-haptics';
	const { trigger, destroy } = createWebHaptics();
	onDestroy(destroy);

	const styles = $derived(
		intent
			? classes +
					' ' +
					{
						primary: 'bg-primary px-4 text-primary-foreground',
						secondary: 'bg-secondary px-4 text-secondary-foreground',
						destructive:
							'bg-destructive px-4 text-destructive-foreground border-2 border-destructive-foreground',
						accent: 'bg-accent px-4 text-accent-foreground'
					}[intent]
			: (classes ?? '')
	);
</script>

<button
	{disabled}
	class={'flex h-9 items-center justify-center rounded-full disabled:pointer-events-none disabled:opacity-50 ' +
		styles}
	onclick={() => {
		onclick?.();
		trigger(defaultPatterns.selection);
	}}
>
	{@render children()}
</button>

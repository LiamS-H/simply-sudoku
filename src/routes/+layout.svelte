<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { registerSW } from 'virtual:pwa-register';
	import { theme } from '$lib/theme.svelte';

	registerSW({
		immediate: true
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if theme.current !== null}
	<div data-theme={theme.current} class="min-h-dvh bg-background">
		{@render children()}
	</div>
{/if}

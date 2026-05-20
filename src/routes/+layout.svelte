<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { registerSW } from 'virtual:pwa-register';
	import { theme } from '$lib/theme.svelte';
	import { onMount } from 'svelte';

	registerSW({
		immediate: true
	});
	let is_ssr = $state(true);

	let { children } = $props();

	onMount(() => {
		is_ssr = false;
	});
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', theme.current);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if is_ssr}
	<!-- add the icon svg -->
{:else}
	<div class="safe-top safe-bottom safe-x flex h-dvh flex-col bg-background text-foreground font-sans select-none overflow-hidden">
		{@render children()}
	</div>
{/if}

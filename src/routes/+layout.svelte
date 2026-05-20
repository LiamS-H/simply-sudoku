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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if is_ssr}
	<!-- add the icon svg -->
{:else}
	<div
		data-theme={theme.current}
		class="h-dvh grid-rows-[auto] bg-background text-foreground font-sans select-none"
	>
		{@render children()}
	</div>
{/if}

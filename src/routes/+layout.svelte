<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { registerSW } from 'virtual:pwa-register';

	registerSW({
		immediate: true
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>
{@render children()}

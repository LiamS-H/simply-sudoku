<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$components/button.svelte';
	import Game from './game.svelte';

	let { data } = $props();
</script>

<div class="relative h-full w-full">
	<a href={resolve('/')}>
		<Button class="absolute top-5 left-5">⇐</Button>
	</a>

	{#await data.game.promise}
		<div class="flex h-full w-full items-center justify-center">
			<span>Generating...</span>
		</div>
	{:then game}
		<Game {game} />
	{/await}
</div>

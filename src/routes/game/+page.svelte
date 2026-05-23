<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$components/button.svelte';
	import type { UserBoard } from '$lib/game/board.js';
	import Game from '$components/game.svelte';
	import { fade } from 'svelte/transition';
	import Loading from './loading.svelte';

	let { data } = $props();

	// eslint-disable-next-line no-useless-assignment
	let resolvedGame = $state<UserBoard | null>(null);
	resolvedGame = (() => data.game.initial)();

	$effect(() => {
		resolvedGame = data.game.initial;
		data.game.promise.then((g) => {
			resolvedGame = g;
		});
	});
</script>

<div class="relative h-full w-full">
	<a href={resolve('/')}>
		<Button intent="destructive" class="absolute top-2 left-2 z-20">⇐</Button>
	</a>

	{#if !resolvedGame}
		<div out:fade={{ duration: 300 }} class="absolute inset-0 z-10 bg-background">
			<Loading />
		</div>
	{/if}

	{#if resolvedGame}
		<div in:fade={{ duration: 300 }} class="h-full w-full">
			<Game game={resolvedGame} />
		</div>
	{/if}
</div>

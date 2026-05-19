<script lang="ts">
	import Game from './game.svelte';

	let { data } = $props();
</script>

{#await data.game.promise}
	<div class="flex h-full w-full items-center justify-center">
		<span>Generating...</span>
	</div>
{:then game}
	<Game {game} />
{/await}

<script lang="ts">
	import Game from './game.svelte';

	let { data } = $props();
</script>

{#await data.game.promise then game}
	<Game {game} />
{/await}

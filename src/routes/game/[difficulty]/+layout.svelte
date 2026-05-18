<script lang="ts">
	let { data, children } = $props();
</script>

{#await data.game.promise}
	<span>loading...</span>
{:then game}
	{#if game}
		{@render children()}
	{/if}
{/await}

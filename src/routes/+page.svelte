<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Button from '$components/button.svelte';
	import RoundButton from '$components/icon-button.svelte';
	import { DIFFICULTIES } from '$lib/game/board';
	import { games } from '$lib/games.svelte';

	function get_difficulty(): number {
		const saved = localStorage.getItem('difficulty');
		if (!saved) {
			localStorage.setItem('difficulty', '1');
			return 1;
		}
		const num = Number.parseInt(saved);
		if (Number.isNaN(num)) {
			localStorage.setItem('difficulty', '1');
			return 1;
		}
		return num;
	}
	let difficulty_index = $state(get_difficulty());
	let confirming = $state(false);

	$effect(() => {
		localStorage.setItem('difficulty', difficulty_index.toString());
		confirming = false;
	});

	const difficulty = $derived(DIFFICULTIES[difficulty_index]);

	const has_saved = $derived(games.get(difficulty) !== null);
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="flex h-32 flex-col items-center gap-2">
		<div class="flex gap-2">
			<RoundButton disabled={difficulty_index === 0} onclick={() => difficulty_index--}
				>-</RoundButton
			>
			<span
				class="flex h-9 w-32 items-center justify-center rounded-full bg-primary text-primary-foreground"
			>
				{difficulty}
			</span>
			<RoundButton
				disabled={difficulty_index === DIFFICULTIES.length - 1}
				onclick={() => difficulty_index++}>+</RoundButton
			>
		</div>

		{#if confirming}
			<Button
				intent="secondary"
				onclick={() => {
					confirming = false;
				}}
				class="w-full"
			>
				Cancel
			</Button>
			<Button
				intent="destructive"
				onclick={() => {
					games.save(difficulty, null);
					goto(resolve(`/game?difficulty=${difficulty}`));
				}}
				class="w-full"
			>
				I want a new puzzle.
			</Button>
		{:else}
			<Button
				intent="primary"
				onclick={() => {
					if (has_saved) {
						confirming = true;
					} else {
						games.save(difficulty, null);
						goto(resolve(`/game?difficulty=${difficulty}`));
					}
				}}
				class="w-full"
			>
				New Game
			</Button>
			{#if has_saved}
				<Button
					intent="primary"
					onclick={() => {
						goto(resolve(`/game?difficulty=${difficulty}`));
					}}
					class="w-full"
				>
					Continue
				</Button>
			{/if}
		{/if}
	</div>
</div>

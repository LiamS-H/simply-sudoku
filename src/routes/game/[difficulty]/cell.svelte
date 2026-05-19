<script lang="ts">
	import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
	import type { SudokuPlayer } from '$lib/game/client.svelte';

	let {
		row,
		col,
		player,
		view_number,
		selected
	}: {
		row: SudokuPosition;
		col: SudokuPosition;
		player: SudokuPlayer;
		view_number: SudokuValInput;
		selected: boolean;
	} = $props();

	const problemVal = $derived(player.problem[row][col]);
	const workCell = $derived(player.work.rows[row][col]);

	const spanClass = $derived.by(() => {
		const spanClass = 'flex h-full w-full items-center justify-center rounded-full';
		const val = problemVal || workCell.val;
		if (selected) {
			return spanClass + ' bg-accent-foreground text-accent';
		}
		if (val !== 0 && val === view_number) {
			return spanClass + ' bg-primary text-primary-foreground';
		}

		if (problemVal !== 0) {
			return spanClass + ' bg-secondary text-background';
		}
		if (workCell.val !== 0) {
			return spanClass + ' text-primary-foreground';
		}

		return null;
	});
</script>

<button
	class="flex items-center justify-center bg-background text-3xl font-semibold transition-colors
		{col === 0 ? 'border-l border-l-primary/20' : ''}
		{row === 0 ? 'border-t border-t-primary/20' : ''}
		{col % 3 === 2 && col !== 8 ? 'border-r-2 border-r-primary/50' : 'border-r border-r-primary/20'}
		{row % 3 === 2 && row !== 8 ? 'border-b-2 border-b-primary/50' : 'border-b border-b-primary/20'}"
>
	{#if spanClass !== null}
		{@const val = problemVal || workCell.val}
		<div class={spanClass}>
			{#if val !== 0}
				<span>
					{val}
				</span>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-3 grid-rows-3 text-[10px] leading-tight text-gray-400 sm:text-xs">
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as n (n)}
				<div class="flex items-center justify-center">
					{workCell[n as 1] ? n : ''}
				</div>
			{/each}
		</div>
	{/if}
</button>

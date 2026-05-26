<script lang="ts">
	import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
	import type { SudokuPlayer } from '$lib/game/client.svelte';

	let {
		row,
		col,
		player,
		view_number,
		selected,
		error,
		fade,
		grow,
		row_complete = false,
		col_complete = false,
		box_complete = false,
		val_complete = false
	}: {
		row: SudokuPosition;
		col: SudokuPosition;
		player: SudokuPlayer;
		view_number: SudokuValInput;
		selected: boolean;
		error: boolean;
		fade: { delay: number; key: number };
		grow: { delay: number; key: number };
		row_complete?: boolean;
		col_complete?: boolean;
		box_complete?: boolean;
		val_complete?: boolean;
	} = $props();

	const problemVal = $derived(player.problem[row][col]);
	const workCell = $derived(player.work.rows[row][col]);

	const val = $derived(problemVal || workCell.val);
	const state = $derived.by(() => {
		if (error && selected) return 'error-selected';
		if (error) return 'error';
		if (selected && val) return 'selected';
		if (val !== 0 && val === view_number) return 'match';
		if (problemVal !== 0) return 'fixed';
		if (workCell.val !== 0) return 'work';
		return null;
	});
</script>

<button
	class="relative z-10 flex items-center justify-center bg-transparent text-2xl font-semibold transition-colors
		{col === 0 ? 'border-l border-l-primary/20' : ''}
		{row === 0 ? 'border-t border-t-primary/20' : ''}
		{col % 3 === 2 && col !== 8 ? 'border-r-2 border-r-primary/50' : 'border-r border-r-primary/20'}
		{row % 3 === 2 && row !== 8 ? 'border-b-2 border-b-primary/50' : 'border-b border-b-primary/20'}"
	data-row-complete={row_complete}
	data-col-complete={col_complete}
	data-box-complete={box_complete}
>
	{#key fade.key}
		{#if fade.key > 0}
			<div
				class="victory-fade pointer-events-none absolute inset-0 z-0"
				style="animation-delay: {fade.delay}ms"
			></div>
		{/if}
	{/key}
	{#if state !== null}
		<div
			class="relative z-10 m-1 flex aspect-square flex-1 items-center justify-center rounded-full"
			data-state={state}
			data-value={val}
			data-val-complete={val_complete}
		>
			{#if val !== 0}
				{#key grow.key}
					<span
						class="inline-block"
						class:victory-grow={grow.key > 0}
						style="animation-delay: {grow.delay}ms"
					>
						{val}
					</span>
				{/key}
			{/if}
		</div>
	{:else}
		<div
			class="relative z-10 grid h-full w-full grid-cols-3 grid-rows-3 text-[10px] leading-tight text-foreground"
		>
			{#if view_number !== 0 && workCell[view_number]}
				<div class="absolute -z-10 flex" data-hint="true" data-value={view_number}></div>
			{/if}
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as n (n)}
				<div class="flex items-center justify-center" data-value={n}>
					{workCell[n as 1] ? n : ''}
				</div>
			{/each}
		</div>
	{/if}
</button>

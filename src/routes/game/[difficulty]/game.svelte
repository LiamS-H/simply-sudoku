<script lang="ts">
	import type { UserBoard } from '$lib/game/board';
	import { SudokuPlayer } from '$lib/game/client.svelte';
	import Button from '$components/button.svelte';
	import type { SudokuPosition } from '$lib/game/action';

	const { game: _game }: { game: UserBoard } = $props();

	const player = $derived(new SudokuPlayer(_game));

	const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
	const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

	let selected = $state<{ row: SudokuPosition; col: SudokuPosition } | null>(null);
	let annotate = $state(false);
</script>

{#snippet cell(row: SudokuPosition, col: SudokuPosition)}
	{@const problemVal = player.problem[row][col]}
	{@const workCell = player.work.rows[row][col]}
	{@const isSelected = selected?.row === row && selected?.col === col}
	<button
		onclick={() => (selected = { row, col })}
		class="flex items-center justify-center text-3xl font-semibold
      {col === 0 ? 'border-l border-l-primary/20' : ''}
      {row === 0 ? 'border-t border-t-primary/20' : ''}
      {col % 3 === 2 && col !== 8
			? 'border-r-2 border-r-primary/50'
			: 'border-r border-r-primary/20'}
      {row % 3 === 2 && row !== 8
			? 'border-b-2 border-b-primary/50'
			: 'border-b border-b-primary/20'}
      {isSelected ? 'bg-accent text-accent-foreground' : 'bg-background'}
       transition-colors"
	>
		{#if problemVal !== 0}
			<span class="h-full w-full rounded-full bg-secondary pt-1 text-background">
				{problemVal}
			</span>
		{:else if workCell.val !== 0}
			<span class="h-full w-full rounded-full bg-primary pt-1 text-background">
				{workCell.val}
			</span>
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
{/snippet}

<div class="flex h-full flex-col items-center justify-center gap-6 p-4">
	<div class="flex w-full max-w-md items-center justify-between">
		<h1 class="text-2xl font-bold">{player.difficulty} Sudoku</h1>
		<div class="flex gap-2">
			<button
				onclick={() => player.clear()}
				class="rounded-full border-2 bg-destructive px-3 text-destructive-foreground disabled:opacity-50"
			>
				Clear
			</button>
			<Button
				onclick={() => player.undo()}
				disabled={player.moves.length === 0}
				class="bg-gray-200 text-black hover:bg-gray-300 active:bg-gray-400"
			>
				Undo
			</Button>
		</div>
	</div>

	<div class="grid aspect-square w-full max-w-md grid-cols-9 grid-rows-9 select-none">
		{#each rows as row (row)}
			{#each cols as col (col)}
				{@render cell(row, col)}
			{/each}
		{/each}
	</div>

	<div class="flex flex-col items-center gap-4">
		<div class="flex flex-wrap justify-center gap-2">
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const as n (n)}
				<button
					onclick={() => {
						if (selected && player.problem[selected.row][selected.col] === 0) {
							player.edit(n, selected.row, selected.col, annotate);
						}
					}}
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 font-bold hover:bg-gray-200 active:bg-gray-300 sm:h-12 sm:w-12 sm:text-lg"
				>
					{n === 0 ? '⌫' : n}
				</button>
			{/each}
		</div>

		<div class="flex gap-4">
			<button
				onclick={() => (annotate = !annotate)}
				class={`h-9 rounded-full border border-primary px-3 ${annotate ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
			>
				Mark
			</button>
		</div>
	</div>
</div>

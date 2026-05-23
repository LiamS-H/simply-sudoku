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
		grow
	}: {
		row: SudokuPosition;
		col: SudokuPosition;
		player: SudokuPlayer;
		view_number: SudokuValInput;
		selected: boolean;
		error: boolean;
		fade: { delay: number; key: number };
		grow: { delay: number; key: number };
	} = $props();

	const problemVal = $derived(player.problem[row][col]);
	const workCell = $derived(player.work.rows[row][col]);

	const spanClass = $derived.by(() => {
		let spanClass = ' flex flex-1 items-center justify-center rounded-full aspect-square';
		const val = problemVal || workCell.val;
		if (error && selected) {
			return spanClass + ' text-destructive';
		}
		if (error) {
			return spanClass + ' text-destructive-foreground bg-destructive';
		}
		if (selected && val) {
			return spanClass + ' text-accent';
		}
		if (val !== 0 && val === view_number) {
			return spanClass + ' bg-primary text-primary-foreground';
		}

		if (problemVal !== 0) {
			return spanClass + ' bg-secondary text-background';
		}
		if (workCell.val !== 0) {
			return spanClass + ' text-foreground';
		}

		return null;
	});
</script>

<button
	class="relative z-10 flex items-center justify-center bg-transparent p-1 text-2xl font-semibold transition-colors
		{col === 0 ? 'border-l border-l-primary/20' : ''}
		{row === 0 ? 'border-t border-t-primary/20' : ''}
		{col % 3 === 2 && col !== 8 ? 'border-r-2 border-r-primary/50' : 'border-r border-r-primary/20'}
		{row % 3 === 2 && row !== 8 ? 'border-b-2 border-b-primary/50' : 'border-b border-b-primary/20'}"
>
	{#key fade.key}
		{#if fade.key > 0}
			<div
				class="animate-bg-fade-primary pointer-events-none absolute inset-0 z-0"
				style="animation-delay: {fade.delay}ms"
			></div>
		{/if}
	{/key}
	{#if spanClass !== null}
		{@const val = problemVal || workCell.val}
		<div class="{spanClass} relative z-10">
			{#if val !== 0}
				{#key grow.key}
					<span
						class="inline-block {grow.key > 0 ? 'animate-grow-spin' : ''}"
						style="animation-delay: {grow.delay}ms"
					>
						{val}
					</span>
				{/key}
			{/if}
		</div>
	{:else}
		<div
			class="relative z-10 grid h-full w-full grid-cols-3 grid-rows-3 text-[8px] leading-tight text-foreground sm:text-xs"
		>
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as n (n)}
				<div class="flex items-center justify-center">
					{workCell[n as 1] ? n : ''}
				</div>
			{/each}
		</div>
	{/if}
</button>

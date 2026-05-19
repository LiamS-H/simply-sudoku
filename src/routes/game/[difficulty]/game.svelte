<script lang="ts">
	import type { UserBoard } from '$lib/game/board';
	import { SudokuPlayer } from '$lib/game/client.svelte';
	import Button from '$components/button.svelte';
	import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
	import Cell from './cell.svelte';

	const { game }: { game: UserBoard } = $props();

	const player = $derived(new SudokuPlayer(game));

	const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
	const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

	let selected = $state<{ row: SudokuPosition; col: SudokuPosition } | null>(null);
	let edit_number: SudokuValInput | null = $state(null);
	let view_number: SudokuValInput = $state(0);

	let annotate = $state(false);
</script>

<div class="flex h-full flex-col items-center justify-center gap-2 p-1">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onpointerup={(e) => {
			const { left, top } = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - left;
			const y = e.clientY - top;
			const w = e.currentTarget.clientWidth;
			const h = e.currentTarget.clientHeight;
			const row = Math.round((y / h) * 9 - 0.5) as SudokuPosition;
			const col = Math.round((x / w) * 9 - 0.5) as SudokuPosition;

			if (player.problem[row][col] !== 0) {
				view_number = player.problem[row][col] as SudokuValInput;
				return;
			}

			selected = { row, col };

			if (edit_number) {
				player.edit(edit_number, row, col, annotate);
			}
		}}
		class="grid aspect-square w-full grid-cols-9 grid-rows-9 select-none md:max-w-md"
	>
		{#each rows as row (row)}
			{#each cols as col (col)}
				<Cell
					{row}
					{col}
					{player}
					{view_number}
					selected={selected?.row === row && selected?.col === col}
				/>
			{/each}
		{/each}
	</div>

	<div class="flex flex-col items-center">
		<div class="grid w-full grid-cols-5 md:grid-cols-10">
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const as n (n)}
				<button
					onpointerdown={() => {
						if (edit_number === n) {
							edit_number = null;
							view_number = 0;
							if (selected) {
								player.edit(0, selected.row, selected.col, annotate);
							}
							return;
						}
						if (selected) {
							player.edit(n, selected.row, selected.col, annotate);
						}
						edit_number = n;
						view_number = n;
					}}
					class="flex h-14 w-14 items-center justify-center"
				>
					<span
						class={`flex h-12 w-12 items-center justify-center rounded-full border border-secondary text-3xl ${edit_number === n ? 'bg-secondary text-secondary-foreground' : 'text-secondary'}`}
					>
						{n === 0 ? 'X' : n}
					</span>
				</button>
			{/each}
		</div>

		<div class="flex gap-4 pt-4">
			<button
				onclick={() => {
					player.clear();
					selected = null;
				}}
				class="rounded-full border-2 bg-destructive px-3 text-destructive-foreground disabled:opacity-50"
				disabled={player.work.rows.every((row) => row.every((cell) => cell.val === 0))}
			>
				Clear
			</button>
			<button
				onclick={() => (annotate = !annotate)}
				class={`h-9 rounded-full border border-primary px-3 ${annotate ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
			>
				Mark
			</button>

			<Button onclick={() => player.undo()} disabled={player.moves.length === 0}>Undo</Button>
		</div>
	</div>
</div>

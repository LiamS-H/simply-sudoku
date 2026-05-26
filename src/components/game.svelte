<script lang="ts">
	import type { UserBoard } from '$lib/game/board';
	import { SudokuPlayer } from '$lib/game/client.svelte';
	import Button from '$components/button.svelte';
	import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
	import { games } from '$lib/games.svelte';
	import { onMount } from 'svelte';
	import Cell from '$components/cell.svelte';
	import { encode, findCompleted, findErrors, CELL_BOX } from '$lib/solver/utils';
	import { onDestroy } from 'svelte';
	import { createWebHaptics } from 'web-haptics/svelte';
	import { defaultPatterns } from 'web-haptics';
	const { trigger, destroy } = createWebHaptics();
	onDestroy(destroy);
	// import { invalidateAll } from '$app/navigation';

	const { game }: { game: UserBoard } = $props();

	const player = $derived(new SudokuPlayer(game));

	const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
	const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

	let selected = $state<{ row: SudokuPosition; col: SudokuPosition } | null>(null);
	let edit_number: SudokuValInput | null = $state(null);
	let view_number: SudokuValInput = $state(0);

	let annotate = $state(false);

	function save() {
		games.save(player.difficulty, player.board);
	}

	onMount(() => {
		const interval = setInterval(save, 15000);
		window.addEventListener('blur', save);

		return () => {
			clearInterval(interval);
			window.removeEventListener('blur', save);
			save();
		};
	});

	const errors = $derived.by(() => {
		const work = encode(player.work.rows.map((row) => row.map((cell) => cell.val)));
		const problem = encode(player.problem);
		return findErrors(work, problem) ?? [];
	});

	// the correct box for a given row column can be found with (r/3|0)*3+(c/3|0)
	const [rowsC, colsC, boxesC, counts, complete] = $derived.by(() => {
		const board = encode(
			player.work.rows.map((row, r) => row.map((cell, c) => player.problem[r][c] || cell.val))
		);
		return findCompleted(board);
	});

	let lastSelected = $state<{ row: SudokuPosition; col: SudokuPosition }>({ row: 0, col: 0 });
	let fadeAnimations = $state(Array.from({ length: 81 }, () => ({ delay: 0, key: 0 })));
	let growAnimations = $state(Array.from({ length: 81 }, () => ({ delay: 0, key: 0 })));

	let prev: {
		rows: Uint8Array;
		cols: Uint8Array;
		boxes: Uint8Array;
		counts: Uint8Array;
		complete: boolean;
	} | null = null;

	$effect(() => {
		const rC = rowsC;
		const cC = colsC;
		const bC = boxesC;
		const cnt = counts;
		const comp = complete;
		if (complete) {
			selected = null;
			edit_number = null;
			view_number = 0;
		}

		if (prev === null) {
			prev = {
				rows: rC.slice(),
				cols: cC.slice(),
				boxes: bC.slice(),
				counts: cnt.slice(),
				complete: comp
			};
			return;
		}

		const triggerFade = (r: number, c: number, delay: number) => {
			const idx = r * 9 + c;
			fadeAnimations[idx].delay = delay;
			fadeAnimations[idx].key++;
		};

		const triggerGrow = (r: number, c: number, delay: number) => {
			const idx = r * 9 + c;
			growAnimations[idx].delay = delay;
			growAnimations[idx].key++;
		};
		if (comp && !prev.complete) {
			trigger(defaultPatterns.buzz);
			for (let r = 0; r < 9; r++) {
				for (let c = 0; c < 9; c++) {
					const delay = (r + c) * 50;
					triggerFade(r, c, delay);
					triggerGrow(r, c, delay);
				}
			}
			prev = {
				rows: rC.slice(),
				cols: cC.slice(),
				boxes: bC.slice(),
				counts: cnt.slice(),
				complete: comp
			};
			return;
		}
		let fading = false;
		let growing = false;
		for (let i = 0; i < 9; i++) {
			if (rC[i] && !prev.rows[i]) {
				for (let c = 0; c < 9; c++) {
					const delay = Math.abs(c - lastSelected.col) * 50;
					triggerFade(i, c, delay);
					fading = true;
				}
			}
		}
		for (let i = 0; i < 9; i++) {
			if (cC[i] && !prev.cols[i]) {
				for (let r = 0; r < 9; r++) {
					const delay = Math.abs(r - lastSelected.row) * 50;
					triggerFade(r, i, delay);
					fading = true;
				}
			}
		}
		for (let i = 0; i < 9; i++) {
			if (bC[i] && !prev.boxes[i]) {
				const br = Math.floor(i / 3) * 3;
				const bc = (i % 3) * 3;
				for (let r = br; r < br + 3; r++) {
					for (let c = bc; c < bc + 3; c++) {
						const delay = (Math.abs(r - lastSelected.row) + Math.abs(c - lastSelected.col)) * 50;
						triggerFade(r, c, delay);
						fading = true;
					}
				}
			}
		}
		for (let i = 0; i < 9; i++) {
			if (cnt[i] >= 9 && prev.counts[i] < 9) {
				const val = i + 1;
				for (let r = 0; r < 9; r++) {
					for (let c = 0; c < 9; c++) {
						if (player.problem[r][c] === val || player.work.rows[r][c].val === val) {
							triggerGrow(r, c, 0);
							growing = true;
						}
					}
				}
			}
		}

		if (growing && fading) {
			trigger([
				{ duration: 30, intensity: 1 },
				{ delay: 20, duration: 200, intensity: 1 },
				{ delay: 20, duration: 40, intensity: 1 },
				{ delay: 20, duration: 30, intensity: 1 },
				{ delay: 40, duration: 40 },
				{ delay: 10, duration: 140, intensity: 0.7 },
				{ delay: 30, duration: 30 }
			]);
		} else if (growing) {
			trigger([
				{ duration: 200, intensity: 1 },
				{ delay: 10, duration: 10 }
			]);
		} else if (fading) {
			trigger([
				{ duration: 30, intensity: 1 },
				{ delay: 20, duration: 30, intensity: 1 },
				{ delay: 20, duration: 40, intensity: 1 },
				{ delay: 10, duration: 30, intensity: 1 },
				{ delay: 20, duration: 40, intensity: 1 },
				{ delay: 20, duration: 130 },
				{ delay: 20, duration: 50 }
			]);
		}

		prev = {
			rows: rC.slice(),
			cols: cC.slice(),
			boxes: bC.slice(),
			counts: cnt.slice(),
			complete: comp
		};
	});
</script>

<!-- {#if complete || true}
	<Button
		intent="destructive"
		class="absolute top-2 right-2 z-20"
		onclick={async () => {
			games.save(game.difficulty, null);
			await invalidateAll();
		}}>New Game</Button
	>
{/if} -->
<div class="flex h-full flex-col items-center justify-center gap-2 overflow-hidden p-1">
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

			const prob_val = player.problem[row][col] as SudokuValInput;
			if (prob_val !== 0) {
				view_number = prob_val === view_number ? 0 : prob_val;
				selected = null;
				lastSelected = { row, col };
				return;
			}
			trigger(defaultPatterns.light);
			const val = player.work.rows[row][col].val as SudokuValInput;
			if (val) {
				view_number = val;
			}

			if (edit_number !== null) {
				player.edit(edit_number, row, col, annotate);
				lastSelected = { row, col };
				return;
			}
			if (selected?.row === row && selected?.col === col) {
				selected = null;
			} else {
				selected = { row, col };
				lastSelected = { row, col };
			}
		}}
		class="relative grid aspect-square w-full grid-cols-9 grid-rows-9 bg-background md:max-w-md"
	>
		<div
			class="pointer-events-none absolute z-0 p-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] {selected
				? 'opacity-100'
				: 'opacity-0'}"
			style="width: 11.11%; height: 11.11%; left: {(selected?.col ?? 0) *
				11.11}%; top: {(selected?.row ?? 0) * 11.11}%"
			data-selection="true"
		>
			<div class="h-full w-full"></div>
		</div>
		{#each rows as row (row)}
			{#each cols as col (col)}
				<Cell
					error={errors.includes(`${row}${col}`)}
					{row}
					{col}
					{player}
					{view_number}
					selected={selected?.row === row && selected?.col === col}
					fade={fadeAnimations[row * 9 + col]}
					grow={growAnimations[row * 9 + col]}
					row_complete={!!rowsC[row]}
					col_complete={!!colsC[col]}
					box_complete={!!boxesC[CELL_BOX[row * 9 + col]]}
					val_complete={(player.problem[row][col] || player.work.rows[row][col].val) !== 0 &&
						counts[(player.problem[row][col] || player.work.rows[row][col].val) - 1] >= 9}
				/>
			{/each}
		{/each}
	</div>

	<div class="flex flex-col items-center">
		<div class="grid w-full grid-cols-5 md:grid-cols-10">
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const as n (n)}
				<button
					onpointerdown={() => {
						trigger(defaultPatterns.selection);
						if (edit_number === n) {
							edit_number = null;
							view_number = 0;
							return;
						}
						if (selected) {
							player.edit(n, selected.row, selected.col, annotate);
							view_number = n;
						} else {
							edit_number = n;
							view_number = n;
						}
					}}
					class="flex h-14 w-14 items-center justify-center"
					class:opacity-25={n !== 0 && counts[n - 1] >= 9}
					data-value={n}
					data-val-complete={n !== 0 && counts[n - 1] >= 9}
					data-selected={edit_number === n}
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
			<Button
				intent="destructive"
				onclick={() => {
					player.clear();
					selected = null;
				}}
				disabled={player.work.rows.every((row) => row.every((cell) => cell.val === 0))}
			>
				Clear
			</Button>
			<Button
				onclick={() => (annotate = !annotate)}
				class={`border border-primary px-3 ${annotate ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'}`}
			>
				Mark
			</Button>

			<Button intent="primary" onclick={() => player.undo()} disabled={player.moves.length === 0}
				>Undo</Button
			>
		</div>
	</div>
</div>

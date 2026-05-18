<script lang="ts">
	let { data } = $props();
	const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8];
	const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8];
</script>

{#await data.game.promise then game}
	{#snippet cell(row: number, col: number)}
		<div
			class="flex items-center justify-center text-xl font-semibold
      sm:text-3xl
      {col % 3 === 2 && col !== 8 ? 'border-r-2 border-r-background' : 'border-r'}
      {row % 3 === 2 && row !== 8 ? 'border-b-2 border-b-background' : 'border-b'}
       transition-colors"
		>
			{game.problem[col][row]}
		</div>
	{/snippet}
	<div class="flex h-full flex-col items-center justify-center">
		<h1 class="text-2xl font-bold">{game.difficulty} Sudoku</h1>
		<div
			class="grid aspect-square w-full grid-cols-9 grid-rows-9 bg-white shadow-xl select-none md:h-full md:w-auto"
		>
			{#each rows as row (row)}
				{#each cols as col (col)}
					{@render cell(row, col)}
				{/each}
			{/each}
		</div>
	</div>
{/await}

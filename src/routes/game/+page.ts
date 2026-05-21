import { get_empty_work, type Difficulty, DIFFICULTIES } from '$lib/game/board';
import { games } from '$lib/games.svelte';
import { sudoku_solver } from '$lib/solver/client';
import { error } from '@sveltejs/kit';

export const load = async ({ url }) => {
	const difficulty = (url.searchParams.get('difficulty') as Difficulty) || 'Easy';

	if (!DIFFICULTIES.includes(difficulty)) {
		error(404, 'Invalid difficulty');
	}

	const existing = games.get(difficulty);

	return {
		game: {
			initial: existing || null,
			promise: (async () => {
				if (existing) return existing;

				const board = await sudoku_solver.generate_board(difficulty);
				const sudoku = { difficulty, moves: [], ...board, work: get_empty_work() };
				games.save(difficulty, sudoku);
				return sudoku;
			})()
		}
	};
};

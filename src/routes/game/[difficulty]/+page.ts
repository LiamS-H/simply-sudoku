import { get_empty_work, type Difficulty, DIFFICULTIES } from '$lib/game/board';
import { games } from '$lib/games.svelte';
import { sudoku_solver } from '$lib/solver/client';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const difficulty = params.difficulty as Difficulty;

	if (!DIFFICULTIES.includes(difficulty)) {
		error(404, 'Invalid difficulty');
	}

	return {
		game: {
			promise: (async () => {
				const existing = games.get(difficulty);
				if (existing) return existing;

				const board = await sudoku_solver.generate_board(difficulty);
				const sudoku = { difficulty, moves: [], ...board, work: get_empty_work() };
				games.save(difficulty, sudoku);
				return sudoku;
			})()
		}
	};
};

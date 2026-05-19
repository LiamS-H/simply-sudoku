/// <reference lib="webworker" />

import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
import type { Difficulty, Solution } from '$lib/game/board';
import { generatePuzzle } from './generate';
import { decode } from './utils';

export type SudokuWorkerRequest = {
	id: string;
} & (
	| {
			type: 'board';
			difficulty: Difficulty;
	  }
	| {
			type: 'hint';
	  }
);

export type SudokuWorkerResponse = {
	id: string;
} & (
	| {
			type: 'board';
			solution: Solution;
			puzzle: Solution;
	  }
	| {
			type: 'hint';
			row: SudokuPosition;
			col: SudokuPosition;
			val: SudokuValInput;
	  }
	| {
			type: 'error';
			message: string;
	  }
);

function postMessage(response: SudokuWorkerResponse) {
	self.postMessage(response);
}

self.addEventListener('message', (event: MessageEvent<SudokuWorkerRequest>) => {
	const { id, type } = event.data;

	switch (type) {
		case 'board': {
			const difficulties = {
				Easy: 20,
				Medium: 30,
				Hard: 50
			} as const;
			const problem = generatePuzzle(difficulties[event.data.difficulty]);
			if (!problem) {
				postMessage({ id, type: 'error', message: 'failed to find' });
				return;
			}
			const solution = decode(problem.solution);
			const puzzle = decode(problem.puzzle);

			postMessage({ id, type: 'board', puzzle, solution });
			return;
		}
		case 'hint': {
			postMessage({ id, type: 'error', message: 'not implemented' });
			return;
		}
	}
});

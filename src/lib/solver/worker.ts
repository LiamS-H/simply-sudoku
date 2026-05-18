/// <reference lib="webworker" />

import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
import type { Difficulty, Solution } from '$lib/game/board';
import { generatePuzzle } from './solver';
import { decode } from './transform';

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
			problem: Solution;
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
			const puzzle = generatePuzzle('Easy');
			if (!puzzle) {
				postMessage({ id, type: 'error', message: 'failed to find' });
				return;
			}
			const solution = decode(puzzle.solution);
			const problem = decode(puzzle.problem);
			problem[0][0] = 0;

			postMessage({ id, type: 'board', problem, solution });
			return;
		}
		case 'hint': {
			postMessage({ id, type: 'error', message: 'not implemented' });
			return;
		}
	}
});

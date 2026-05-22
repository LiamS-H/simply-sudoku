/// <reference lib="webworker" />

import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
import type { Difficulty, Solution } from '$lib/game/board';
import { BitBoard } from './bitboard';
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
			if (event.data.difficulty === 'Hard') {
				const s = BitBoard.random();
				const p = BitBoard.from(s);

				p.mutateDigDepthOne(500);
				const solution = decode(s.cells);
				const puzzle = decode(p.cells);

				postMessage({ id, type: 'board', puzzle, solution });
				return;
			}

			const difficulties = {
				Easy: [45, 50],
				Medium: [50, 55]
			} as const;
			// const problem = generatePuzzle(difficulties[event.data.difficulty]);
			// if (!problem) {
			// 	postMessage({ id, type: 'error', message: 'failed to find' });
			// 	return;
			// }

			const s = BitBoard.random();
			const p = BitBoard.from(s);
			const [low, high] = difficulties[event.data.difficulty];
			p.mutateGreedyDigWhileUnique(low, high);
			const solution = decode(s.cells);
			const puzzle = decode(p.cells);

			postMessage({ id, type: 'board', puzzle, solution });
			return;
		}
		case 'hint': {
			postMessage({ id, type: 'error', message: 'not implemented' });
			return;
		}
	}
});

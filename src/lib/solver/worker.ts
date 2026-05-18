/// <reference lib="webworker" />

import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
import type { Difficulty, Solution } from '$lib/game/board';
import { generate } from './solver';
import { decode, encode } from './transform';

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
			message: 'not implemented';
	  }
);

function postMessage(response: SudokuWorkerResponse) {
	self.postMessage(response);
}

self.addEventListener('message', (event: MessageEvent<SudokuWorkerRequest>) => {
	const { id, type } = event.data;

	switch (type) {
		case 'board': {
			const bin_board = generate();
			const solution = decode(bin_board);
			const problem = [...solution];
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

/// <reference lib="webworker" />

import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
import type { Difficulty, Solution } from '$lib/game/board';

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

	postMessage({ id, type: 'error', message: 'not implemented' });

	switch (type) {
		case 'board': {
			return;
		}
		case 'hint': {
			return;
		}
	}
});

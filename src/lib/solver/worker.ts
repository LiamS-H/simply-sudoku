/// <reference lib="webworker" />

import type { SudokuPosition, SudokuValInput } from '$lib/game/action';
import type { Difficulty, Solution } from '$lib/game/board';
import { BitBoard } from './bitboard';
import { EasyDifficulty, HardDifficulty, MediumDifficulty, PuzzleGenerator } from './generator';
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
				Easy: EasyDifficulty,
				Medium: MediumDifficulty,
				Hard: HardDifficulty
			};

			const solution = BitBoard.random();
			const generator = new PuzzleGenerator(solution);
			const puzzle = generator.generate(difficulties[event.data.difficulty]);

			postMessage({
				id,
				type: 'board',
				puzzle: decode(puzzle.cells),
				solution: decode(solution.cells)
			});
			return;
		}
		case 'hint': {
			postMessage({ id, type: 'error', message: 'not implemented' });
			return;
		}
	}
});

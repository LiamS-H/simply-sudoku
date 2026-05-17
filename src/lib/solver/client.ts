import { browser } from '$app/environment';
import type { Difficulty, Solution } from '$lib/game/board';
import type { SudokuWorkerResponse, SudokuWorkerRequest } from './worker';
import SudokuWorker from './worker?worker&inline';

class SudokuSolver {
	worker!: Worker;
	constructor() {
		if (browser) {
			this.worker = new SudokuWorker();
		}
	}

	public async generate_board(
		difficulty: Difficulty
	): Promise<{ problem: Solution; solution: Solution }> {
		const { promise, reject, resolve } = Promise.withResolvers<{
			problem: Solution;
			solution: Solution;
		}>();

		const id = crypto.randomUUID();

		this.worker.addEventListener('message', (event: MessageEvent<SudokuWorkerResponse>) => {
			if (event.data.id !== id) {
				return;
			}

			if (event.data.type !== 'board') {
				reject(
					event.data.type === 'error'
						? event.data.message
						: 'worker responded with wrong event type'
				);
				return;
			}

			const { problem, solution } = event.data;

			resolve({ problem, solution });
		});

		const message: SudokuWorkerRequest = {
			type: 'board',
			id,
			difficulty
		};
		this.worker.postMessage(message);

		return promise;
	}
}

export const sudoku_solver = new SudokuSolver();

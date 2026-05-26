import {
	type UserBoard,
	type UserWork,
	type Difficulty,
	type Solution,
	get_empty_work
} from './board';
import type { EditAction, SudokuPosition, SudokuValInput } from './action';
import { PEERS } from '../solver/utils';

export class SudokuPlayer {
	#board = $state<UserBoard>()!;

	constructor(board: UserBoard) {
		this.#board = board;
	}

	private applyInverse(action: EditAction) {
		const { type } = action;
		if (type === 'c') {
			this.#board.work = action.work;
			return;
		}

		if (type === 'r') {
			const { row, col, prev } = action;
			const cell = this.#board.work.rows[row][col];
			Object.assign(cell, prev);
			return;
		}

		if (type === 's') {
			const { row, col, prev } = action;
			const cell = this.#board.work.rows[row][col];
			cell.val = prev;
		}
		if (type === 'a') {
			const { row, col, val } = action;
			const cell = this.#board.work.rows[row][col];
			cell[val] = !cell[val];
		}
	}

	private clearPeers(val: number, row: number, col: number, batch: EditAction[]) {
		if (val === 0) return;
		const idx = row * 9 + col;
		const peers = PEERS[idx];
		for (const peerIdx of peers) {
			const r = (peerIdx / 9) | 0;
			const c = peerIdx % 9;
			const cell = this.#board.work.rows[r][c];
			if (cell[val as 1]) {
				cell[val as 1] = false;
				batch.push({
					type: 'a',
					row: r as SudokuPosition,
					col: c as SudokuPosition,
					val: val as Exclude<SudokuValInput, 0>
				});
			}
		}
	}

	get board(): UserBoard {
		return this.#board;
	}

	get difficulty(): Difficulty {
		return this.#board.difficulty;
	}

	get solution(): Solution {
		return this.#board.solution;
	}

	get problem(): Solution {
		return this.#board.problem;
	}

	get work(): UserWork {
		return this.#board.work;
	}

	get moves(): EditAction[] {
		return this.#board.moves.flat();
	}

	edit(val: SudokuValInput, row: SudokuPosition, col: SudokuPosition, annotate?: boolean) {
		if (val === 0 && annotate) {
			this.resetSquare(row, col);
			return;
		}

		const cell = this.#board.work.rows[row][col];
		const batch: EditAction[] = [];

		if (annotate) {
			if (val === 0) return;
			cell[val] = !cell[val];
			batch.push({ type: 'a', row, col, val });
		} else {
			if (cell.val === val) val = 0;
			const prev = cell.val;
			cell.val = val;
			batch.push({ type: 's', row, col, val, prev });

			if (val !== 0) {
				this.clearPeers(val, row, col, batch);
			}
		}

		this.#board.moves.push(batch);
	}

	resetSquare(row: SudokuPosition, col: SudokuPosition) {
		const cell = this.#board.work.rows[row][col];
		if (cell.val === 0 && ![1, 2, 3, 4, 5, 6, 7, 8, 9].some((n) => cell[n as 1])) {
			return;
		}

		const prev = { ...cell };

		cell.val = 0;
		for (let i = 1; i <= 9; i++) {
			cell[i as 1] = false;
		}

		this.#board.moves.push([{ type: 'r', row, col, prev }]);
	}

	undo() {
		const lastBatch = this.#board.moves.pop();
		if (!lastBatch) return;

		for (let i = lastBatch.length - 1; i >= 0; i--) {
			this.applyInverse(lastBatch[i]);
		}
	}

	clear() {
		const oldWork = this.#board.work;
		this.#board.work = get_empty_work();
		this.#board.moves.push([{ type: 'c', work: oldWork }]);
	}
}

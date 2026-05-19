import {
	type UserBoard,
	type UserWork,
	type Difficulty,
	type Solution,
	get_empty_work
} from './board';
import type { EditAction, SudokuPosition, SudokuValInput } from './action';

export class SudokuPlayer {
	#board = $state<UserBoard>()!;

	constructor(board: UserBoard) {
		this.#board = board;
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
		return this.#board.moves;
	}

	edit(val: SudokuValInput, row: SudokuPosition, col: SudokuPosition, annotate?: boolean) {
		if (val === 0 && annotate) {
			this.resetSquare(row, col);
			return;
		}

		const cell = this.#board.work.rows[row][col];

		if (annotate) {
			if (val === 0) {
				return;
			}
			cell[val] = !cell[val];
			this.#board.moves.push({ type: 'a', row, col, val });
		} else {
			if (cell.val === val) {
				val = 0;
			}
			const prev = cell.val;
			cell.val = val;
			this.#board.moves.push({ type: 's', row, col, val, prev });
		}
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

		this.#board.moves.push({ type: 'r', row, col, prev });
	}

	undo() {
		const lastMove = this.#board.moves.pop();
		if (!lastMove) return;

		const { type } = lastMove;
		if (type === 'c') {
			this.#board.work = lastMove.work;
			return;
		}

		if (type === 'r') {
			const { row, col, prev } = lastMove;
			const cell = this.#board.work.rows[row][col];
			Object.assign(cell, prev);
			return;
		}

		if (type === 's') {
			const { row, col } = lastMove;
			const cell = this.#board.work.rows[row][col];
			cell.val = lastMove.prev;
		}
		if (type === 'a') {
			const { row, col, val } = lastMove;
			const cell = this.#board.work.rows[row][col];
			cell[val] = !cell[val];
		}
	}

	clear() {
		const oldWork = this.#board.work;
		this.#board.work = get_empty_work();
		this.#board.moves.push({ type: 'c', work: oldWork });
	}
}

// generate.ts
import { Grid, solve } from './solver';
import { BIT_DIGIT, CELL_BOX, CELL_COL, CELL_ROW, popcount9 } from './utils';

/**
 * Generate a random solved Sudoku board.
 *
 * Optimizations:
 * - diagonal box seeding
 * - MRV heuristic
 * - row/col/box bitmasks
 * - allocation-free DFS
 * - shuffled candidate order
 */
export function generateFullSolution(): Uint8Array {
	// placed digits
	const cells = new Uint8Array(81);

	// used digit masks
	const rowM = new Uint16Array(9);
	const colM = new Uint16Array(9);
	const boxM = new Uint16Array(9);

	// reusable shuffle buffer
	const seedDigits = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);

	function mask(i: number): number {
		return ~(rowM[CELL_ROW[i]] | colM[CELL_COL[i]] | boxM[CELL_BOX[i]]) & 0x1ff;
	}

	function place(i: number, digit: number) {
		const bit = 1 << (digit - 1);

		cells[i] = digit;

		rowM[CELL_ROW[i]] |= bit;
		colM[CELL_COL[i]] |= bit;
		boxM[CELL_BOX[i]] |= bit;
	}

	function remove(i: number, digit: number) {
		const bit = ~(1 << (digit - 1));

		cells[i] = 0;

		rowM[CELL_ROW[i]] &= bit;
		colM[CELL_COL[i]] &= bit;
		boxM[CELL_BOX[i]] &= bit;
	}

	/**
	 * Minimum Remaining Values heuristic.
	 */
	function nextCell(): number {
		let best = -1;
		let bestCount = 10;

		for (let i = 0; i < 81; i++) {
			if (cells[i] !== 0) continue;

			const count = popcount9(mask(i));

			if (count < bestCount) {
				best = i;
				bestCount = count;

				if (count === 1) break;
			}
		}

		return best;
	}

	function shuffle9(buf: Uint8Array) {
		for (let i = 8; i > 0; i--) {
			const j = (Math.random() * (i + 1)) | 0;

			const t = buf[i];
			buf[i] = buf[j];
			buf[j] = t;
		}
	}

	function seedBox(box: number) {
		shuffle9(seedDigits);

		const br = ((box / 3) | 0) * 3;
		const bc = (box % 3) * 3;

		let k = 0;

		for (let r = 0; r < 3; r++) {
			for (let c = 0; c < 3; c++) {
				const i = (br + r) * 9 + (bc + c);

				place(i, seedDigits[k++]);
			}
		}
	}

	/**
	 * Seed the 3 independent diagonal boxes.
	 */
	function seedDiagonal() {
		seedBox(0);
		seedBox(4);
		seedBox(8);
	}

	function solve(): boolean {
		const i = nextCell();

		if (i === -1) return true;

		const m = mask(i);

		if (m === 0) return false;

		// MUST be local per recursion frame
		const digits = new Uint8Array(9);

		let n = 0;

		for (let bits = m; bits; bits &= bits - 1) {
			digits[n++] = BIT_DIGIT[bits & -bits];
		}

		// Fisher-Yates shuffle
		for (let k = n - 1; k > 0; k--) {
			const r = (Math.random() * (k + 1)) | 0;

			const t = digits[k];
			digits[k] = digits[r];
			digits[r] = t;
		}

		for (let k = 0; k < n; k++) {
			const digit = digits[k];

			place(i, digit);

			if (solve()) return true;

			remove(i, digit);
		}

		return false;
	}

	seedDiagonal();

	if (!solve()) {
		throw new Error('failed to generate sudoku');
	}
	return cells;
}

export function generatePuzzle(targetDifficulty = 100, maxBacktracks = 200) {
	const solution = generateFullSolution();

	// working puzzle
	const puzzle = solution.slice();

	// randomized dig order
	const order = Uint8Array.from({ length: 81 }, (_, i) => i);

	for (let i = 80; i > 0; i--) {
		const j = (Math.random() * (i + 1)) | 0;

		const t = order[i];
		order[i] = order[j];
		order[j] = t;
	}

	let bestDifficulty = 0;
	let bestBacktracks = 0;

	/**
	 * Digging loop.
	 *
	 * Remove one clue at a time and validate
	 * using heuristic solver.
	 */
	for (let k = 0; k < 81; k++) {
		const i = order[k];

		const backup = puzzle[i];

		// already empty
		if (backup === 0) continue;

		puzzle[i] = 0;

		// rebuild solver grid
		const test = new Grid(puzzle);

		const result = solve(test, maxBacktracks);

		// unsolved -> revert
		if (!result.solved) {
			puzzle[i] = backup;
			continue;
		}

		/**
		 * Difficulty steering:
		 *
		 * if puzzle becomes too easy,
		 * revert the dig.
		 */
		if (result.difficulty < bestDifficulty) {
			puzzle[i] = backup;
			continue;
		}

		bestDifficulty = result.difficulty;
		bestBacktracks = result.backtracks;

		/**
		 * Optional stopping condition:
		 * stop once target reached.
		 */
		if (bestDifficulty >= targetDifficulty) {
			break;
		}
	}

	return {
		puzzle,
		solution,
		difficulty: bestDifficulty,
		backtracks: bestBacktracks
	};
}

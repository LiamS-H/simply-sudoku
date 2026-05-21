/** maps a grid index to its given row */
const CELL_ROW = Uint8Array.from({ length: 81 }, (_, i) => (i / 9) | 0);
/** maps a grid index to its given col */
const CELL_COL = Uint8Array.from({ length: 81 }, (_, i) => i % 9);
/** maps a grid index to its given cell box */
const CELL_BOX = Uint8Array.from({ length: 81 }, (_, i) => (((i / 27) | 0) * 3 + (i % 9) / 3) | 0);

/** maps a  */
export const BIT_DIGIT = new Uint8Array(512);
for (let d = 1; d <= 9; d++) BIT_DIGIT[1 << (d - 1)] = d;

/** maps a [r][c] to a grid index */
export const ROWS = Array.from({ length: 9 }, (_, r) =>
	Uint8Array.from({ length: 9 }, (_, c) => r * 9 + c)
);

/** maps a [c][r] to a grid index */
export const COLS = Array.from({ length: 9 }, (_, c) =>
	Uint8Array.from({ length: 9 }, (_, r) => r * 9 + c)
);

/** maps a [box index][within box index] to a grid index */
export const BOXES = Array.from({ length: 9 }, (_, b) => {
	const br = ((b / 3) | 0) * 3;
	const bc = (b % 3) * 3;

	return Uint8Array.from({ length: 9 }, (_, k) => (br + ((k / 3) | 0)) * 9 + bc + (k % 3));
});

/** maps a grid index to a list of grid indexes which interact with it */
export const PEERS: Uint8Array[] = Array.from({ length: 81 }, (_, i) => {
	const set = new Set<number>();

	for (let j = 0; j < 9; j++) {
		set.add(ROWS[CELL_ROW[i]][j]);
		set.add(COLS[CELL_COL[i]][j]);
		set.add(BOXES[CELL_BOX[i]][j]);
	}

	set.delete(i);

	return Uint8Array.from([...set]);
});

/** hamming weight of a 9 bit sudoku mask */
export function popcount9(n: number): number {
	n -= (n >> 1) & 0x55;
	n = (n & 0x33) + ((n >> 2) & 0x33);
	return (n + (n >> 4)) & 0x0f;
}
/** shuffle an array in place */
function shuffle(buf: Uint8Array, len: number = buf.length) {
	for (let i = len - 1; i > 0; i--) {
		const j = (Math.random() * (i + 1)) | 0;

		const t = buf[i];
		buf[i] = buf[j];
		buf[j] = t;
	}
}

export class BitBoard {
	cells = new Uint8Array(81);

	// views for currently placed digits
	protected rowV = new Uint16Array(9);
	protected colV = new Uint16Array(9);
	protected boxV = new Uint16Array(9);

	private seedDigits = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);

	static from(old: BitBoard) {
		const board = new BitBoard();
		board.cells = new Uint8Array(old.cells);
		board.rowV = new Uint16Array(old.rowV);
		board.colV = new Uint16Array(old.colV);
		board.boxV = new Uint16Array(old.boxV);
		return board;
	}

	static random(): BitBoard {
		const board = new BitBoard();

		function seedBox(box_index: number) {
			shuffle(board.seedDigits);
			const box = BOXES[box_index];
			for (let i = 0; i < 9; i++) {
				board.place(box[i], board.seedDigits[i]);
			}
		}

		seedBox(0);
		seedBox(4);
		seedBox(8);

		board.mutateSolveDFS();
		return board;
	}
	/** Solves a board using brute force, return True when Solved False when failed */
	protected mutateSolveDFS(): boolean {
		const cell_index = this.most_constrained_empty_cell();

		if (cell_index === null) return true;

		if (cell_index === -1) return false;

		const m = this.available(cell_index);

		if (m === 0) return false;

		const digits = new Uint8Array(9);

		let n = 0;
		for (let bits = m; bits; bits &= bits - 1) {
			digits[n++] = BIT_DIGIT[bits & -bits];
		}

		shuffle(digits, n);

		for (let i = 0; i < n; i++) {
			this.place(cell_index, digits[i]);

			if (this.mutateSolveDFS()) return true;

			this.remove(cell_index, digits[i]);
		}
		return false;
	}
	/** Solves a board using brute force, returns the number of solutions found
	 * @param {number} exit_solutions - Number of solutions to exit when found
	 * @param {number} count - Number reference to keep track of the solutions found
	 */
	protected solveDFS(exit_solutions: number, count: number = 0): number {
		const cell_index = this.most_constrained_empty_cell();

		if (cell_index === null) {
			return 1;
		}

		if (cell_index === -1) {
			return 0;
		}

		const m = this.available(cell_index);

		const digits = new Uint8Array(9);

		let n = 0;
		for (let bits = m; bits; bits &= bits - 1) {
			digits[n++] = BIT_DIGIT[bits & -bits];
		}

		shuffle(digits, n);

		let solutions = 0;

		for (let i = 0; i < n; i++) {
			this.place(cell_index, digits[i]);

			solutions += this.solveDFS(exit_solutions);

			this.remove(cell_index, digits[i]);

			if (solutions >= exit_solutions) return count;
		}
		return solutions;
	}

	mutateDigRandom(amount: number) {
		const indexes: Uint8Array = Uint8Array.from({ length: 81 }, (_, i) => i);

		shuffle(indexes);

		for (let i = 0; i < amount; i++) {
			this.remove(indexes[i], this.cells[indexes[i]]);
		}
	}

	mutateGreedyDigWhileUnique(min: number, max: number, count = 0): boolean {
		if (count >= max) return true;

		const constraint_counts = this.all_basic_constraints();
		const indices = Uint8Array.from({ length: 81 }, (_, i) => i);
		shuffle(indices);
		indices.sort((a, b) => constraint_counts[a] - constraint_counts[b]);

		for (const index of indices) {
			// Fix: Check the actual sorted index, not the loop counter
			if (constraint_counts[index] === -1) continue;

			const val = this.cells[index];
			this.remove(index, val);

			// Scenario A: Digging this cell broke uniqueness
			if (!this.isUnique()) {
				this.place(index, val); // Fix: Always restore the cell on failure

				// If we've already hit our minimum target, we can stop digging entirely
				if (count >= min) return true;
				continue; // Otherwise, try a different cell at this depth
			}

			// Scenario B: Uniqueness preserved, dive deeper
			if (this.mutateGreedyDigWhileUnique(min, max, count + 1)) {
				return true;
			}

			// Scenario C: The deeper path failed, backtrack and try next index
			this.place(index, val);
		}

		return false;
	}

	/**  verify uniqueness */
	isUnique(): boolean {
		const solutions = this.solveDFS(2);
		return solutions === 1;
	}

	/** returns a mask of square availability */
	protected available(i: number): number {
		return ~(this.rowV[CELL_ROW[i]] | this.colV[CELL_COL[i]] | this.boxV[CELL_BOX[i]]) & 0x1ff;
	}

	protected place(i: number, digit: number) {
		const bit = 1 << (digit - 1);

		this.cells[i] = digit;

		this.rowV[CELL_ROW[i]] |= bit;
		this.colV[CELL_COL[i]] |= bit;
		this.boxV[CELL_BOX[i]] |= bit;
	}

	protected remove(i: number, digit: number) {
		const bit = ~(1 << (digit - 1));

		this.cells[i] = 0;

		this.rowV[CELL_ROW[i]] &= bit;
		this.colV[CELL_COL[i]] &= bit;
		this.boxV[CELL_BOX[i]] &= bit;
	}

	/** Returns cell with minimum available values,
	 *  returns -1 when fully constrained and null when complete */
	protected most_constrained_empty_cell(): number | null {
		let best = -1;
		let bestCount = 10;
		let empty = true;

		for (let i = 0; i < 81; i++) {
			if (this.cells[i] !== 0) continue;
			empty = false;

			const count = popcount9(this.available(i));

			if (count < bestCount) {
				best = i;
				bestCount = count;

				if (count === 1) break;
			}
		}

		return empty ? null : best;
	}

	protected all_basic_constraints(): Uint8Array {
		return Uint8Array.from({ length: 81 }, (_, i) => {
			if (this.cells[i] === 0) return -1;
			return popcount9(this.available(i));
		});
	}

	/** Returns cell with minimum available values,
	 *  returns -1 when fully constrained and null when complete */
	protected most_constrained_full_cell(): number {
		let best = -1;
		let bestCount = 10;

		for (let i = 0; i < 81; i++) {
			if (this.cells[i] === 0) continue;

			const count = popcount9(this.available(i));

			if (count < bestCount) {
				best = i;
				bestCount = count;

				if (count === 1) break;
			}
		}

		return best;
	}
}

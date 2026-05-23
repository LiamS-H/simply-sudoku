import { BIT_DIGIT, BOXES, CELL_BOX, CELL_COL, CELL_ROW, popcount9, shuffle } from './utils';
export class BitBoard {
	public cells = new Uint8Array(81);

	// Views exposed to allow deep copying and state evaluations
	public rowV = new Uint16Array(9);
	public colV = new Uint16Array(9);
	public boxV = new Uint16Array(9);

	private seedDigits = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);

	static from(old: BitBoard) {
		const board = new BitBoard();
		board.cells.set(old.cells);
		board.rowV.set(old.rowV);
		board.colV.set(old.colV);
		board.boxV.set(old.boxV);
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

	solveDFS(exit_solutions: number): number {
		const cell_index = this.most_constrained_empty_cell();
		if (cell_index === null) return 1;
		if (cell_index === -1) return 0;

		const m = this.available(cell_index);
		let solutions = 0;

		for (let bits = m; bits; bits &= bits - 1) {
			const bit = bits & -bits;
			const digit = BIT_DIGIT[bit];
			this.place(cell_index, digit);
			solutions += this.solveDFS(exit_solutions);
			this.remove(cell_index, digit);

			if (solutions >= exit_solutions) return solutions;
		}
		return solutions;
	}

	/**
	 * Verifies if the board remains unique after removing a known digit.
	 * Assumes the digit has ALREADY been removed from the cell at `idx`.
	 */
	public isUniqueAfterRemoval(idx: number, originalVal: number): boolean {
		const m = this.available(idx);

		for (let bits = m; bits; bits &= bits - 1) {
			const bit = bits & -bits;
			const digit = BIT_DIGIT[bit];

			if (digit === originalVal) continue;

			this.place(idx, digit);

			const hasAlternativeSolution = this.solveDFS(1) > 0;

			this.remove(idx, digit);

			if (hasAlternativeSolution) {
				return false;
			}
		}

		// No alternative choices could solve the board; uniqueness is guaranteed!
		return true;
	}

	public mutateDigRandom(amount: number) {
		const indexes: Uint8Array = Uint8Array.from({ length: 81 }, (_, i) => i);
		shuffle(indexes);

		for (let i = 0; i < amount; i++) {
			this.remove(indexes[i], this.cells[indexes[i]]);
		}
	}

	public mutateGreedyDigWhileUnique(min: number, max: number, count = 0): boolean {
		if (count >= max) return true;

		const constraint_counts = this.all_basic_constraints();
		const indices = Uint8Array.from({ length: 81 }, (_, i) => i);
		shuffle(indices);
		indices.sort((a, b) => constraint_counts[a] - constraint_counts[b]);

		for (const index of indices) {
			if (constraint_counts[index] === -1) continue;

			const val = this.cells[index];
			this.remove(index, val);

			if (!this.isUnique()) {
				this.place(index, val);
				if (count >= min) return true;
				continue;
			}

			if (this.mutateGreedyDigWhileUnique(min, max, count + 1)) {
				return true;
			}

			this.place(index, val);
		}
		return false;
	}

	public isUnique(): boolean {
		const solutions = this.solveDFS(2);
		return solutions === 1;
	}

	public available(i: number): number {
		return ~(this.rowV[CELL_ROW[i]] | this.colV[CELL_COL[i]] | this.boxV[CELL_BOX[i]]) & 0x1ff;
	}

	public place(i: number, digit: number) {
		const bit = 1 << (digit - 1);
		this.cells[i] = digit;
		this.rowV[CELL_ROW[i]] |= bit;
		this.colV[CELL_COL[i]] |= bit;
		this.boxV[CELL_BOX[i]] |= bit;
	}

	public remove(i: number, digit: number) {
		const bit = ~(1 << (digit - 1));
		this.cells[i] = 0;
		this.rowV[CELL_ROW[i]] &= bit;
		this.colV[CELL_COL[i]] &= bit;
		this.boxV[CELL_BOX[i]] &= bit;
	}

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

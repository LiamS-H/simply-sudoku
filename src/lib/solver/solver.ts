import { ALL, BIT_DIGIT, CELL_BOX, CELL_COL, CELL_ROW, DIGIT_BIT, PEERS, popcount9 } from './utils';

export enum Technique {
	NAKED_SINGLE = 1,
	HIDDEN_SINGLE = 2,
	BACKTRACK = 50
}

export type SolveResult = {
	solved: boolean;
	difficulty: number;
	backtracks: number;
};

export class Grid {
	cells = new Uint8Array(81);

	cand = new Uint16Array(81);

	rowM = new Uint16Array(9);
	colM = new Uint16Array(9);
	boxM = new Uint16Array(9);

	constructor(initial?: Uint8Array) {
		this.cand.fill(ALL);

		if (initial) {
			for (let i = 0; i < 81; i++) {
				const d = initial[i];

				if (d) this.assign(i, d);
			}
		}
	}

	mask(i: number): number {
		return ~(this.rowM[CELL_ROW[i]] | this.colM[CELL_COL[i]] | this.boxM[CELL_BOX[i]]) & ALL;
	}

	assign(i: number, digit: number) {
		const bit = DIGIT_BIT[digit];

		this.cells[i] = digit;

		this.rowM[CELL_ROW[i]] |= bit;
		this.colM[CELL_COL[i]] |= bit;
		this.boxM[CELL_BOX[i]] |= bit;

		this.cand[i] = bit;

		const peers = PEERS[i];

		for (let k = 0; k < peers.length; k++) {
			const p = peers[k];

			if (this.cells[p]) continue;

			this.cand[p] &= ~bit;
		}
	}

	unassign(i: number, digit: number) {
		const bit = ~DIGIT_BIT[digit];

		this.cells[i] = 0;

		this.rowM[CELL_ROW[i]] &= bit;
		this.colM[CELL_COL[i]] &= bit;
		this.boxM[CELL_BOX[i]] &= bit;

		// recompute affected peers
		const peers = PEERS[i];

		for (let k = 0; k < peers.length; k++) {
			const p = peers[k];

			if (this.cells[p]) continue;

			this.cand[p] = this.mask(p);
		}

		this.cand[i] = this.mask(i);
	}
}

function applyNakedSingles(grid: Grid): boolean {
	let changed = false;

	for (let i = 0; i < 81; i++) {
		if (grid.cells[i]) continue;

		const m = grid.cand[i];

		if (m && (m & (m - 1)) === 0) {
			grid.assign(i, BIT_DIGIT[m]);
			changed = true;
		}
	}

	return changed;
}

function applyHiddenSingles(grid: Grid): boolean {
	let changed = false;

	for (let unit = 0; unit < 27; unit++) {
		const base = unit < 9 ? unit * 9 : unit < 18 ? unit - 9 : unit - 18;

		for (let d = 1; d <= 9; d++) {
			const bit = DIGIT_BIT[d];

			let count = 0;
			let last = -1;

			for (let j = 0; j < 9; j++) {
				let i: number;

				if (unit < 9) {
					i = base + j;
				} else if (unit < 18) {
					i = j * 9 + base;
				} else {
					const br = ((base / 3) | 0) * 3;
					const bc = (base % 3) * 3;

					i = (br + ((j / 3) | 0)) * 9 + bc + (j % 3);
				}

				if (grid.cells[i]) continue;

				if (grid.cand[i] & bit) {
					count++;
					last = i;

					if (count > 1) break;
				}
			}

			if (count === 1) {
				grid.assign(last, d);
				changed = true;
			}
		}
	}

	return changed;
}

function nextCell(grid: Grid): number {
	let best = -1;
	let bestCount = 10;

	for (let i = 0; i < 81; i++) {
		if (grid.cells[i]) continue;

		const count = popcount9(grid.cand[i]);

		if (count < bestCount) {
			best = i;
			bestCount = count;

			if (count === 2) break;
		}
	}

	return best;
}

export function solve(grid: Grid, maxBacktracks = Infinity): SolveResult {
	let difficulty = 0;
	let backtracks = 0;

	function dfs(): boolean {
		while (true) {
			let progress = false;

			if (applyNakedSingles(grid)) {
				difficulty += Technique.NAKED_SINGLE;
				progress = true;
			}

			if (applyHiddenSingles(grid)) {
				difficulty += Technique.HIDDEN_SINGLE;
				progress = true;
			}

			if (!progress) break;
		}

		const i = nextCell(grid);

		if (i === -1) return true;

		const mask = grid.cand[i];

		if (mask === 0) return false;

		const digits = new Uint8Array(9);

		let n = 0;

		for (let bits = mask; bits; bits &= bits - 1) {
			digits[n++] = BIT_DIGIT[bits & -bits];
		}

		for (let k = 0; k < n; k++) {
			const d = digits[k];

			grid.assign(i, d);

			if (dfs()) return true;

			grid.unassign(i, d);

			backtracks++;

			if (backtracks > maxBacktracks) {
				return false;
			}
		}

		return false;
	}

	const solved = dfs();

	return {
		solved,
		difficulty,
		backtracks
	};
}

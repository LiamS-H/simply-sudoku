// utils.ts

import type { SudokuValInput } from '$lib/game/action';

export const ALL = 0x1ff; // digits 1–9 in 9-bit mask

export const BIT_DIGIT = new Uint8Array(512);
for (let d = 1; d <= 9; d++) BIT_DIGIT[1 << (d - 1)] = d;

export const DIGIT_BIT = new Uint16Array(10);
for (let d = 1; d <= 9; d++) DIGIT_BIT[d] = 1 << (d - 1);

export const CELL_ROW = Uint8Array.from({ length: 81 }, (_, i) => (i / 9) | 0);
export const CELL_COL = Uint8Array.from({ length: 81 }, (_, i) => i % 9);
export const CELL_BOX = Uint8Array.from(
	{ length: 81 },
	(_, i) => (((i / 27) | 0) * 3 + (i % 9) / 3) | 0
);

export const ROWS = Array.from({ length: 9 }, (_, r) =>
	Uint8Array.from({ length: 9 }, (_, c) => r * 9 + c)
);

export const COLS = Array.from({ length: 9 }, (_, c) =>
	Uint8Array.from({ length: 9 }, (_, r) => r * 9 + c)
);

export const BOXES = Array.from({ length: 9 }, (_, b) => {
	const br = ((b / 3) | 0) * 3;
	const bc = (b % 3) * 3;

	return Uint8Array.from({ length: 9 }, (_, k) => (br + ((k / 3) | 0)) * 9 + bc + (k % 3));
});

export const UNITS: Uint8Array[] = [...ROWS, ...COLS, ...BOXES];

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

export function popcount9(n: number): number {
	n -= (n >> 1) & 0x55;
	n = (n & 0x33) + ((n >> 2) & 0x33);
	return (n + (n >> 4)) & 0x0f;
}

// /** Confirm every row, column, and box contains exactly the digits 1–9. */
export function isValid(bin: Uint8Array): boolean {
	const FULL = 0x1ff;
	const get = (i: number) => bin[i];
	for (let y = 0; y < 9; y++) {
		let rowB = 0,
			colB = 0,
			boxB = 0;
		for (let x = 0; x < 9; x++) {
			colB |= 1 << (get(x * 9 + y) - 1);
			rowB |= 1 << (get(y * 9 + x) - 1);
			const br = Math.floor(y / 3) * 3 + Math.floor(x / 3);
			const bc = (y % 3) * 3 + (x % 3);
			boxB |= 1 << (get(br * 9 + bc) - 1);
		}
		if (rowB !== FULL || colB !== FULL || boxB !== FULL) return false;
	}
	return true;
}

export function encode(grid: number[][]): Uint8Array {
	const out = new Uint8Array(81);
	for (let r = 0; r < 9; r++) {
		for (let c = 0; c < 9; c++) {
			const i = r * 9 + c;
			out[i] = grid[r][c];
		}
	}
	return out;
}

export function decode(bin: Uint8Array): SudokuValInput[][] {
	const grid: SudokuValInput[][] = Array.from({ length: 9 }, () => new Array<SudokuValInput>(9));
	for (let i = 0; i < 81; i++) {
		grid[(i / 9) | 0][i % 9] = bin[i] as SudokuValInput;
	}
	return grid;
}

export function printPuzzle(bin: Uint8Array): Uint8Array {
	let str = '';
	for (let r = 0; r < 9; r++) {
		const row = Array.from(bin.subarray(r * 9, (r + 1) * 9))
			.map((v) => (v ? v.toString() : ' '))
			.join(' ');
		str += row + '\n';
	}

	console.log(str);
	return new TextEncoder().encode(str);
}

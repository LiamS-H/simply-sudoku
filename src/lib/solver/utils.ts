import type { SudokuValInput } from '$lib/game/action';

/** maps a grid index to its given row */
export const CELL_ROW = Uint8Array.from({ length: 81 }, (_, i) => (i / 9) | 0);

/** maps a grid index to its given col */
export const CELL_COL = Uint8Array.from({ length: 81 }, (_, i) => i % 9);

/** maps a grid index to its given cell box */
export const CELL_BOX = Uint8Array.from(
	{ length: 81 },
	(_, i) => (((i / 27) | 0) * 3 + (i % 9) / 3) | 0
);

/** maps a bitmask back to its concrete digit value */
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
export function shuffle(buf: Uint8Array, len: number = buf.length) {
	for (let i = len - 1; i > 0; i--) {
		const j = (Math.random() * (i + 1)) | 0;
		const t = buf[i];
		buf[i] = buf[j];
		buf[j] = t;
	}
}

/** Confirm every row, column, and box contains exactly the digits 1–9. */
export function isValid(bin: Uint8Array): boolean {
	const FULL = 0x1ff;
	for (let y = 0; y < 9; y++) {
		let rowV = 0,
			colV = 0,
			boxV = 0;
		for (let x = 0; x < 9; x++) {
			colV |= 1 << (bin[x * 9 + y] - 1);
			rowV |= 1 << (bin[y * 9 + x] - 1);
			boxV |= 1 << (bin[BOXES[y][x]] - 1);
		}
		if (rowV !== FULL || colV !== FULL || boxV !== FULL) return false;
	}
	return true;
}

/** Get the completed rows, columns, boxes, counts, done */
export function findCompleted(
	bin: Uint8Array
): [Uint8Array, Uint8Array, Uint8Array, Uint8Array, boolean] {
	const rows = new Uint8Array(9);
	const cols = new Uint8Array(9);
	const boxes = new Uint8Array(9);
	const counts = new Uint8Array(9);
	const FULL = 0x1ff;

	for (let i = 0; i < 9; i++) {
		let rV = 0,
			cV = 0,
			bV = 0;
		for (let j = 0; j < 9; j++) {
			const val = bin[i * 9 + j];
			rV |= 1 << (val - 1);
			cV |= 1 << (bin[j * 9 + i] - 1);
			bV |= 1 << (bin[BOXES[i][j]] - 1);
			counts[val - 1]++;
		}
		if (rV === FULL) rows[i] = 1;
		if (cV === FULL) cols[i] = 1;
		if (bV === FULL) boxes[i] = 1;
	}
	let complete = true;
	for (let i = 0; i < 9; i++) {
		if (!rows[i] || !cols[i] || !boxes[i]) {
			complete = false;
			break;
		}
	}

	return [rows, cols, boxes, counts, complete];
}

/** Return invalid positions as a "r-c" string */
export function findErrors(bin: Uint8Array, fixed: Uint8Array): string[] {
	const out = [];
	function get(i: number): number {
		if (bin[i] === 0) return 0;
		return 1 << (bin[i] - 1);
	}
	for (let y = 0; y < 9; y++) {
		let rowV = 0,
			colV = 0,
			boxV = 0;
		for (let x = 0; x < 9; x++) {
			colV |= 1 << (fixed[x * 9 + y] - 1);
			rowV |= 1 << (fixed[y * 9 + x] - 1);
			boxV |= 1 << (fixed[BOXES[y][x]] - 1);
		}
		for (let x = 0; x < 9; x++) {
			const colI = get(x * 9 + y);
			if (colV & colI) {
				out.push(`${x}${y}`);
			} else {
				colV |= colI;
			}
			const rowI = get(y * 9 + x);
			if (rowV & rowI) {
				out.push(`${y}${x}`);
			} else {
				rowV |= rowI;
			}
			const br = Math.floor(y / 3) * 3 + Math.floor(x / 3);
			const bc = (y % 3) * 3 + (x % 3);
			const boxI = get(br * 9 + bc);
			if (boxV & boxI) {
				out.push(`${br}${bc}`);
			} else {
				boxV |= boxI;
			}
		}
	}
	return Array.from(new Set(out));
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

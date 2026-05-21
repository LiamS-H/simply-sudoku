import type { SudokuValInput } from '$lib/game/action';

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

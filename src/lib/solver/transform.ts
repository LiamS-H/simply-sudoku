/**
 * Encode a 9×9 grid (digits 1–9) into a 41-byte nibble-packed Uint8Array.
 *
 * @param grid  Row-major 2-D array, grid[row][col] ∈ 1..9
 * @returns     41-byte binary representation
 */
export function encode(grid: number[][]): Uint8Array {
	const out = new Uint8Array(41);
	for (let r = 0; r < 9; r++) {
		for (let c = 0; c < 9; c++) {
			const i = r * 9 + c;
			const v = grid[r][c]; // 1–9 fits in 4 bits
			if (i & 1)
				out[i >> 1] |= v; // low nibble
			else out[i >> 1] = v << 4; // high nibble
		}
	}
	return out;
}

/**
 * Decode a 41-byte nibble-packed buffer back into a 9×9 grid.
 *
 * @param bin  Buffer produced by encode() or generate()
 * @returns    Row-major 2-D array, grid[row][col] ∈ 1..9
 */
export function decode(bin: Uint8Array): number[][] {
	const grid: number[][] = Array.from({ length: 9 }, () => new Array<number>(9));
	for (let i = 0; i < 81; i++) {
		grid[(i / 9) | 0][i % 9] =
			i & 1
				? bin[i >> 1] & 0x0f // low nibble
				: (bin[i >> 1] >> 4) & 0x0f; // high nibble
	}
	return grid;
}

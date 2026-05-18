/**
 * puzzle.ts — Difficulty-rated Sudoku puzzle generator
 * ──────────────────────────────────────────────────────
 * PUBLIC API
 *   generatePuzzle(profile)  → number[][] | null
 *   Difficulty.Easy / Medium / Hard / Expert / Extreme  — presets
 *   Technique, DifficultyProfile, TechniqueConstraint   — build custom profiles
 */

// ─── Precomputed tables ───────────────────────────────────────────────────────

const ROWS = Array.from({ length: 9 }, (_, r) =>
	Uint8Array.from({ length: 9 }, (_, c) => r * 9 + c)
);
const COLS = Array.from({ length: 9 }, (_, c) =>
	Uint8Array.from({ length: 9 }, (_, r) => r * 9 + c)
);
const BOXES = Array.from({ length: 9 }, (_, b) => {
	const br = Math.floor(b / 3) * 3,
		bc = (b % 3) * 3;
	return Uint8Array.from({ length: 9 }, (_, k) => (br + Math.floor(k / 3)) * 9 + bc + (k % 3));
});
const ALL_UNITS = [...ROWS, ...COLS, ...BOXES]; // 27 units

const CELL_ROW = Uint8Array.from({ length: 81 }, (_, i) => (i / 9) | 0);
const CELL_COL = Uint8Array.from({ length: 81 }, (_, i) => i % 9);
const CELL_BOX = Uint8Array.from(
	{ length: 81 },
	(_, i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3)
);

const PEERS: Uint8Array[] = Array.from({ length: 81 }, (_, i) => {
	const set = new Set<number>();
	const r = CELL_ROW[i],
		c = CELL_COL[i],
		b = CELL_BOX[i];
	for (let j = 0; j < 9; j++) {
		set.add(r * 9 + j);
		set.add(j * 9 + c);
		const br = Math.floor(b / 3) * 3,
			bc = (b % 3) * 3;
		set.add((br + Math.floor(j / 3)) * 9 + bc + (j % 3));
	}
	set.delete(i);
	return new Uint8Array([...set].sort((a, b) => a - b));
});

/** Isolated-bit → digit 1–9. */
const BIT_DIGIT = new Uint8Array(512);
for (let d = 1; d <= 9; d++) BIT_DIGIT[1 << (d - 1)] = d;

function popcount9(n: number): number {
	n -= (n >> 1) & 0x55;
	n = (n & 0x33) + ((n >> 2) & 0x33);
	return (n + (n >> 4)) & 0x0f;
}

/** True iff cells a and b share a row, column, or box (and are distinct). */
function arePeers(a: number, b: number): boolean {
	return (
		a !== b &&
		(CELL_ROW[a] === CELL_ROW[b] || CELL_COL[a] === CELL_COL[b] || CELL_BOX[a] === CELL_BOX[b])
	);
}

// ─── Technique hierarchy ──────────────────────────────────────────────────────

/**
 * Ordered from easiest (0) to hardest (9).
 * The numeric order is meaningful: profiles use maxTechnique to cap the solver.
 */
export enum Technique {
	NakedSingle = 0, // One candidate left in a cell
	HiddenSingle = 1, // Digit has only one possible cell in a unit
	NakedPair = 2, // Two cells in a unit share the same two candidates
	NakedTriple = 3, // Three cells in a unit cover only three candidates
	PointingPairs = 4, // Box candidates for a digit confined to one line → eliminate from rest of line
	BoxLineReduction = 5, // Line candidates for a digit confined to one box → eliminate from rest of box
	XWing = 6, // 2×2 rectangle of a digit eliminates from lines
	XYWing = 7, // Three-cell bi-value chain eliminates a candidate
	Swordfish = 8, // 3×3 rectangle of a digit eliminates from lines
	Bifurcation = 9 // Trial-and-error: assume a candidate, detect contradictions
}

// ─── Difficulty profile ───────────────────────────────────────────────────────

export interface TechniqueConstraint {
	/**
	 * This technique must appear at least this many times in the full solve path.
	 * Ensures the technique is genuinely required, not just theoretically usable.
	 */
	minTotal?: number;

	/**
	 * Of all occurrences of this technique, at least this fraction must fall
	 * after the 40th cell is placed (the "back half" of the solve).
	 * Prevents puzzles that are hard only at the start then trivially collapse.
	 * Range: 0–1.
	 */
	minBackHalfFraction?: number;
}

export interface DifficultyProfile {
	/** Human-readable label. */
	name: string;

	/**
	 * The solver may only use techniques ≤ this level.
	 * Puzzles that require a higher technique are rejected.
	 */
	maxTechnique: Technique;

	/**
	 * Per-technique requirements for acceptance.
	 * Any technique not listed has no explicit requirement.
	 */
	requirements: Partial<Record<Technique, TechniqueConstraint>>;

	/**
	 * Acceptable [min, max] given-clue count.
	 * Digging respects maxTechnique; this is a final sanity filter.
	 */
	clueRange: [number, number];

	/**
	 * At most this fraction of all solve steps may be NakedSingle.
	 * 1.0 = no restriction. Lower values force the solver to use harder techniques
	 * more often, preventing "mostly trivial with one hard step" puzzles.
	 */
	maxNakedSingleFraction: number;

	/**
	 * Max generation attempts before giving up and returning null.
	 * Harder profiles need more attempts to satisfy strict requirements.
	 */
	maxAttempts: number;
}

// ─── Preset profiles ──────────────────────────────────────────────────────────

/**
 * Built-in difficulty presets. Import and pass directly to generatePuzzle(),
 * or spread-override individual fields to tune:
 *
 *   generatePuzzle({ ...Difficulty.Hard, maxAttempts: 500 })
 */
const Difficulty = {
	Easy: {
		name: 'Easy',
		maxTechnique: Technique.HiddenSingle,
		requirements: {},
		clueRange: [36, 50] as [number, number],
		maxNakedSingleFraction: 1.0, // no restriction
		maxAttempts: 50
	},

	Medium: {
		name: 'Medium',
		maxTechnique: Technique.PointingPairs,
		requirements: {
			[Technique.NakedPair]: { minTotal: 1 }
		},
		clueRange: [27, 35] as [number, number],
		maxNakedSingleFraction: 0.8,
		maxAttempts: 150
	},

	Hard: {
		name: 'Hard',
		maxTechnique: Technique.XWing,
		requirements: {
			[Technique.PointingPairs]: { minTotal: 2 },
			[Technique.XWing]: { minTotal: 1, minBackHalfFraction: 0.4 }
		},
		clueRange: [23, 28] as [number, number],
		maxNakedSingleFraction: 0.6,
		maxAttempts: 300
	},

	Expert: {
		name: 'Expert',
		maxTechnique: Technique.Swordfish,
		requirements: {
			[Technique.NakedPair]: { minTotal: 2, minBackHalfFraction: 0.3 },
			[Technique.XWing]: { minTotal: 1, minBackHalfFraction: 0.5 },
			[Technique.XYWing]: { minTotal: 1 }
		},
		clueRange: [20, 26] as [number, number],
		maxNakedSingleFraction: 0.5,
		maxAttempts: 600
	},

	Extreme: {
		name: 'Extreme',
		maxTechnique: Technique.Bifurcation,
		requirements: {
			[Technique.XYWing]: { minTotal: 2, minBackHalfFraction: 0.5 },
			[Technique.Swordfish]: { minTotal: 1 },
			[Technique.Bifurcation]: { minTotal: 1, minBackHalfFraction: 0.5 }
		},
		clueRange: [17, 23] as [number, number],
		maxNakedSingleFraction: 0.4,
		maxAttempts: 1000
	}
} satisfies Record<string, DifficultyProfile>;

// ─── Internal types ───────────────────────────────────────────────────────────

interface Elimination {
	cell: number;
	digitBit: number;
}
interface Placement {
	cell: number;
	digit: number;
}

interface SolveStep {
	technique: Technique;
	placements: Placement[];
	eliminations: Elimination[];
}

interface SolveState {
	cells: Uint8Array; // 0 = empty, 1–9 = placed digit
	cands: Uint16Array; // 9-bit candidate mask per cell (0 when placed)
}

// ─── State helpers ────────────────────────────────────────────────────────────

function makeState(puzzle: Uint8Array): SolveState {
	const cells = new Uint8Array(81);
	const cands = new Uint16Array(81).fill(0x1ff);
	for (let i = 0; i < 81; i++) if (puzzle[i]) placeDigit({ cells, cands }, i, puzzle[i]);
	return { cells, cands };
}

function cloneState(s: SolveState): SolveState {
	return { cells: s.cells.slice(), cands: s.cands.slice() };
}

function placeDigit(state: SolveState, cell: number, digit: number): void {
	state.cells[cell] = digit;
	state.cands[cell] = 0;
	const bit = 1 << (digit - 1);
	for (const peer of PEERS[cell]) state.cands[peer] &= ~bit;
}

function applyStep(state: SolveState, step: SolveStep): void {
	for (const { cell, digit } of step.placements) placeDigit(state, cell, digit);
	for (const { cell, digitBit } of step.eliminations) state.cands[cell] &= ~digitBit;
}

function hasContradiction(state: SolveState): boolean {
	for (let i = 0; i < 81; i++) if (!state.cells[i] && !state.cands[i]) return true;
	return false;
}

/** Extract the two isolated set-bits from a 2-bit integer. */
function splitTwoBits(n: number): [number, number] {
	const lo = n & -n;
	return [lo, n ^ lo];
}

// ─── Technique implementations ────────────────────────────────────────────────
// Each returns a SolveStep on success, or null if the technique has no move.

function nakedSingle({ cells, cands }: SolveState): SolveStep | null {
	for (let i = 0; i < 81; i++) {
		if (cells[i]) continue;
		const c = cands[i];
		if (c && !(c & (c - 1)))
			// exactly one bit set
			return {
				technique: Technique.NakedSingle,
				placements: [{ cell: i, digit: BIT_DIGIT[c] }],
				eliminations: []
			};
	}
	return null;
}

function hiddenSingle({ cells, cands }: SolveState): SolveStep | null {
	for (const unit of ALL_UNITS) {
		for (let d = 1; d <= 9; d++) {
			const bit = 1 << (d - 1);
			let count = 0,
				last = -1;
			for (const cell of unit) {
				if (!cells[cell] && cands[cell] & bit) {
					count++;
					last = cell;
				}
			}
			if (count === 1)
				return {
					technique: Technique.HiddenSingle,
					placements: [{ cell: last, digit: d }],
					eliminations: []
				};
		}
	}
	return null;
}

function nakedPair({ cells, cands }: SolveState): SolveStep | null {
	for (const unit of ALL_UNITS) {
		const empties = Array.from(unit).filter((c) => !cells[c]);
		for (let a = 0; a < empties.length - 1; a++) {
			const ca = cands[empties[a]];
			if (popcount9(ca) !== 2) continue;
			for (let b = a + 1; b < empties.length; b++) {
				if (cands[empties[b]] !== ca) continue;
				const elims: Elimination[] = [];
				for (let i = 0; i < empties.length; i++) {
					if (i === a || i === b) continue;
					let m = cands[empties[i]] & ca;
					while (m) {
						elims.push({ cell: empties[i], digitBit: m & -m });
						m &= m - 1;
					}
				}
				if (elims.length)
					return { technique: Technique.NakedPair, placements: [], eliminations: elims };
			}
		}
	}
	return null;
}

function nakedTriple({ cells, cands }: SolveState): SolveStep | null {
	for (const unit of ALL_UNITS) {
		const empties = Array.from(unit).filter((c) => !cells[c]);
		for (let a = 0; a < empties.length - 2; a++) {
			for (let b = a + 1; b < empties.length - 1; b++) {
				const ab = cands[empties[a]] | cands[empties[b]];
				if (popcount9(ab) > 3) continue;
				for (let c = b + 1; c < empties.length; c++) {
					const abc = ab | cands[empties[c]];
					if (popcount9(abc) !== 3) continue;
					const elims: Elimination[] = [];
					for (let i = 0; i < empties.length; i++) {
						if (i === a || i === b || i === c) continue;
						let m = cands[empties[i]] & abc;
						while (m) {
							elims.push({ cell: empties[i], digitBit: m & -m });
							m &= m - 1;
						}
					}
					if (elims.length)
						return { technique: Technique.NakedTriple, placements: [], eliminations: elims };
				}
			}
		}
	}
	return null;
}

function pointingPairs({ cells, cands }: SolveState): SolveStep | null {
	for (let b = 0; b < 9; b++) {
		const boxCells = Array.from(BOXES[b]);
		for (let d = 1; d <= 9; d++) {
			const bit = 1 << (d - 1);
			const hits = boxCells.filter((c) => !cells[c] && cands[c] & bit);
			if (hits.length < 2) continue;

			// Confined to one row?
			if (new Set(hits.map((c) => CELL_ROW[c])).size === 1) {
				const r = CELL_ROW[hits[0]];
				const elims: Elimination[] = [];
				for (const c of ROWS[r]) {
					if (CELL_BOX[c] !== b && !cells[c] && cands[c] & bit)
						elims.push({ cell: c, digitBit: bit });
				}
				if (elims.length)
					return { technique: Technique.PointingPairs, placements: [], eliminations: elims };
			}

			// Confined to one column?
			if (new Set(hits.map((c) => CELL_COL[c])).size === 1) {
				const col = CELL_COL[hits[0]];
				const elims: Elimination[] = [];
				for (const c of COLS[col]) {
					if (CELL_BOX[c] !== b && !cells[c] && cands[c] & bit)
						elims.push({ cell: c, digitBit: bit });
				}
				if (elims.length)
					return { technique: Technique.PointingPairs, placements: [], eliminations: elims };
			}
		}
	}
	return null;
}

function boxLineReduction({ cells, cands }: SolveState): SolveStep | null {
	// For each row/col, if a digit's candidates all fall in one box → eliminate from rest of box
	for (const lines of [ROWS, COLS]) {
		for (const line of lines) {
			for (let d = 1; d <= 9; d++) {
				const bit = 1 << (d - 1);
				const hits = Array.from(line).filter((c) => !cells[c] && cands[c] & bit);
				if (hits.length < 2) continue;
				const boxes = new Set(hits.map((c) => CELL_BOX[c]));
				if (boxes.size !== 1) continue;
				const box = [...boxes][0];
				const elims: Elimination[] = [];
				for (const c of BOXES[box]) {
					if (!line.includes(c) && !cells[c] && cands[c] & bit)
						elims.push({ cell: c, digitBit: bit });
				}
				if (elims.length)
					return { technique: Technique.BoxLineReduction, placements: [], eliminations: elims };
			}
		}
	}
	return null;
}

function xWing({ cells, cands }: SolveState): SolveStep | null {
	for (const [primary, secondary, getPrimIdx, getSecIdx] of [
		[ROWS, COLS, CELL_ROW, CELL_COL],
		[COLS, ROWS, CELL_COL, CELL_ROW]
	] as const) {
		for (let d = 1; d <= 9; d++) {
			const bit = 1 << (d - 1);
			// Collect primary lines where digit appears in exactly 2 cells
			const lineData: Array<{ idx: number; secIndices: [number, number] }> = [];
			for (let i = 0; i < 9; i++) {
				const hits = Array.from(primary[i]).filter((c) => !cells[c] && cands[c] & bit);
				if (hits.length === 2)
					lineData.push({ idx: i, secIndices: [getSecIdx[hits[0]], getSecIdx[hits[1]]] });
			}
			// Find two lines with matching secondary indices
			for (let a = 0; a < lineData.length - 1; a++) {
				for (let b = a + 1; b < lineData.length; b++) {
					const [s1, s2] = lineData[a].secIndices;
					if (lineData[b].secIndices[0] !== s1 || lineData[b].secIndices[1] !== s2) continue;
					const skipPrim = new Set([lineData[a].idx, lineData[b].idx]);
					const elims: Elimination[] = [];
					for (const sIdx of [s1, s2]) {
						for (const c of secondary[sIdx]) {
							if (!skipPrim.has(getPrimIdx[c]) && !cells[c] && cands[c] & bit)
								elims.push({ cell: c, digitBit: bit });
						}
					}
					if (elims.length)
						return { technique: Technique.XWing, placements: [], eliminations: elims };
				}
			}
		}
	}
	return null;
}

function xyWing({ cells, cands }: SolveState): SolveStep | null {
	for (let pivot = 0; pivot < 81; pivot++) {
		if (cells[pivot] || popcount9(cands[pivot]) !== 2) continue;
		const [bitA, bitB] = splitTwoBits(cands[pivot]);

		// Gather peers that could be wings (bi-value cells)
		const wingsA: number[] = [],
			wingsB: number[] = [];
		for (const peer of PEERS[pivot]) {
			if (cells[peer] || popcount9(cands[peer]) !== 2) continue;
			if (cands[peer] & bitA) wingsA.push(peer);
			if (cands[peer] & bitB) wingsB.push(peer);
		}

		for (const w1 of wingsA) {
			const bitC = cands[w1] ^ bitA; // the non-A bit in w1
			if (!bitC || bitC === bitB) continue; // must be a third, distinct digit

			for (const w2 of wingsB) {
				if (w2 === w1) continue;
				if (cands[w2] !== (bitB | bitC)) continue; // w2 must be exactly {B, C}

				// Eliminate bitC from every cell that sees both w1 and w2
				const elims: Elimination[] = [];
				for (const peer of PEERS[w1]) {
					if (!cells[peer] && cands[peer] & bitC && arePeers(peer, w2))
						elims.push({ cell: peer, digitBit: bitC });
				}
				if (elims.length)
					return { technique: Technique.XYWing, placements: [], eliminations: elims };
			}
		}
	}
	return null;
}

function swordfish({ cells, cands }: SolveState): SolveStep | null {
	for (const [primary, secondary, getPrimIdx, getSecIdx] of [
		[ROWS, COLS, CELL_ROW, CELL_COL],
		[COLS, ROWS, CELL_COL, CELL_ROW]
	] as const) {
		for (let d = 1; d <= 9; d++) {
			const bit = 1 << (d - 1);
			const lineData: Array<{ idx: number; secIdxSet: number[] }> = [];
			for (let i = 0; i < 9; i++) {
				const hits = Array.from(primary[i]).filter((c) => !cells[c] && cands[c] & bit);
				if (hits.length >= 2 && hits.length <= 3)
					lineData.push({ idx: i, secIdxSet: hits.map((c) => getSecIdx[c]) });
			}

			for (let a = 0; a < lineData.length - 2; a++) {
				for (let b = a + 1; b < lineData.length - 1; b++) {
					for (let c = b + 1; c < lineData.length; c++) {
						const allSec = new Set([
							...lineData[a].secIdxSet,
							...lineData[b].secIdxSet,
							...lineData[c].secIdxSet
						]);
						if (allSec.size !== 3) continue;
						const skipPrim = new Set([lineData[a].idx, lineData[b].idx, lineData[c].idx]);
						const elims: Elimination[] = [];
						for (const sIdx of allSec) {
							for (const cell of secondary[sIdx]) {
								if (!skipPrim.has(getPrimIdx[cell]) && !cells[cell] && cands[cell] & bit)
									elims.push({ cell, digitBit: bit });
							}
						}
						if (elims.length)
							return { technique: Technique.Swordfish, placements: [], eliminations: elims };
					}
				}
			}
		}
	}
	return null;
}

/**
 * Bifurcation: for the most-constrained cell, trial-place each candidate in
 * a cloned state and run the sub-solver (without Bifurcation to avoid infinite
 * recursion). Any candidate that immediately leads to a contradiction is
 * eliminated. The sub-profile uses techniques up to Swordfish.
 */
function bifurcation(state: SolveState, profile: DifficultyProfile): SolveStep | null {
	let bestCell = -1,
		bestCount = 10;
	for (let i = 0; i < 81; i++) {
		if (state.cells[i]) continue;
		const cnt = popcount9(state.cands[i]);
		if (cnt < bestCount) {
			bestCount = cnt;
			bestCell = i;
			if (cnt === 2) break;
		}
	}
	if (bestCell === -1) return null;

	const subProfile: DifficultyProfile = {
		...profile,
		maxTechnique: Math.min(profile.maxTechnique, Technique.Swordfish) as Technique
	};

	const elims: Elimination[] = [];
	let m = state.cands[bestCell];
	while (m) {
		const bit = m & -m;
		m &= m - 1;
		const trial = cloneState(state);
		placeDigit(trial, bestCell, BIT_DIGIT[bit]);
		strategySolve(trial, subProfile); // mutates trial; we check aftermath
		if (hasContradiction(trial)) elims.push({ cell: bestCell, digitBit: bit });
	}

	if (!elims.length) return null;
	return { technique: Technique.Bifurcation, placements: [], eliminations: elims };
}

// ─── Strategy solver ──────────────────────────────────────────────────────────

/**
 * Ordered list of technique functions (must mirror the Technique enum order).
 * Bifurcation is handled separately since it needs the profile + state reference.
 */
const TECHNIQUE_FNS: Array<(s: SolveState) => SolveStep | null> = [
	nakedSingle,
	hiddenSingle,
	nakedPair,
	nakedTriple,
	pointingPairs,
	boxLineReduction,
	xWing,
	xyWing,
	swordfish
];

/**
 * Attempt to solve `state` using only techniques ≤ profile.maxTechnique.
 * Mutates `state` in place. Returns the ordered list of steps taken, or
 * null if the solver gets stuck before the grid is complete.
 */
function strategySolve(state: SolveState, profile: DifficultyProfile): SolveStep[] | null {
	const steps: SolveStep[] = [];

	while (true) {
		if (state.cells.every((c) => c > 0)) return steps; // solved ✓

		let progress = false;

		for (let t = 0; t <= profile.maxTechnique; t++) {
			const step =
				t === Technique.Bifurcation
					? bifurcation(state, profile)
					: (TECHNIQUE_FNS[t]?.(state) ?? null);

			if (step) {
				applyStep(state, step);
				steps.push(step);
				progress = true;
				break; // restart from easiest technique after each advance
			}
		}

		if (!progress) return null; // stuck
	}
}

// ─── Requirement checker ──────────────────────────────────────────────────────

/**
 * Given the solve path for a completed puzzle, verify that all constraints in
 * the profile are met: per-technique minimums, back-half distribution, and the
 * global naked-single fraction cap.
 */
function meetsRequirements(steps: SolveStep[], profile: DifficultyProfile): boolean {
	// Per-step technique counts, split into first/second half by placement index
	const total: Partial<Record<Technique, number>> = {};
	const backHalf: Partial<Record<Technique, number>> = {};
	let placed = 0;

	for (const step of steps) {
		const t = step.technique;
		const inBack = placed >= 41;
		total[t] = (total[t] ?? 0) + 1;
		if (inBack) backHalf[t] = (backHalf[t] ?? 0) + 1;
		placed += step.placements.length;
	}

	// Per-technique requirements
	for (const [techStr, req] of Object.entries(profile.requirements)) {
		if (!req) continue;
		const t = Number(techStr) as Technique;
		const n = total[t] ?? 0;

		if ((req.minTotal ?? 0) > n) return false;

		if (req.minBackHalfFraction !== undefined && n > 0) {
			const back = backHalf[t] ?? 0;
			if (back / n < req.minBackHalfFraction) return false;
		}
	}

	// Global naked-single fraction cap
	const ns = total[Technique.NakedSingle] ?? 0;
	if (ns / steps.length > profile.maxNakedSingleFraction) return false;

	return true;
}

// ─── Uniqueness checker ───────────────────────────────────────────────────────

/**
 * Count the number of solutions to a flat puzzle (0 = empty, 1–9 = given).
 * Stops as soon as `limit` solutions are found (default 2, sufficient for
 * the single-solution check).
 */
function countSolutions(puzzle: Uint8Array, limit = 2): number {
	const cells = puzzle.slice();
	const rowM = new Uint16Array(9),
		colM = new Uint16Array(9),
		boxM = new Uint16Array(9);

	for (let i = 0; i < 81; i++) {
		if (cells[i]) {
			const bit = 1 << (cells[i] - 1);
			rowM[CELL_ROW[i]] |= bit;
			colM[CELL_COL[i]] |= bit;
			boxM[CELL_BOX[i]] |= bit;
		}
	}

	const avail = (i: number) => ~(rowM[CELL_ROW[i]] | colM[CELL_COL[i]] | boxM[CELL_BOX[i]]) & 0x1ff;

	let count = 0;

	function solve(): void {
		if (count >= limit) return;
		let best = -1,
			bestBits = 0,
			bestCount = 10;
		for (let i = 0; i < 81; i++) {
			if (cells[i]) continue;
			const bits = avail(i),
				cnt = popcount9(bits);
			if (cnt === 0) return;
			if (cnt < bestCount) {
				bestCount = cnt;
				bestBits = bits;
				best = i;
				if (cnt === 1) break;
			}
		}
		if (best === -1) {
			count++;
			return;
		}

		const r = CELL_ROW[best],
			c = CELL_COL[best],
			b = CELL_BOX[best];
		let m = bestBits;
		while (m && count < limit) {
			const bit = m & -m;
			m &= m - 1;
			cells[best] = BIT_DIGIT[bit];
			rowM[r] |= bit;
			colM[c] |= bit;
			boxM[b] |= bit;
			solve();
			cells[best] = 0;
			rowM[r] ^= bit;
			colM[c] ^= bit;
			boxM[b] ^= bit;
		}
	}

	solve();
	return count;
}

// ─── Full-grid generator ──────────────────────────────────────────────────────

function generateFull(): Uint8Array {
	const cells = new Uint8Array(81);
	const rowM = new Uint16Array(9),
		colM = new Uint16Array(9),
		boxM = new Uint16Array(9);
	const scratch = new Uint16Array(9);
	const avail = (i: number) => ~(rowM[CELL_ROW[i]] | colM[CELL_COL[i]] | boxM[CELL_BOX[i]]) & 0x1ff;

	function solve(): boolean {
		let best = -1,
			bestBits = 0,
			bestCount = 10;
		for (let i = 0; i < 81; i++) {
			if (cells[i]) continue;
			const bits = avail(i),
				cnt = popcount9(bits);
			if (cnt === 0) return false;
			if (cnt < bestCount) {
				bestCount = cnt;
				bestBits = bits;
				best = i;
				if (cnt === 1) break;
			}
		}
		if (best === -1) return true;

		const r = CELL_ROW[best],
			c = CELL_COL[best],
			b = CELL_BOX[best];
		let k = 0,
			m = bestBits;
		while (m) {
			scratch[k++] = m & -m;
			m &= m - 1;
		}
		for (let i = k - 1; i > 0; i--) {
			const j = (Math.random() * (i + 1)) | 0;
			const t = scratch[i];
			scratch[i] = scratch[j];
			scratch[j] = t;
		}

		for (let i = 0; i < k; i++) {
			const bit = scratch[i];
			cells[best] = BIT_DIGIT[bit];
			rowM[r] |= bit;
			colM[c] |= bit;
			boxM[b] |= bit;

			let ok = true;
			for (const peer of PEERS[best]) {
				if (!cells[peer] && !avail(peer)) {
					ok = false;
					break;
				}
			}
			if (ok && solve()) return true;

			cells[best] = 0;
			rowM[r] ^= bit;
			colM[c] ^= bit;
			boxM[b] ^= bit;
		}
		return false;
	}

	solve();
	return cells;
}

// ─── Clue digger ─────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = (Math.random() * (i + 1)) | 0;
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * Attempt to dig clues from fullGrid while maintaining:
 *   (a) a unique solution, and
 *   (b) solvability using only techniques ≤ profile.maxTechnique.
 *
 * Each removal is validated against both constraints before being kept.
 * Cells are visited in a random order so each call produces a different result.
 */
function dig(fullGrid: Uint8Array, profile: DifficultyProfile): Uint8Array {
	const puzzle = fullGrid.slice();
	const order = shuffle(Array.from({ length: 81 }, (_, i) => i));

	for (const cell of order) {
		const backup = puzzle[cell];
		puzzle[cell] = 0;

		if (countSolutions(puzzle) !== 1) {
			puzzle[cell] = backup;
			continue;
		}

		const state = makeState(puzzle);
		if (!strategySolve(state, profile)) {
			puzzle[cell] = backup;
		}
		// else: removal is valid — keep it removed
	}

	return puzzle;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a Sudoku puzzle matching the given difficulty profile.
 *
 * Returns a 9×9 grid (grid[row][col] ∈ 1..9, 0 = empty cell), or null if no
 * qualifying puzzle was found within profile.maxAttempts.
 *
 * For harder profiles (Expert/Extreme) this may take several seconds.
 * Consider calling from a worker thread for interactive applications.
 *
 * @example
 *   const puzzle = generatePuzzle(Difficulty.Hard);
 *   const puzzle = generatePuzzle({ ...Difficulty.Expert, maxAttempts: 1000 });
 */
export function generatePuzzle(dif: keyof typeof Difficulty): {
	problem: Uint8Array;
	solution: Uint8Array;
} | null {
	const profile = Difficulty[dif];
	for (let attempt = 0; attempt < profile.maxAttempts; attempt++) {
		const solution = generateFull();
		const problem = dig(solution, profile);

		const clues = problem.reduce((n, v) => n + (v > 0 ? 1 : 0), 0);
		if (clues < profile.clueRange[0] || clues > profile.clueRange[1]) continue;

		const state = makeState(problem);
		const steps = strategySolve(state, profile);
		if (!steps) continue;

		if (!meetsRequirements(steps, profile)) continue;

		return {
			solution,
			problem
		};
	}

	return null;
}

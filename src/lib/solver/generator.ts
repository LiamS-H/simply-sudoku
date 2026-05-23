import { BitBoard } from './bitboard';
import { BOXES, popcount9, shuffle } from './utils';

export type TechniqueType =
	| 'SimpleGridScan'
	| 'SimpleRowColScan'
	| 'NakedSingle'
	| 'HiddenSingle'
	| 'DFS';

export interface SolveStep {
	cellIndex: number;
	digit: number;
	technique: TechniqueType;
}

export const EasyDifficulty: DifficultyConfig = {
	name: 'Easy',
	minRemovals: 45,
	maxRemovals: 60,
	maxStates: 1000,
	allowedTechniques: ['SimpleGridScan'],
	evaluateHeuristic: (steps) => {
		let val = 0;
		for (let i = 0; i < steps.length; i++) {
			const { technique } = steps[i];
			if (technique === 'SimpleGridScan') {
				val += 5;
				continue;
			}
		}
		return val;
	}
};

export const MediumDifficulty: DifficultyConfig = {
	name: 'Medium',
	minRemovals: 45,
	maxRemovals: 70,
	maxStates: 1000,
	allowedTechniques: ['SimpleGridScan', 'SimpleRowColScan'],
	evaluateHeuristic: (steps) => {
		let val = 0;
		let simples_pen = -4;
		for (let i = steps.length - 1; i >= 0; i--) {
			const { technique } = steps[i];
			if (technique === 'SimpleGridScan') {
				val += 4 - simples_pen;
				simples_pen += 1;
				continue;
			}
			if (technique === 'SimpleRowColScan') {
				val += 4;
				simples_pen = 0;
				continue;
			}
		}
		return val;
	}
};

export const HardDifficulty: DifficultyConfig = {
	name: 'Hard',
	minRemovals: 45,
	maxRemovals: 81,
	maxStates: 1000,
	allowedTechniques: ['SimpleGridScan', 'SimpleRowColScan', 'NakedSingle'],
	evaluateHeuristic: (steps) => {
		let val = 0;
		let simples_pen = 4;
		let singles_pen = 0;
		for (let i = steps.length - 1; i >= 0; i--) {
			const { technique } = steps[i];
			if (technique === 'SimpleGridScan') {
				val += 0 - simples_pen;
				simples_pen += 1;
				singles_pen += 3;
				continue;
			}
			if (technique === 'SimpleRowColScan') {
				val += 4;
				simples_pen -= 1;
				singles_pen += 3;
				continue;
			}
			if (technique === 'NakedSingle') {
				val += 10 - singles_pen;
				simples_pen = -2;
				singles_pen += 15;
			}
		}
		return val;
	}
};

export interface DifficultyConfig {
	name: string;
	minRemovals: number;
	maxRemovals: number;
	maxStates: number;
	/** Cascade chain prioritized from simplest to most advanced techniques */
	allowedTechniques: TechniqueType[];
	/** Analyzes the structural moves to assign a quality fit score */
	evaluateHeuristic(accumulatedSteps: SolveStep[], remainingCluesCount: number): number;
}

export class PuzzleGenerator {
	private baseBoard: BitBoard;
	private statesEvaluated = 0;

	private bestBoard: BitBoard | null = null;
	private bestScore = -Infinity;
	private globalStepHistory: SolveStep[] = [];

	constructor(completeBoard: BitBoard) {
		this.baseBoard = BitBoard.from(completeBoard);
	}

	public generate(config: DifficultyConfig): BitBoard {
		this.statesEvaluated = 0;
		this.bestBoard = null;
		this.bestScore = -Infinity;
		this.globalStepHistory = [];

		const runningBoard = BitBoard.from(this.baseBoard);
		this.digSequence(runningBoard, config, 0);

		return this.bestBoard ?? this.baseBoard;
	}

	protected digSequence(board: BitBoard, config: DifficultyConfig, currentDigCount: number): void {
		this.statesEvaluated++;
		if (this.statesEvaluated >= config.maxStates) {
			return;
		}

		let len = 0;
		const filledIndices = new Uint8Array(81);
		for (let i = 0; i < 81; i++) {
			if (board.cells[i] !== 0) {
				filledIndices[len] = i;
				len++;
			}
		}

		shuffle(filledIndices, len);
		let branchIsTerminal = true;

		for (let i = 0; i < len; i++) {
			const idx = filledIndices[i];
			if (this.statesEvaluated >= config.maxStates) return;
			if (currentDigCount >= config.maxRemovals) break;

			const originalVal = board.cells[idx];
			board.remove(idx, originalVal);

			if (board.isUniqueAfterRemoval(idx, originalVal)) {
				const deduction = this.verifyCellDeduction(
					board,
					idx,
					originalVal,
					config.allowedTechniques
				);

				if (deduction.success) {
					branchIsTerminal = false;
					this.globalStepHistory.push(...deduction.steps);

					this.digSequence(board, config, currentDigCount + 1);

					const stepsToPop = deduction.steps.length;
					this.globalStepHistory.splice(this.globalStepHistory.length - stepsToPop, stepsToPop);
				}
			}

			board.place(idx, originalVal);
		}

		if (branchIsTerminal && currentDigCount >= config.minRemovals) {
			const remainingClues = 81 - currentDigCount;
			const currentScore = config.evaluateHeuristic(this.globalStepHistory, remainingClues);

			if (currentScore > this.bestScore) {
				this.bestScore = currentScore;
				this.bestBoard = BitBoard.from(board);
			}
		}
	}

	/**
	 * Target-driven deduction loop.
	 */
	public verifyCellDeduction(
		board: BitBoard,
		targetCellIndex: number,
		targetDigit: number,
		allowed: TechniqueType[]
	): { success: boolean; steps: SolveStep[] } {
		const workingBoard = BitBoard.from(board);
		const localSteps: SolveStep[] = [];

		while (true) {
			let moveFound = false;

			for (const technique of allowed) {
				let step: SolveStep | null = null;

				if (technique === 'SimpleGridScan') {
					step = this.executeSimpleGridScan(workingBoard, targetCellIndex);
				} else if (technique === 'SimpleRowColScan') {
					step = this.executeSimpleRowColScan(workingBoard, targetCellIndex);
				} else if (technique === 'NakedSingle') {
					step = this.executeNakedSingle(workingBoard, targetCellIndex);
				} else if (technique === 'HiddenSingle') {
					step = this.executeHiddenSingle(workingBoard);
				} else if (technique === 'DFS') {
					step = this.executeDFSStep(workingBoard);
				}

				if (step !== null) {
					workingBoard.place(step.cellIndex, step.digit);
					localSteps.push(step);
					moveFound = true;

					if (workingBoard.cells[targetCellIndex] === targetDigit) {
						return { success: true, steps: localSteps };
					}

					break;
				}
			}

			if (!moveFound) {
				break;
			}
		}

		return { success: false, steps: [] };
	}

	/**
	 * Prioritizes the 3x3 box containing our target square.
	 */
	executeSimpleGridScan(board: BitBoard, targetCellIndex?: number): SolveStep | null {
		if (targetCellIndex !== undefined) {
			const targetBox = BOXES.findIndex((box) => box.includes(targetCellIndex));
			if (targetBox !== -1) {
				const step = this.scanBox(board, targetBox);
				if (step) return step;
			}
		}

		for (let b = 0; b < 9; b++) {
			if (targetCellIndex !== undefined && BOXES[b].includes(targetCellIndex)) {
				continue; // Already scanned
			}
			const step = this.scanBox(board, b);
			if (step) return step;
		}
		return null;
	}

	private scanBox(board: BitBoard, b: number): SolveStep | null {
		for (let d = 1; d <= 9; d++) {
			const bit = 1 << (d - 1);
			let matchIdx = -1;
			let count = 0;
			for (let k = 0; k < 9; k++) {
				const idx = BOXES[b][k];
				if (board.cells[idx] === 0 && board.available(idx) & bit) {
					count++;
					matchIdx = idx;
				}
			}
			if (count === 1) {
				return { cellIndex: matchIdx, digit: d, technique: 'SimpleGridScan' };
			}
		}
		return null;
	}

	/**
	 * Prioritizes the row and column containing our target square.
	 */
	protected executeSimpleRowColScan(board: BitBoard, targetCellIndex?: number): SolveStep | null {
		if (targetCellIndex !== undefined) {
			const targetRow = Math.floor(targetCellIndex / 9);
			const targetCol = targetCellIndex % 9;

			const rowStep = this.scanRow(board, targetRow);
			if (rowStep) return rowStep;

			const colStep = this.scanCol(board, targetCol);
			if (colStep) return colStep;
		}

		const tRow = targetCellIndex !== undefined ? Math.floor(targetCellIndex / 9) : -1;
		const tCol = targetCellIndex !== undefined ? targetCellIndex % 9 : -1;

		for (let r = 0; r < 9; r++) {
			if (r === tRow) continue;
			const step = this.scanRow(board, r);
			if (step) return step;
		}

		for (let c = 0; c < 9; c++) {
			if (c === tCol) continue;
			const step = this.scanCol(board, c);
			if (step) return step;
		}

		return null;
	}

	private scanRow(board: BitBoard, r: number): SolveStep | null {
		for (let d = 1; d <= 9; d++) {
			const bit = 1 << (d - 1);
			let matchIdx = -1;
			let count = 0;
			for (let c = 0; c < 9; c++) {
				const idx = r * 9 + c;
				if (board.cells[idx] === 0 && board.available(idx) & bit) {
					count++;
					matchIdx = idx;
				}
			}
			if (count === 1) {
				return { cellIndex: matchIdx, digit: d, technique: 'SimpleRowColScan' };
			}
		}
		return null;
	}

	private scanCol(board: BitBoard, c: number): SolveStep | null {
		for (let d = 1; d <= 9; d++) {
			const bit = 1 << (d - 1);
			let matchIdx = -1;
			let count = 0;
			for (let r = 0; r < 9; r++) {
				const idx = r * 9 + c;
				if (board.cells[idx] === 0 && board.available(idx) & bit) {
					count++;
					matchIdx = idx;
				}
			}
			if (count === 1) {
				return { cellIndex: matchIdx, digit: d, technique: 'SimpleRowColScan' };
			}
		}
		return null;
	}

	/**
	 * Checks the target cell immediately for a naked single, then fixes the digit tracking bug.
	 */
	protected executeNakedSingle(board: BitBoard, targetCellIndex?: number): SolveStep | null {
		if (targetCellIndex !== undefined && board.cells[targetCellIndex] === 0) {
			const avail = board.available(targetCellIndex);
			if (popcount9(avail) === 1) {
				for (let d = 1; d <= 9; d++) {
					if (avail & (1 << (d - 1))) {
						return { cellIndex: targetCellIndex, digit: d, technique: 'NakedSingle' };
					}
				}
			}
		}

		for (let i = 0; i < 81; i++) {
			if (board.cells[i] !== 0 || i === targetCellIndex) continue;

			const avail = board.available(i);
			if (popcount9(avail) === 1) {
				for (let d = 1; d <= 9; d++) {
					if (avail & (1 << (d - 1))) {
						return { cellIndex: i, digit: d, technique: 'NakedSingle' };
					}
				}
			}
		}
		return null;
	}

	protected executeHiddenSingle(_board: BitBoard): SolveStep | null {
		return null;
	}
	protected executeDFSStep(_board: BitBoard): SolveStep | null {
		return null;
	}
}

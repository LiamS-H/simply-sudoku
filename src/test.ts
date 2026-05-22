import { BitBoard } from '$lib/solver/bitboard';
import {
	EasyDifficulty,
	HardDifficulty,
	MediumDifficulty,
	PuzzleGenerator
} from '$lib/solver/generator';
import { isValid, printPuzzle } from '$lib/solver/utils';

const GEN_ITERS = 10000;

console.log(`\n--- generating and validating ${GEN_ITERS} full boards ---`);
let timer = Date.now();
for (let i = 0; i < GEN_ITERS; i++) {
	const board = BitBoard.random();
	if (!isValid(board.cells)) {
		printPuzzle(board.cells);
		throw Error('produced invalid board');
	}
}
console.log(`${((Date.now() - timer) / GEN_ITERS).toFixed(3)} ms/board`);

const PUZZLE_ITERS = 100;

for (const difficulty of [EasyDifficulty, MediumDifficulty, HardDifficulty]) {
	console.log(`\n--- generating ${PUZZLE_ITERS} ${difficulty.name} excavated puzzles ---`);
	timer = Date.now();
	for (let i = 0; i < PUZZLE_ITERS; i++) {
		const solution = BitBoard.random();
		const generator = new PuzzleGenerator(solution);
		const puzzle = generator.generate(difficulty);

		// console.log('Puzzle:');
		// printPuzzle(puzzle.cells);

		// Verify uniqueness
		if (!puzzle.isUnique()) {
			throw Error('Dug puzzle is not unique!');
		}
	}
	console.log(`${((Date.now() - timer) / PUZZLE_ITERS).toFixed(3)} ms/board`);
}

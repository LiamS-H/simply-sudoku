import { BitBoard } from '$lib/solver/bitboard';
import { isValid, printPuzzle } from '$lib/solver/utils';

const GEN_ITERS = 10000;

console.log(`generating and validating ${GEN_ITERS} full boards`);
let timer = Date.now();
for (let i = 0; i < GEN_ITERS; i++) {
	const board = BitBoard.random();
	if (!isValid(board.cells)) {
		printPuzzle(board.cells);
		throw Error('produced invalid board');
	}
}
console.log(`${((Date.now() - timer) / GEN_ITERS).toFixed(3)} ms/board`);

const PUZZLE_ITERS = 1;
console.log(`generating and validating ${PUZZLE_ITERS} full puzzles`);
timer = Date.now();
for (let i = 0; i < PUZZLE_ITERS; i++) {
	const solution = BitBoard.random();
	const puzzle = BitBoard.from(solution);
	puzzle.mutateGreedyDigWhileUnique(60, 70);
	printPuzzle(puzzle.cells);
	printPuzzle(solution.cells);

	if (!isValid(solution.cells)) {
		printPuzzle(solution.cells);
		throw Error('produced invalid board');
	}

	if (!puzzle.isUnique()) {
		throw Error('produced non-unique board');
	}
}
console.log(`${((Date.now() - timer) / PUZZLE_ITERS).toFixed(3)} ms/board`);

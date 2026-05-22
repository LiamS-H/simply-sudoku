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

console.log('\n--- Testing depth-one solver and digging ---');
const DEPTH_ONE_ITERS = 5;
for (let i = 0; i < DEPTH_ONE_ITERS; i++) {
	console.log(`\nTest Case ${i + 1}:`);
	const solution = BitBoard.random();
	const puzzle = BitBoard.from(solution);

	const allowedSteps = 500;
	const digTimer = Date.now();
	puzzle.mutateDigDepthOne(allowedSteps);
	const timeTaken = Date.now() - digTimer;

	let clueCount = 0;
	for (let j = 0; j < 81; j++) {
		if (puzzle.cells[j] !== 0) clueCount++;
	}

	console.log(`Dug puzzle in ${timeTaken} ms (allowedSteps = ${allowedSteps}). Clue count: ${clueCount}`);
	console.log('Puzzle:');
	printPuzzle(puzzle.cells);

	// Verify that it can be solved by solveDepthOne
	if (!puzzle.solveDepthOne()) {
		throw Error('Depth-one solver failed to solve the dug puzzle!');
	}

	// Verify uniqueness
	if (!puzzle.isUnique()) {
		throw Error('Dug puzzle is not unique!');
	}

	console.log('Passed validation: unique and solvable by depth-one!');
}


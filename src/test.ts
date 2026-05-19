import { generateFullSolution, generatePuzzle } from '$lib/solver/generate';
import { isValid, printPuzzle } from '$lib/solver/utils';

const GEN_ITERS = 10000;

console.log(`generating and validating ${GEN_ITERS} full boards`);
let timer = Date.now();
for (let i = 0; i < GEN_ITERS; i++) {
	const board = generateFullSolution();
	if (!isValid(board)) {
		throw Error('produced invalid board');
	}
}
console.log(`${((Date.now() - timer) / GEN_ITERS).toFixed(3)} ms/board`);

const PUZZLE_ITERS = 1;

console.log(`generating and validating ${PUZZLE_ITERS} puzzles`);
timer = Date.now();
for (let i = 0; i < PUZZLE_ITERS; i++) {
	const { solution, puzzle } = generatePuzzle(20);
	if (!isValid(solution)) {
		throw Error('produced invalid board');
	}
	printPuzzle(puzzle);
}
console.log(`${((Date.now() - timer) / PUZZLE_ITERS).toFixed(3)} ms/board`);

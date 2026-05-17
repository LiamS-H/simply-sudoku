import type { EditAction } from './action';

export interface UserWorkElement {
	val: number;
	1: boolean;
	2: boolean;
	3: boolean;
	4: boolean;
	5: boolean;
	6: boolean;
	7: boolean;
	8: boolean;
	9: boolean;
}

export interface UserWork {
	rows: UserWorkElement[][];
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Solution = number[][];

export interface UserBoard {
	difficulty: Difficulty;
	solution: Solution;
	problem: Solution; // 0s are empty

	work: UserWork;
	moves: EditAction[];
}

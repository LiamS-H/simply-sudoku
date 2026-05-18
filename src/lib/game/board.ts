import type { EditAction, SudokuValInput } from './action';

export interface UserWorkElement {
	val: SudokuValInput;
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

export function get_empty_work_cell(): UserWorkElement {
	return {
		1: false,
		2: false,
		3: false,
		4: false,
		5: false,
		6: false,
		7: false,
		8: false,
		9: false,
		val: 0
	};
}

export function get_empty_work(): UserWork {
	const rows = [];
	for (let y = 0; y < 9; y++) {
		const row: UserWorkElement[] = [];
		for (let x = 0; x < 9; x++) {
			row.push(get_empty_work_cell());
		}
		rows.push(row);
	}
	return { rows };
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'] as const;

export type Solution = number[][];

export interface UserBoard {
	difficulty: Difficulty;
	solution: Solution;
	problem: Solution; // 0s are empty

	work: UserWork;
	moves: EditAction[];
}

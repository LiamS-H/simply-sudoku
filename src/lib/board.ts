export interface UserWorkElement {
	ele: number;
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

export type UserWorkRow = [
	UserWorkElement,
	UserWorkElement,
	UserWorkElement,
	UserWorkElement,
	UserWorkElement,
	UserWorkElement,
	UserWorkElement,
	UserWorkElement,
	UserWorkElement
];
export interface UserWork {
	rows: UserWorkRow;
}

export interface UserBoard {
	solution: Solution;
	problem: Solution; // 0s are empty

	work: UserWork;
}

export type SolutionRow = [number, number, number, number, number, number, number, number, number];
export type Solution = [
	SolutionRow,
	SolutionRow,
	SolutionRow,
	SolutionRow,
	SolutionRow,
	SolutionRow,
	SolutionRow,
	SolutionRow,
	SolutionRow
];

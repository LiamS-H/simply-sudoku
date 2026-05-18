import type { UserWork, UserWorkElement } from './board';

export type SudokuValInput = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0;

export type SudokuPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type EditAction =
	| {
			type: 's';
			row: SudokuPosition;
			col: SudokuPosition;
			val: SudokuValInput;
			prev: SudokuValInput;
	  }
	| {
			type: 'a';
			row: SudokuPosition;
			col: SudokuPosition;
			val: Exclude<SudokuValInput, 0>;
	  }
	| {
			type: 'c';
			work: UserWork;
	  }
	| {
			type: 'r';
			row: SudokuPosition;
			col: SudokuPosition;
			prev: UserWorkElement;
	  };

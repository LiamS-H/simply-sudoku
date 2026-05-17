export type SudokuValInput = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0;

export type SudokuPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface EditAction {
	type: 's' | 'a';
	row: SudokuPosition;
	col: SudokuPosition;
	val: SudokuValInput;
}

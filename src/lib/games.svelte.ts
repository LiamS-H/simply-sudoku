import type { Difficulty, UserBoard } from './game/board';

export type SavedGames = Record<Difficulty, UserBoard | null>;

function get_empty_games(): SavedGames {
	return { Easy: null, Medium: null, Hard: null };
}

function get_saved_games() {
	const saved = localStorage.getItem('games');
	if (!saved) {
		const games = get_empty_games();
		localStorage.setItem('games', JSON.stringify(games));
		return games;
	}
	try {
		return JSON.parse(saved) as SavedGames;
	} catch {
		const games = get_empty_games();
		localStorage.setItem('games', JSON.stringify(games));
		return games;
	}
}

class GamesManager {
	#games = $state(get_saved_games());

	get(difficulty: Difficulty) {
		return this.#games[difficulty];
	}

	save(difficulty: Difficulty, game: UserBoard | null): void {
		this.#games[difficulty] = game;
		localStorage.setItem('games', JSON.stringify(this.#games));
	}
}

export const games = new GamesManager();

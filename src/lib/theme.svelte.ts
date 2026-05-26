export type Theme = (typeof THEMES)[number];

const DEFAULT_THEME: Theme = 'forest';

export const THEMES = ['forest', 'rainbow', 'midnight', 'autumn'] as const;

class ThemeManager {
	#current: Theme = $state((localStorage.getItem('theme') as Theme) || DEFAULT_THEME);

	get current() {
		return this.#current;
	}

	set(newTheme: Theme) {
		this.#current = newTheme;
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', newTheme);
		}
	}

	next() {
		const next = (THEMES.indexOf(this.#current) + 1) % THEMES.length;

		console.log(THEMES[next]);
		this.set(THEMES[next]);
	}
}

export const theme = new ThemeManager();

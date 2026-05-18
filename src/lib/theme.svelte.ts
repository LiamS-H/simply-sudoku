export type Theme = 'forest' | 'rainbow';

const DEFAULT_THEME: Theme = 'forest';

export const THEMES: Theme[] = ['forest', 'rainbow'] as const;

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
}

export const theme = new ThemeManager();

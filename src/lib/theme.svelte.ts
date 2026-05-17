export type Theme = 'forest' | 'rainbow';

const DEFAULT_THEME: Theme = 'forest';

export const THEMES: Theme[] = ['forest', 'rainbow'] as const;

class ThemeManager {
	#current: Theme | null = $state(
		typeof window !== 'undefined'
			? (localStorage.getItem('app-theme') as Theme) || DEFAULT_THEME
			: null
	);

	get current() {
		return this.#current;
	}

	set(newTheme: Theme) {
		this.#current = newTheme;
		if (typeof window !== 'undefined') {
			localStorage.setItem('app-theme', newTheme);
		}
	}
}

export const theme = new ThemeManager();

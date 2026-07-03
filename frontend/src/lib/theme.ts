const THEME_KEY = 'expense-tracker.theme';

export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}

/** Call once before render so there's no light-mode flash. */
export function initTheme(): Theme {
  const theme = getTheme();
  document.documentElement.classList.toggle('dark', theme === 'dark');
  return theme;
}

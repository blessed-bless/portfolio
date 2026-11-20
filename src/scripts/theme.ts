const STORAGE_KEY = 'portfolio-theme';

export type ThemeMode = 'dark' | 'light';

export function readStoredTheme(): ThemeMode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'dark' || value === 'light') return value;
  } catch {
    return null;
  }
  return null;
}

export function systemTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveInitialTheme(): ThemeMode {
  return readStoredTheme() ?? systemTheme();
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode =
    document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

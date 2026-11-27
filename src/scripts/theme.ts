const STORAGE_KEY = 'portfolio-theme';

export type ThemeMode = 'dark' | 'light';

const THEME_COLORS: Record<ThemeMode, string> = {
  dark: '#0d0b12',
  light: '#f4f0fa',
};

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

function paintThemeColor(mode: ThemeMode): void {
  const el = document.querySelector('[data-theme-color]');
  if (el) el.setAttribute('content', THEME_COLORS[mode]);
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
  paintThemeColor(mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveInitialTheme(): ThemeMode {
  return readStoredTheme() ?? 'dark';
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode =
    document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

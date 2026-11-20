import { en } from './en';
import { ru } from './ru';
import type { Locale, UiDict } from './types';

export type { Locale, UiDict };

export const locales: Locale[] = ['ru', 'en'];
export const defaultLocale: Locale = 'ru';

const dictionaries: Record<Locale, UiDict> = { ru, en };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'ru' || value === 'en';
}

export function ui(locale: string | undefined | null): UiDict {
  return dictionaries[isLocale(locale) ? locale : defaultLocale];
}

/** Path without locale prefix, always with leading slash. */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en' || pathname === '/en/') return '/';
  if (pathname.startsWith('/en/')) {
    const rest = pathname.slice(4);
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

/** Build a localized path. `path` is locale-free (`/work/fleetkit/`). */
export function localizedPath(locale: Locale, path = '/'): string {
  const bare = path.startsWith('/') ? path : `/${path}`;
  const normalized = bare === '' ? '/' : bare;
  if (locale === defaultLocale) return normalized;
  if (normalized === '/') return '/en/';
  return `/en${normalized}`.replace(/\/{2,}/g, '/');
}

/** Paths that exist only in RU (no /en twin). Locale switch falls back to EN home. */
const ruOnlyRoots = new Set(['/notes', '/system', '/404']);

export function hasLocaleTwin(pathname: string, locale: Locale): boolean {
  if (locale === 'ru') return true;
  const bare = stripLocalePrefix(pathname).replace(/\/$/, '') || '/';
  if (bare === '/') return true;
  const root = `/${bare.split('/').filter(Boolean)[0] ?? ''}`;
  return !ruOnlyRoots.has(root);
}

export function switchLocalePath(currentPathname: string, nextLocale: Locale): string {
  const bare = stripLocalePrefix(currentPathname);
  if (nextLocale === 'en' && !hasLocaleTwin(bare, 'en')) {
    return localizedPath('en', '/');
  }
  return localizedPath(nextLocale, bare.endsWith('/') || bare.includes('#') || bare.includes('?') ? bare : `${bare}/`);
}

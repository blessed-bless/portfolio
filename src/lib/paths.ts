/** Normalize internal paths for trailingSlash: 'always'. */
export function withTrailingSlash(path: string): string {
  if (!path || path === '/') return '/';
  if (path.startsWith('/#') || path.startsWith('http') || path.startsWith('mailto:')) return path;
  const [pathname, hash = ''] = path.split('#');
  const [bare, query = ''] = pathname.split('?');
  const withSlash = bare.endsWith('/') ? bare : `${bare}/`;
  return `${withSlash}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

export function coverPublicUrl(assetPath: string, theme: 'dark' | 'light' = 'dark'): string {
  const match = assetPath.match(/covers\/([^/]+)\.(svg|png|jpe?g|webp)$/i);
  if (!match) throw new Error(`Unexpected cover path: ${assetPath}`);
  const [, name, ext] = match;
  const file = `${name}.${ext.toLowerCase()}`;
  return theme === 'light' ? `/covers/light/${file}` : `/covers/${file}`;
}

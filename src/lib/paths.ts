/** Normalize internal paths for trailingSlash: 'always'. */
export function withTrailingSlash(path: string): string {
  if (!path || path === '/') return '/';
  if (path.startsWith('/#') || path.startsWith('http') || path.startsWith('mailto:')) return path;
  const [pathname, hash = ''] = path.split('#');
  const [bare, query = ''] = pathname.split('?');
  const withSlash = bare.endsWith('/') ? bare : `${bare}/`;
  return `${withSlash}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

export function coverPublicUrl(assetPath: string): string {
  const match = assetPath.match(/covers\/([^/]+)\.svg$/);
  if (!match) throw new Error(`Unexpected cover path: ${assetPath}`);
  return `/covers/${match[1]}.svg`;
}

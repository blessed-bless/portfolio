const covers = import.meta.glob<string>('../assets/covers/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function workCover(path: string): string {
  const match = path.match(/(?:^|\/)(assets\/covers\/[^/]+\.svg)$/);
  const key = match ? `../${match[1]}` : path.replace(/^(\.\.\/)+/, '../');
  const cover = covers[key];
  if (!cover) throw new Error(`Work cover not found: ${path}`);
  return cover;
}

/** Inject number + title into a cover SVG (for OG) at the former glyph seats. */
export function workCoverLabeled(
  path: string,
  options: { number: string; title: string },
): string {
  const base = workCover(path);
  const number = escapeXml(options.number);
  const title = escapeXml(options.title);
  const label = `
  <text x="100" y="144" fill="currentColor" font-family="Unbounded, Onest, system-ui, sans-serif" font-size="42" font-weight="650" letter-spacing="-0.02em">${number}</text>
  <text x="206" y="144" fill="var(--cover-ink, #E9E3FF)" font-family="Unbounded, Onest, system-ui, sans-serif" font-size="42" font-weight="650" letter-spacing="-0.02em">${title}</text>`;
  return base.replace(/<\/svg>\s*$/i, `${label}\n</svg>`);
}

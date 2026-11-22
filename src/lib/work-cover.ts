import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withOgFonts } from './og-fonts';

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

function rasterMime(file: string): string {
  if (/\.png$/i.test(file)) return 'image/png';
  if (/\.webp$/i.test(file)) return 'image/webp';
  return 'image/jpeg';
}

function rasterCoverSvg(path: string): string {
  const match = path.match(/covers\/([^/]+\.(png|jpe?g|webp))$/i);
  if (!match) throw new Error(`Unexpected raster cover path: ${path}`);
  const file = match[1];
  const abs = join(process.cwd(), 'src', 'assets', 'covers', file);
  const bytes = readFileSync(abs);
  const href = `data:${rasterMime(file)};base64,${bytes.toString('base64')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="project-cover" width="1600" height="1000" viewBox="0 0 1600 1000" color="var(--cover-line, #A78BFA)" focusable="false" aria-hidden="true">
  <rect width="1600" height="1000" fill="var(--cover-bg, #16131F)"/>
  <image href="${href}" width="1600" height="1000" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
}

export function workCover(path: string): string {
  if (/\.(png|jpe?g|webp)$/i.test(path)) {
    return rasterCoverSvg(path);
  }
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
  <text x="100" y="144" fill="currentColor" font-family="Unbounded, Onest, sans-serif" font-size="42" font-weight="650" letter-spacing="-0.02em">${number}</text>
  <text x="206" y="144" fill="var(--cover-ink, #E9E3FF)" font-family="Unbounded, Onest, sans-serif" font-size="42" font-weight="650" letter-spacing="-0.02em">${title}</text>`;
  return withOgFonts(base.replace(/<\/svg>\s*$/i, `${label}\n</svg>`));
}

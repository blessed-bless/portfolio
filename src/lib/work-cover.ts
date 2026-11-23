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

/** Match the case label drawn over the cover in ProjectCover. */
export function workCoverLabeled(
  path: string,
  options: { number: string; title: string },
): string {
  const base = workCover(path);
  const number = escapeXml(options.number);
  const title = escapeXml(options.title);
  const label = `
  <text x="100" y="144" font-family="Unbounded, Onest, sans-serif" font-size="42" font-weight="700" letter-spacing="-0.84" xml:space="preserve"><tspan fill="currentColor">${number} · </tspan><tspan fill="var(--cover-ink, #E9E3FF)">${title}</tspan></text>`;
  return withOgFonts(base.replace(/<\/svg>\s*$/i, `${label}\n</svg>`));
}

/** Frame a 1600×1000 cover into the standard OG 1200×630 canvas (center slice). */
export function workCoverAsOg(labeledSvg: string): string {
  const inner = labeledSvg
    .replace(/^<\?xml[^>]*>\s*/i, '')
    .replace(/<svg\b[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');
  return withOgFonts(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <svg width="1200" height="630" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    ${inner}
  </svg>
</svg>`);
}

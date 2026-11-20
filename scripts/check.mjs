import { spawnSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const CYRILLIC = /[\u0400-\u04FF]/;
const SKIP_ATTRS = new Set(['href', 'src', 'srcset', 'content', 'datetime', 'data-projects']);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function stripNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function visibleText(html) {
  const cleaned = stripNoise(html);
  const withoutTags = cleaned.replace(/<[^>]+>/g, ' ');
  return withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectInternalHrefs(html) {
  const hrefs = [];
  // Only in-page anchors — skip hreflang / rel=author / icon links in <head>.
  const re = /<a\b[^>]*\bhref=(["'])(.*?)\1/gi;
  let match;
  while ((match = re.exec(html))) {
    const href = match[2];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (/^https?:\/\//i.test(href) || href.startsWith('//')) continue;
    hrefs.push(href.split('#')[0].split('?')[0]);
  }
  return hrefs;
}

async function pathExists(urlPath) {
  const clean = urlPath.replace(/^\//, '').replace(/\/$/, '');
  const candidates = clean
    ? [
        path.join(dist, clean, 'index.html'),
        path.join(dist, `${clean}.html`),
        path.join(dist, clean),
      ]
    : [path.join(dist, 'index.html')];

  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile() || info.isDirectory()) return true;
    } catch {
      // try next
    }
  }
  return false;
}

console.log('→ build');
run('npm', ['run', 'build']);

const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
const enFiles = htmlFiles.filter((file) => {
  const rel = path.relative(dist, file).split(path.sep).join('/');
  return rel === 'en/index.html' || rel.startsWith('en/');
});

const cyrillicHits = [];
for (const file of enFiles) {
  const html = await readFile(file, 'utf8');
  const text = visibleText(html);
  if (CYRILLIC.test(text)) {
    const around = text.slice(Math.max(0, text.search(CYRILLIC) - 24), text.search(CYRILLIC) + 40);
    cyrillicHits.push({ file: path.relative(dist, file), kind: 'text', around });
  }

  const attrRe = /\b(?:alt|aria-label|title|aria-labelledby)=(["'])(.*?)\1/gi;
  let attrMatch;
  while ((attrMatch = attrRe.exec(html))) {
    if (!CYRILLIC.test(attrMatch[2])) continue;
    cyrillicHits.push({
      file: path.relative(dist, file),
      kind: 'attr',
      around: attrMatch[0].slice(0, 80),
    });
  }

  // Inline SVG text nodes
  const svgTextRe = /<text\b[^>]*>([\s\S]*?)<\/text>/gi;
  let svgMatch;
  while ((svgMatch = svgTextRe.exec(html))) {
    if (!CYRILLIC.test(svgMatch[1])) continue;
    cyrillicHits.push({
      file: path.relative(dist, file),
      kind: 'svg-text',
      around: svgMatch[1].slice(0, 60),
    });
  }
}

// Cover SVGs referenced from EN pages (and public covers in dist)
const coverDir = path.join(dist, 'covers');
try {
  const coverFiles = (await walk(coverDir)).filter((f) => f.endsWith('.svg'));
  for (const file of coverFiles) {
    const svg = await readFile(file, 'utf8');
    const textNodes = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)];
    for (const match of textNodes) {
      if (!CYRILLIC.test(match[1])) continue;
      cyrillicHits.push({
        file: path.relative(dist, file),
        kind: 'cover-svg',
        around: match[1].slice(0, 60),
      });
    }
    const labels = [...svg.matchAll(/\baria-label=(["'])(.*?)\1/gi)];
    for (const match of labels) {
      if (!CYRILLIC.test(match[2])) continue;
      cyrillicHits.push({
        file: path.relative(dist, file),
        kind: 'cover-aria',
        around: match[2].slice(0, 60),
      });
    }
  }
} catch {
  // no covers dir
}

if (cyrillicHits.length) {
  console.error('\nCyrillic found in /en/* or cover SVGs:');
  for (const hit of cyrillicHits) {
    console.error(`- ${hit.file} [${hit.kind}]: “…${hit.around}…”`);
  }
  process.exit(1);
}
console.log(`✓ no Cyrillic in ${enFiles.length} EN pages (+ cover SVGs)`);

const broken = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const hrefs = collectInternalHrefs(html);
  for (const href of hrefs) {
    if (href.endsWith('.xml') || href.endsWith('.txt') || href.endsWith('.webmanifest') || href.endsWith('.svg') || href.endsWith('.png') || href.endsWith('.ico')) {
      const asset = path.join(dist, href.replace(/^\//, ''));
      try {
        await stat(asset);
      } catch {
        broken.push({ from: path.relative(dist, file), href });
      }
      continue;
    }
    if (!(await pathExists(href))) {
      broken.push({ from: path.relative(dist, file), href });
    }
  }
}

if (broken.length) {
  console.error('\nBroken internal links:');
  for (const item of broken.slice(0, 40)) {
    console.error(`- ${item.from} → ${item.href}`);
  }
  if (broken.length > 40) console.error(`…and ${broken.length - 40} more`);
  process.exit(1);
}

console.log(`✓ internal links ok across ${htmlFiles.length} pages`);
console.log('check passed');

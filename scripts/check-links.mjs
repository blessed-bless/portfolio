import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = path.resolve('dist');
const roots = new Set();

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!/\.(html|xml|txt|svg)$/i.test(entry.name)) continue;
    const rel = path.relative(dist, full).split(path.sep).join('/');
    roots.add(`/${rel.replace(/index\.html$/i, '').replace(/\.html$/i, '')}`);
    if (rel.endsWith('index.html')) {
      roots.add(`/${path.dirname(rel).replace(/\\/g, '/')}/`.replace(/\/\.\//, '/'));
    }
  }
}

function normalize(href) {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) return null;
  if (href.startsWith('data:') || href.startsWith('javascript:')) return null;
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return '/';
  return clean.endsWith('/') ? clean : clean;
}

function exists(localPath) {
  const variants = new Set([
    localPath,
    localPath.endsWith('/') ? localPath.slice(0, -1) : `${localPath}/`,
    localPath.replace(/\/$/, ''),
  ]);
  for (const v of variants) {
    if (roots.has(v)) return true;
    if (roots.has(`${v}/index.html`)) return true;
    if (roots.has(`${v}.html`)) return true;
    if (roots.has(v.replace(/^\//, ''))) return true;
  }
  const fileCandidate = path.join(dist, localPath.replace(/^\//, ''));
  return false;
}

async function fileExists(localPath) {
  const rel = localPath.replace(/^\//, '');
  const candidates = [
    path.join(dist, rel),
    path.join(dist, rel, 'index.html'),
    path.join(dist, `${rel}.html`),
    path.join(dist, `${rel}.svg`),
    path.join(dist, `${rel}.xml`),
    path.join(dist, `${rel}.txt`),
    path.join(dist, `${rel}.png`),
    path.join(dist, `${rel}.ico`),
  ];
  const { access } = await import('node:fs/promises');
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return true;
    } catch {
      // continue
    }
  }
  return exists(localPath);
}

await walk(dist);

const htmlFiles = [];
async function collectHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectHtml(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await collectHtml(dist);

const broken = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const hrefs = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map((m) => m[1]);
  for (const href of hrefs) {
    const local = normalize(href);
    if (!local) continue;
    if (!(await fileExists(local))) {
      broken.push({ file: path.relative(dist, file), href });
    }
  }
}

if (broken.length) {
  console.error(`Broken links: ${broken.length}`);
  for (const item of broken.slice(0, 50)) {
    console.error(`- ${item.file}: ${item.href}`);
  }
  process.exit(1);
}

console.log(`OK: checked ${htmlFiles.length} HTML files, no broken local links.`);
console.log(`Pages: ${[...roots].filter((r) => r.endsWith('/') || !r.includes('.')).slice(0, 20).join(', ')}`);
void pathToFileURL;

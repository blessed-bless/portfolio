import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

async function checkFixture(t, href) {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const scripts = path.join(root, 'scripts');
  const about = path.join(root, 'dist', 'en', 'about');
  const work = path.join(root, 'dist', 'en', 'work');
  await Promise.all([scripts, about, work].map((dir) => mkdir(dir, { recursive: true })));

  const checker = path.join(scripts, 'check.mjs');
  await Promise.all([
    copyFile(new URL('./check.mjs', import.meta.url), checker),
    writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { build: 'node --version' } })),
    writeFile(path.join(about, 'index.html'), `<a href="${href}">Browse work</a>`),
    writeFile(path.join(work, 'index.html'), '<h1 id="projects">Projects</h1>'),
  ]);

  const check = spawnSync(process.execPath, [checker], { cwd: root, encoding: 'utf8' });
  if (check.error) throw check.error;
  return check;
}

test('accepts a relative link with a query and fragment from a nested page', async (t) => {
  const check = await checkFixture(t, '../work/?source=about#projects');
  assert.equal(check.status, 0, check.stdout + check.stderr);
  assert.match(check.stdout, /check passed/);
});

test('reports the source page and original href for a missing relative target', async (t) => {
  const href = '../missing-page/?source=about#projects';
  const check = await checkFixture(t, href);
  assert.equal(check.status, 1, check.stdout + check.stderr);
  assert.ok(check.stderr.includes(`- en/about/index.html → ${href}`), check.stderr);
});

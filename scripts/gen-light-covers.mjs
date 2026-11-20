import fs from 'node:fs';
import path from 'node:path';

const dir = 'public/covers';
const lightDir = path.join(dir, 'light');
fs.mkdirSync(lightDir, { recursive: true });

for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.svg'))) {
  const svg = fs.readFileSync(path.join(dir, file), 'utf8');
  const light = svg
    .replaceAll('#16131F', '#EDE5FA')
    .replaceAll('#A78BFA', '#6D28D9')
    .replaceAll('#E9E3FF', '#32185C')
    .replace(/var\(--cover-bg,\s*#[0-9A-Fa-f]{6}\)/g, 'var(--cover-bg, #EDE5FA)')
    .replace(/var\(--cover-line,\s*#[0-9A-Fa-f]{6}\)/g, 'var(--cover-line, #6D28D9)')
    .replace(/var\(--cover-ink,\s*#[0-9A-Fa-f]{6}\)/g, 'var(--cover-ink, #32185C)');
  fs.writeFileSync(path.join(lightDir, file), light);
  console.log(file);
}

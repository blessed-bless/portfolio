import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const src = path.join(root, 'public/brand/app-icon.svg');
const svg = fs.readFileSync(src);

fs.mkdirSync(path.join(root, 'public/icons'), { recursive: true });
fs.copyFileSync(
  path.join(root, 'public/brand/favicon.svg'),
  path.join(root, 'public/favicon.svg'),
);

const targets = [
  { size: 32, out: 'public/favicon-32.png' },
  { size: 180, out: 'public/apple-touch-icon.png' },
  { size: 192, out: 'public/icons/icon-192.png' },
  { size: 512, out: 'public/icons/icon-512.png' },
];

for (const { size, out } of targets) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  });
  const dest = path.join(root, out);
  fs.writeFileSync(dest, resvg.render().asPng());
  console.log(`${out} (${size}x${size})`);
}

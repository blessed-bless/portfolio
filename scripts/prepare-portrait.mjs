import sharp from 'sharp';
import fs from 'node:fs';

/**
 * Flood-fill near-white from image edges → alpha, then composite onto
 * dark (#1F1A2B) and light lavender plates. Saves one transparent PNG
 * plus themed fallbacks if needed; site uses transparent + CSS plate.
 */
const srcCandidates = ['.tmp-assets/portrait.png'];
// Recover from last opaque export if tmp gone: use attached chat asset
const chatAsset =
  'C:/Users/newsl/.cursor/projects/c-Users-newsl-Projects-portfolio/assets/image-1ad4c35b-ebf3-453d-bae9-151841e873e1.jpg';
const src =
  srcCandidates.find((p) => fs.existsSync(p)) ||
  (fs.existsSync(chatAsset) ? chatAsset : null) ||
  'src/assets/portrait.png';

const dest = 'src/assets/portrait.png';
fs.mkdirSync('src/assets', { recursive: true });

const meta = await sharp(src).metadata();
const width = meta.width;
const height = meta.height;
if (!width || !height) throw new Error('no size');

const targetRatio = 4 / 5;
let cropW = width;
let cropH = Math.round(width / targetRatio);
let left = 0;
let top = 0;
if (cropH > height) {
  cropH = height;
  cropW = Math.round(height * targetRatio);
  left = Math.floor((width - cropW) / 2);
} else {
  top = Math.max(0, Math.floor((height - cropH) * 0.08));
}

const { data, info } = await sharp(src)
  .flatten({ background: '#ffffff' })
  .extract({ left, top, width: cropW, height: cropH })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const w = info.width;
const h = info.height;
const alpha = new Float32Array(w * h);
alpha.fill(1);

const isBg = (i) => {
  const o = i * 4;
  const r = data[o];
  const g = data[o + 1];
  const b = data[o + 2];
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min >= 235 && max - min <= 22;
};

const queue = [];
const seen = new Uint8Array(w * h);
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = y * w + x;
  if (seen[i]) return;
  if (!isBg(i)) return;
  seen[i] = 1;
  queue.push(i);
};

for (let x = 0; x < w; x++) {
  push(x, 0);
  push(x, h - 1);
}
for (let y = 0; y < h; y++) {
  push(0, y);
  push(w - 1, y);
}

while (queue.length) {
  const i = queue.pop();
  alpha[i] = 0;
  const x = i % w;
  const y = (i - x) / w;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}

// Soften matte edge: average alpha with neighbors twice
for (let pass = 0; pass < 2; pass++) {
  const copy = Float32Array.from(alpha);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          s += copy[(y + dy) * w + (x + dx)];
        }
      }
      alpha[i] = s / 9;
    }
  }
}

for (let i = 0; i < w * h; i++) {
  data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, alpha[i])) * 255);
}

const cutout = await sharp(data, {
  raw: { width: w, height: h, channels: 4 },
})
  .png()
  .toBuffer();

await sharp(cutout).png().toFile(dest);
const out = await sharp(dest).metadata();
console.log('wrote', dest, out.width, 'x', out.height, 'from', src);

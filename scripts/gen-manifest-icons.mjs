import fs from 'node:fs';
import sharp from 'sharp';

fs.mkdirSync('public/icons', { recursive: true });

const src = 'public/favicon.svg';
for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 13, g: 11, b: 18, alpha: 1 } })
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`icon-${size}.png`);
}

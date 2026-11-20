import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

const OUT = 'public/work';
fs.mkdirSync(OUT, { recursive: true });

const FRAME = '#2A2438';
const BACK = '#1F1A2B';
const W = 1440;
const H = 900;
const PAD = 48;
const BORDER = 2;

async function frameShot(src, dest) {
  const innerW = W - PAD * 2 - BORDER * 2;
  const innerH = H - PAD * 2 - BORDER * 2;
  const shot = await sharp(src)
    .resize(innerW, innerH, { fit: 'contain', background: BACK })
    .png()
    .toBuffer();

  const frameSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="${PAD}" y="${PAD}" width="${W - PAD * 2}" height="${H - PAD * 2}" ` +
      `fill="none" stroke="${FRAME}" stroke-width="${BORDER}"/></svg>`,
  );

  await sharp({
    create: { width: W, height: H, channels: 3, background: BACK },
  })
    .composite([
      { input: frameSvg, top: 0, left: 0 },
      { input: shot, top: PAD + BORDER, left: PAD + BORDER },
    ])
    .png()
    .toFile(dest);
  console.log('wrote', dest);
}

async function svgCover(slug, title) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <rect width="1440" height="900" fill="${BACK}"/>
  <rect x="48" y="48" width="1344" height="804" fill="none" stroke="${FRAME}" stroke-width="2"/>
  <text x="96" y="160" fill="#F3F1EA" font-family="Georgia, serif" font-size="64">${title}</text>
  <text x="96" y="220" fill="#9A93A8" font-family="ui-monospace, monospace" font-size="22">github.com/blessed-bless/${slug}</text>
</svg>`;
  const dest = path.join(OUT, `${slug}.png`);
  await sharp(Buffer.from(svg)).png().toFile(dest);
  console.log('wrote', dest);
}

const home = homedir();
await frameShot(
  path.join(home, 'repo-style-work/ai-funnel-ecosystem/docs/screenshots/crm.png'),
  path.join(OUT, 'ai-funnel-ecosystem.png'),
);
await frameShot(
  path.join(home, 'repo-style-work/shipcrew/docs/screenshots/ui.png'),
  path.join(OUT, 'shipcrew.png'),
);
await svgCover('fleetkit', 'FleetKit');
await svgCover('crawlnet', 'crawlnet');

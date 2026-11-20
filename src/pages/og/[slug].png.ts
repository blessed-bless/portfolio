import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { getStaticPaths } from './[slug].svg';
import { workCover } from '../../lib/work-cover';

export { getStaticPaths };

export const GET: APIRoute = async ({ props }) => {
  const svg = workCover(props.cover).replace(/var\(--cover-[a-z]+, (#[A-Fa-f0-9]{6})\)/g, '$1');
  const png = await sharp(new TextEncoder().encode(svg))
    .resize(1200, 630, {
      fit: 'contain',
      background: { r: 13, g: 11, b: 18, alpha: 1 },
    })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};

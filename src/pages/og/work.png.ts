import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { buildOgSvg } from '../../lib/og-svg';

export const GET: APIRoute = async () => {
  const svg = buildOgSvg({
    title: 'Работы',
    subtitle: 'Кейсы и проекты',
    eyebrow: 'Портфолио',
  });
  const png = await sharp(new TextEncoder().encode(svg))
    .resize(1200, 630, { fit: 'cover' })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};

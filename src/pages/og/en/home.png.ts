import type { APIRoute } from 'astro';
import { buildOgSvg } from '../../../lib/og-svg';
import { renderOgPng } from '../../../lib/og-render';
import { personJobTitleEn, personNameEn } from '../../../lib/site';

export const GET: APIRoute = async () => {
  const svg = buildOgSvg({
    title: personNameEn,
    subtitle: personJobTitleEn,
    eyebrow: 'Portfolio',
  });
  const png = renderOgPng(svg);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};

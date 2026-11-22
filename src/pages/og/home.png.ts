import type { APIRoute } from 'astro';
import { buildOgSvg } from '../../lib/og-svg';
import { renderOgPng } from '../../lib/og-render';
import { personJobTitle, personName } from '../../lib/site';

export const GET: APIRoute = async () => {
  const svg = buildOgSvg({
    title: personName,
    subtitle: personJobTitle,
    eyebrow: 'Портфолио',
  });
  const png = renderOgPng(svg);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};

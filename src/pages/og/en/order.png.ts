import type { APIRoute } from 'astro';
import { buildOgSvg } from '../../../lib/og-svg';
import { renderOgPng } from '../../../lib/og-render';

export const GET: APIRoute = () => {
  const svg = buildOgSvg({
    title: 'Start a project',
    subtitle: 'Websites, Telegram bots and online booking',
    eyebrow: 'Bogdan Ketasonx',
  });
  return new Response(new Uint8Array(renderOgPng(svg)), {
    headers: { 'Content-Type': 'image/png' },
  });
};

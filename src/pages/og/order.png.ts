import type { APIRoute } from 'astro';
import { buildOgSvg } from '../../lib/og-svg';
import { renderOgPng } from '../../lib/og-render';

export const GET: APIRoute = () => {
  const svg = buildOgSvg({
    title: 'Заказать проект',
    subtitle: 'Сайт, Telegram-бот или онлайн-запись',
    eyebrow: 'Богдан Кетасонкс',
  });
  return new Response(new Uint8Array(renderOgPng(svg)), {
    headers: { 'Content-Type': 'image/png' },
  });
};

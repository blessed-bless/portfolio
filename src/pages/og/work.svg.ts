import type { APIRoute } from 'astro';
import { buildOgSvg } from '../../lib/og-svg';

export const GET: APIRoute = () =>
  new Response(
    buildOgSvg({
      title: 'Работы',
      subtitle: 'Кейсы и проекты',
      eyebrow: 'Богдан',
    }),
    {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    },
  );

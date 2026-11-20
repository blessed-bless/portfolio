import type { APIRoute } from 'astro';
import { buildOgSvg } from '../../lib/og-svg';
import { personJobTitle, personName } from '../../lib/site';

export const GET: APIRoute = () =>
  new Response(
    buildOgSvg({
      title: personName,
      subtitle: personJobTitle,
      eyebrow: 'Портфолио',
    }),
    {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    },
  );

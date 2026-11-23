import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/site';

export const GET: APIRoute = () => {
  const sitemap = new URL('/sitemap.xml', siteUrl).href;
  const body = `User-agent: *
Allow: /

# humans.txt — https://dubstepmolitva.ru/humans.txt
Sitemap: ${sitemap}
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

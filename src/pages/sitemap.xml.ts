import type { APIRoute } from 'astro';
import { getPublishedNotes, noteSlug } from '../lib/notes';
import { siteUrl } from '../lib/site';
import { getCaseEntries } from '../lib/work';

function urlEntry(path: string, lastmod?: Date): string {
  const loc = new URL(path, siteUrl).href;
  const stamp = lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${stamp}\n  </url>`;
}

export const GET: APIRoute = async () => {
  const cases = await getCaseEntries();
  const notes = await getPublishedNotes();

  const urls = [
    urlEntry('/'),
    urlEntry('/work'),
    urlEntry('/about'),
    ...cases.map((entry) => urlEntry(`/work/${entry.data.slug}`)),
    ...(notes.length ? [urlEntry('/notes')] : []),
    ...notes.map((entry) =>
      urlEntry(`/notes/${noteSlug(entry)}`, entry.data.updatedDate ?? entry.data.pubDate),
    ),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

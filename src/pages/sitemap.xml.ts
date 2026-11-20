import type { APIRoute } from 'astro';
import { getPublishedNotes, noteSlug } from '../lib/notes';
import { withTrailingSlash } from '../lib/paths';
import { siteUrl } from '../lib/site';
import { getCaseEntries } from '../lib/work';
import { localizedPath } from '../i18n';

function urlEntry(path: string, lastmod?: Date): string {
  const loc = new URL(withTrailingSlash(path), siteUrl).href;
  const stamp = lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${stamp}\n  </url>`;
}

export const GET: APIRoute = async () => {
  const casesRu = await getCaseEntries('ru');
  const casesEn = await getCaseEntries('en');
  const notes = await getPublishedNotes();

  const urls = [
    urlEntry('/'),
    urlEntry('/en/'),
    urlEntry('/work/'),
    urlEntry('/en/work/'),
    urlEntry('/about/'),
    urlEntry('/en/about/'),
    urlEntry('/uses/'),
    urlEntry('/en/uses/'),
    ...casesRu.map((entry) => urlEntry(localizedPath('ru', `/work/${entry.data.slug}/`))),
    ...casesEn.map((entry) => urlEntry(localizedPath('en', `/work/${entry.data.slug}/`))),
    ...(notes.length ? [urlEntry('/notes/')] : []),
    ...notes.map((entry) =>
      urlEntry(`/notes/${noteSlug(entry)}/`, entry.data.updatedDate ?? entry.data.pubDate),
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

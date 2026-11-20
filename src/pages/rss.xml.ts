import type { APIRoute } from 'astro';
import { getPublishedNotes, noteSlug } from '../lib/notes';
import { siteName, siteUrl } from '../lib/site';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export const GET: APIRoute = async () => {
  const notes = await getPublishedNotes();

  const items = notes
    .map((note) => {
      const link = new URL(`/notes/${noteSlug(note)}/`, siteUrl).href;
      return `    <item>
      <title>${escapeXml(note.data.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${note.data.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(note.data.description)}</description>
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${siteName} — заметки`)}</title>
    <link>${new URL('/notes/', siteUrl).href}</link>
    <description>Заметки о разработке и продуктах</description>
    <language>ru</language>
${items ? `${items}\n` : ''}  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      ...(notes.length === 0 ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
};

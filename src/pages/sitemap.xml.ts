import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { getPublishedNotes, noteSlug, type NoteEntry } from '../lib/notes';
import { withTrailingSlash } from '../lib/paths';
import { siteUrl } from '../lib/site';
import { getCaseEntries, type WorkEntry } from '../lib/work';
import { localizedPath } from '../i18n';

/** Last commit of the file that owns the URL. No date when git has no history for it. */
function lastCommitDate(filePath: string): Date | undefined {
  if (!existsSync(filePath)) return undefined;
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
      encoding: 'utf8',
    }).trim();
    if (!iso) return undefined;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

function urlEntry(path: string, sourceFile: string): string {
  const loc = new URL(withTrailingSlash(path), siteUrl).href;
  const lastmod = lastCommitDate(sourceFile);
  const stamp = lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${stamp}\n  </url>`;
}

function workSource(entry: WorkEntry): string {
  const mdx = `src/content/work/${entry.id}.mdx`;
  if (existsSync(mdx)) return mdx;
  return `src/content/work/${entry.id}.md`;
}

function noteSource(entry: NoteEntry): string {
  const id = entry.id.replace(/\\/g, '/');
  if (/\.(md|mdx)$/i.test(id)) return `src/content/notes/${id}`;
  const mdx = `src/content/notes/${id}.mdx`;
  if (existsSync(mdx)) return mdx;
  return `src/content/notes/${id}.md`;
}

export const GET: APIRoute = async () => {
  const casesRu = await getCaseEntries('ru');
  const casesEn = await getCaseEntries('en');
  const notes = await getPublishedNotes();

  // /system/ is always noindex. /notes/ is noindex until a note is published.
  const urls = [
    urlEntry('/', 'src/pages/index.astro'),
    urlEntry('/en/', 'src/pages/en/index.astro'),
    urlEntry('/order/', 'src/pages/order.astro'),
    urlEntry('/en/order/', 'src/pages/en/order.astro'),
    urlEntry('/work/', 'src/pages/work/index.astro'),
    urlEntry('/en/work/', 'src/pages/en/work/index.astro'),
    urlEntry('/about/', 'src/pages/about.astro'),
    urlEntry('/en/about/', 'src/pages/en/about.astro'),
    urlEntry('/uses/', 'src/pages/uses.astro'),
    urlEntry('/en/uses/', 'src/pages/en/uses.astro'),
    urlEntry('/privacy/', 'src/pages/privacy.astro'),
    urlEntry('/en/privacy/', 'src/pages/en/privacy.astro'),
    ...casesRu.map((entry) =>
      urlEntry(localizedPath('ru', `/work/${entry.data.slug}/`), workSource(entry)),
    ),
    ...casesEn.map((entry) =>
      urlEntry(localizedPath('en', `/work/${entry.data.slug}/`), workSource(entry)),
    ),
    ...(notes.length
      ? [
          urlEntry('/notes/', 'src/pages/notes/index.astro'),
          ...notes.map((entry) => urlEntry(`/notes/${noteSlug(entry)}/`, noteSource(entry))),
        ]
      : []),
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

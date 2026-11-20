import type { APIRoute } from 'astro';
import { getCaseEntries } from '../../lib/work';
import { workCoverLabeled } from '../../lib/work-cover';

export async function getStaticPaths() {
  const cases = await getCaseEntries('ru');
  return cases.map(({ data }, index) => ({
    params: { slug: data.slug },
    props: {
      cover: data.cover,
      title: data.title,
      number: String(index + 1).padStart(2, '0'),
    },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(
    workCoverLabeled(props.cover, { number: props.number, title: props.title }),
    {
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
    },
  );

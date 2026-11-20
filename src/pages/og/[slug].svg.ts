import type { APIRoute } from 'astro';
import { getCaseEntries } from '../../lib/work';
import { workCover } from '../../lib/work-cover';

export async function getStaticPaths() {
  const cases = await getCaseEntries();
  return cases.map(({ data }) => ({
    params: { slug: data.slug },
    props: { cover: data.cover },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(workCover(props.cover), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });

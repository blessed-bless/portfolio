import type { APIRoute } from 'astro';
import sharp from 'sharp';
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

export const GET: APIRoute = async ({ props }) => {
  const svg = workCoverLabeled(props.cover, {
    number: props.number,
    title: props.title,
  }).replace(/var\(--cover-[a-z]+, (#[A-Fa-f0-9]{6})\)/g, '$1');
  const png = await sharp(new TextEncoder().encode(svg))
    .resize(1200, 630, {
      fit: 'contain',
      background: { r: 13, g: 11, b: 18, alpha: 1 },
    })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};

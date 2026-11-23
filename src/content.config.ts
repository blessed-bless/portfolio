import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const workTag = z.enum(['Python', 'TypeScript', 'JavaScript', 'Bots', 'Infra', 'Web']);
const workStatus = z.enum([
  'в разработке',
  'готов',
  'концепт',
  'in progress',
  'shipped',
  'concept',
]);
const workOrigin = z.enum(['client', 'demo', 'personal']);

const work = defineCollection({
  loader: glob({
    base: './src/content/work',
    pattern: '**/*.{md,mdx}',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    year: z.string(),
    role: z.string(),
    stack: z.array(z.string()).min(1),
    status: workStatus,
    origin: workOrigin.optional(),
    cover: z.string(),
    summary: z.string(),
    links: z
      .object({
        github: z.string().optional(),
        demo: z.string().optional(),
        live: z.string().optional(),
        bot: z.string().optional(),
      })
      .default({}),
    order: z.number(),
    tags: z.array(workTag).default([]),
    hasPage: z.boolean().default(true),
    featured: z.boolean().default(false),
    carousel: z.boolean().default(true),
  }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, notes };

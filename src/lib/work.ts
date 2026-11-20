import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { Project } from './work-types';

export type WorkEntry = CollectionEntry<'work'>;

export function toProject(entry: WorkEntry): Project {
  const data = entry.data;
  return {
    slug: data.slug,
    title: data.title,
    year: data.year,
    role: data.role,
    stack: data.stack.join(' · '),
    stackList: data.stack,
    status: data.status,
    cover: data.cover,
    summary: data.summary,
    links: data.links,
    order: data.order,
    tags: data.tags,
    hasPage: data.hasPage,
    featured: data.featured,
  };
}

export async function getWorkEntries(): Promise<WorkEntry[]> {
  const entries = await getCollection('work');
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/** Projects shown on /work — only real cases with pages. */
export async function getProjects(): Promise<Project[]> {
  const entries = await getCaseEntries();
  return entries.map(toProject);
}

/** Hero carousel: real projects marked for carousel, in catalog order. */
export async function getCarouselProjects(): Promise<Project[]> {
  const entries = await getWorkEntries();
  return entries
    .filter((entry) => entry.data.carousel && entry.data.hasPage)
    .map(toProject);
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const entries = await getCaseEntries();
  const featured = entries.filter((entry) => entry.data.featured).map(toProject);
  if (featured.length) return featured;
  return entries.slice(0, 3).map(toProject);
}

export async function getCaseEntries(): Promise<WorkEntry[]> {
  const entries = await getWorkEntries();
  return entries.filter((entry) => entry.data.hasPage);
}

export async function getWorkEntry(slug: string): Promise<WorkEntry | undefined> {
  const entries = await getWorkEntries();
  return entries.find((entry) => entry.data.slug === slug);
}

export async function renderWork(entry: WorkEntry) {
  return render(entry);
}

export function nextCaseSlug(entries: WorkEntry[], slug: string): string | null {
  const cases = entries.filter((entry) => entry.data.hasPage);
  const index = cases.findIndex((entry) => entry.data.slug === slug);
  if (index < 0 || cases.length < 2) return null;
  const next = cases[(index + 1) % cases.length];
  return next?.data.slug ?? null;
}

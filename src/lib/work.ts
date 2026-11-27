import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n';
import { defaultLocale } from '../i18n';
import type { Project, WorkOrigin } from './work-types';

export type WorkEntry = CollectionEntry<'work'>;

export function workEntryLocale(entry: WorkEntry): Locale {
  return entry.id.startsWith('en/') ? 'en' : 'ru';
}

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
    origin: data.origin,
    cover: data.cover,
    summary: data.summary,
    links: data.links,
    order: data.order,
    tags: data.tags,
    hasPage: data.hasPage,
    featured: data.featured,
  };
}

/** Status alone, or `status · origin` when origin is set. */
export function workStatusLabel(
  status: string,
  origin: WorkOrigin | undefined,
  originLabels: Record<WorkOrigin, string>,
): string {
  if (!origin) return status;
  return `${status} · ${originLabels[origin]}`;
}

export async function getWorkEntries(locale: Locale = defaultLocale): Promise<WorkEntry[]> {
  const entries = await getCollection('work');
  return entries
    .filter((entry) => workEntryLocale(entry) === locale)
    .sort((a, b) => a.data.order - b.data.order);
}

/** Projects shown on /work — only real cases with pages. */
export async function getProjects(locale: Locale = defaultLocale): Promise<Project[]> {
  const entries = await getCaseEntries(locale);
  return entries.map(toProject);
}

/** Hero carousel: real projects marked for carousel, in catalog order. */
export async function getCarouselProjects(locale: Locale = defaultLocale): Promise<Project[]> {
  const entries = await getWorkEntries(locale);
  return entries
    .filter((entry) => entry.data.carousel && entry.data.hasPage)
    .map(toProject);
}

export async function getFeaturedProjects(locale: Locale = defaultLocale): Promise<Project[]> {
  const entries = await getCaseEntries(locale);
  const featured = entries.filter((entry) => entry.data.featured).map(toProject);
  if (featured.length) return featured;
  return entries.slice(0, 3).map(toProject);
}

export async function getCaseEntries(locale: Locale = defaultLocale): Promise<WorkEntry[]> {
  const entries = await getWorkEntries(locale);
  return entries.filter((entry) => entry.data.hasPage);
}

export async function getWorkEntry(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<WorkEntry | undefined> {
  const entries = await getWorkEntries(locale);
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

/** Short cover alt — summary already sits in h1/nearby copy; don't duplicate. */
export function caseCoverAlt(title: string, locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? `Cover for “${title}”` : `Обложка проекта «${title}»`;
}

/** Curated short mids (~60 chars total title). Others derive from summary. */
const CASE_TITLE_MID: Record<'ru' | 'en', Partial<Record<string, string>>> = {
  ru: {
    smena: 'Запись и свободные окна в Telegram',
    'ai-funnel-ecosystem': 'Воронка лидов в Telegram',
    fleetkit: 'Control plane для ботов и воркеров',
    shipcrew: 'Агенты от брифа до prod-бандла',
    priemnaya: 'Запись в шиномонтаж после пропущенного',
    pashot: 'Сайт кафе в Анапе',
  },
  en: {
    smena: 'Barber bookings and free slots in Telegram',
    'ai-funnel-ecosystem': 'Lead funnel and mini-CRM',
    fleetkit: 'Control plane for bots and workers',
    shipcrew: 'Agents from brief to a prod zip',
    ipcheck: 'Network privacy diagnostics',
    priemnaya: 'Tire-shop booking after a missed call',
    gran: 'Barbershop booking on the first screen',
    pashot: 'Cafe site in Anapa',
  },
};

/** Document title from case name + a complete summary clause. Cut on : / — / , — never mid-phrase. */
export function caseDocumentTitle(
  title: string,
  summary: string,
  brand: string,
  options?: { slug?: string; locale?: 'ru' | 'en' },
): string {
  const locale = options?.locale ?? 'ru';
  const curated = options?.slug ? CASE_TITLE_MID[locale][options.slug] : undefined;
  if (curated) return `${title} — ${curated} | ${brand}`;

  const raw = summary.trim().replace(/\s+/g, ' ');

  let mid: string;
  if (raw.includes(':')) {
    mid = (raw.split(':')[0] ?? raw).trim();
  } else if (/\s+[—–]\s+/.test(raw)) {
    mid = (raw.split(/\s+[—–]\s+/)[0] ?? raw).trim();
  } else if (raw.includes(',')) {
    mid = (raw.split(',')[0] ?? raw).trim();
  } else {
    mid = (raw.split(/[.!?]/)[0] ?? raw).trim() || raw;
  }

  // Drop arrow chains so titles never end with «→» or a half role list.
  if (mid.includes('→')) {
    mid = mid.replace(/\s+\S+\s*→[\s\S]*$/u, '').trim();
  }

  mid = mid.replace(/[:;,–—\-→]+$/u, '').trimEnd();
  return `${title} — ${mid} | ${brand}`;
}

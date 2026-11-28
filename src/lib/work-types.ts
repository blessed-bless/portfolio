export type WorkTag = 'Python' | 'TypeScript' | 'JavaScript' | 'Bots' | 'Infra' | 'Web';

/**
 * Catalogue filters. A case with several tags appears in every matching category.
 * JavaScript and TypeScript do not map on their own.
 */
export const workCategoryTags = {
  sites: ['Web'],
  telegram: ['Bots'],
  backend: ['Python', 'Infra'],
} as const satisfies Record<string, readonly WorkTag[]>;

export type WorkCategoryId = keyof typeof workCategoryTags;

export const workCategoryIds = ['sites', 'telegram', 'backend'] as const;

export function categoriesForTags(tags: readonly WorkTag[]): WorkCategoryId[] {
  return workCategoryIds.filter((id) => workCategoryTags[id].some((tag) => tags.includes(tag)));
}
export type WorkStatus =
  | 'в разработке'
  | 'готов'
  | 'концепт'
  | 'in progress'
  | 'shipped'
  | 'concept';
export type WorkOrigin = 'client' | 'demo' | 'personal';

export type WorkLinks = {
  github?: string;
  demo?: string;
  live?: string;
  bot?: string;
};

/** Shape used by hero carousel and list previews (client-safe). */
export type Project = {
  slug: string;
  title: string;
  year: string;
  role: string;
  stack: string;
  stackList: string[];
  status: WorkStatus;
  origin?: WorkOrigin;
  cover: string;
  summary: string;
  links: WorkLinks;
  order: number;
  tags: WorkTag[];
  hasPage: boolean;
  featured: boolean;
};

export type Project = {
  slug: string;
  title: string;
  year: string;
  stack: string;
  summary: string;
  cover: string;
  hasPage: boolean;
};

export const projects: Project[] = [
  {
    slug: 'priemnaya',
    title: 'Приёмная',
    year: '2025',
    stack: 'Astro · API',
    summary: '{{заполнить}}',
    cover: '/work/priemnaya.svg',
    hasPage: true,
  },
  {
    slug: 'placeholder',
    title: '{{заполнить}}',
    year: '—',
    stack: '—',
    summary: '{{заполнить}}',
    cover: '/work/placeholder.svg',
    hasPage: false,
  },
  {
    slug: 'project-3',
    title: 'Project 3',
    year: '2025',
    stack: 'Python · TG',
    summary: '{{заполнить}}',
    cover: '/work/project-3.svg',
    hasPage: true,
  },
  {
    slug: 'signal-desk',
    title: 'Signal Desk',
    year: '2024',
    stack: 'React · Node',
    summary: '{{заполнить}}',
    cover: '/work/signal-desk.svg',
    hasPage: false,
  },
  {
    slug: 'north-line',
    title: 'North Line',
    year: '2024',
    stack: 'Next · CMS',
    summary: '{{заполнить}}',
    cover: '/work/north-line.svg',
    hasPage: false,
  },
];

export const workPages = projects.filter((project) => project.hasPage);

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

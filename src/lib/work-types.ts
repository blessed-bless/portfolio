export type WorkTag = 'Python' | 'TypeScript' | 'Bots' | 'Infra' | 'Web';
export type WorkStatus = 'в разработке' | 'готов' | 'концепт';

export type WorkLinks = {
  github?: string;
  demo?: string;
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
  cover: string;
  summary: string;
  links: WorkLinks;
  order: number;
  tags: WorkTag[];
  hasPage: boolean;
  featured: boolean;
};

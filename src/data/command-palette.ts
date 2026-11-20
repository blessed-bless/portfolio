import { contactLinks, telegramChannel } from './home';
import { isFilled } from '../lib/fill';
import { resumeHref } from '../lib/site';
import { localizedPath, type Locale, type UiDict } from '../i18n';
import type { Project } from '../lib/work-types';

export type PaletteItemType = 'page' | 'project' | 'action';

export type PaletteItem = {
  id: string;
  type: PaletteItemType;
  title: string;
  hint?: string;
  keywords: string;
  href?: string;
  action?:
    | 'theme'
    | 'copy-email'
    | 'telegram'
    | 'telegram-channel'
    | 'github'
    | 'locale'
    | 'resume'
    | 'less-motion';
};

export function buildPaletteItems(projects: Project[], t: UiDict): PaletteItem[] {
  const locale: Locale = t.locale;

  const pages: PaletteItem[] = [
    {
      id: 'page-home',
      type: 'page',
      title: t.nav.home,
      keywords: 'home главная index',
      href: localizedPath(locale, '/'),
    },
    {
      id: 'page-work',
      type: 'page',
      title: t.nav.work,
      keywords: 'work проекты portfolio cases',
      href: localizedPath(locale, '/work/'),
    },
    {
      id: 'page-about',
      type: 'page',
      title: t.nav.about,
      keywords: 'about обо мне',
      href: localizedPath(locale, '/about/'),
    },
    {
      id: 'page-uses',
      type: 'page',
      title: t.nav.uses,
      keywords: 'uses инструменты setup',
      href: localizedPath(locale, '/uses/'),
    },
    {
      id: 'page-contact',
      type: 'page',
      title: t.nav.contact,
      keywords: 'contact связь email telegram',
      href: `${localizedPath(locale, '/')}#contact`,
    },
  ];

  const projectItems: PaletteItem[] = projects
    .filter((project) => project.hasPage)
    .map((project) => ({
      id: `project-${project.slug}`,
      type: 'project' as const,
      title: project.title,
      hint: project.stack,
      keywords: [project.title, project.slug, project.stack, ...project.tags].join(' '),
      href: localizedPath(locale, `/work/${project.slug}/`),
    }));

  const actions: PaletteItem[] = [
    {
      id: 'action-theme',
      type: 'action',
      title: t.cmdk.theme,
      keywords: 'theme dark light тема',
      action: 'theme',
    },
    {
      id: 'action-less-motion',
      type: 'action',
      title: t.cmdk.lessMotion,
      keywords: 'motion animation perf fps меньше анимаций reduce',
      action: 'less-motion',
    },
  ];

  if (isFilled(contactLinks.email)) {
    actions.push({
      id: 'action-email',
      type: 'action',
      title: t.cmdk.copyEmail,
      hint: contactLinks.email,
      keywords: `email mail почта ${contactLinks.email}`,
      action: 'copy-email',
    });
  }
  if (isFilled(contactLinks.telegram)) {
    actions.push({
      id: 'action-telegram',
      type: 'action',
      title: t.cmdk.openTelegram,
      keywords: 'telegram tg',
      action: 'telegram',
      href: contactLinks.telegram,
    });
  }
  actions.push({
    id: 'action-telegram-channel',
    type: 'action',
    title: t.cmdk.openChannel,
    hint: `@${telegramChannel.handle}`,
    keywords: 'telegram channel канал tg molitva_deploy',
    action: 'telegram-channel',
    href: telegramChannel.href,
  });
  if (isFilled(contactLinks.github)) {
    actions.push({
      id: 'action-github',
      type: 'action',
      title: t.cmdk.openGithub,
      keywords: 'github git',
      action: 'github',
      href: contactLinks.github,
    });
  }

  actions.push({
    id: 'action-locale',
    type: 'action',
    title: t.cmdk.switchLocale,
    keywords: 'language locale en ru english язык',
    action: 'locale',
  });

  if (isFilled(resumeHref)) {
    actions.push({
      id: 'action-resume',
      type: 'action',
      title: t.cmdk.resume,
      keywords: 'resume cv резюме',
      action: 'resume',
      href: resumeHref,
    });
  }

  return [...pages, ...projectItems, ...actions];
}

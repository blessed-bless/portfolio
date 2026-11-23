import { METRIKA_HOSTS, METRIKA_ID } from '../lib/metrika';
import { isTelegramChannelHref } from '../lib/telegram-channel';

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void;
    __metrikaBooted?: boolean;
    /** Set by deferred Metrika init — URL already counted; skip one matching hit. */
    __ymInitUrl?: string;
  }
}

type GoalParams = Record<string, string | number | boolean | undefined>;

const firedGoals = new Set<string>();
let mounted = false;
let caseReadObserver: IntersectionObserver | null = null;
let caseReadCleanup: (() => void) | null = null;

function canTrack(): boolean {
  if (!import.meta.env.PROD) return false;
  if (typeof window === 'undefined') return false;
  if (!METRIKA_HOSTS.has(location.hostname)) return false;
  return true;
}

/** Send a Metrika reachGoal. Safe no-op off production domain. */
export function goal(name: string, params?: GoalParams): void {
  if (!canTrack()) return;
  if (typeof window.ym !== 'function') return;
  window.ym(METRIKA_ID, 'reachGoal', name, params);
}

function tgPlace(el: Element): string {
  if (el.closest('[data-hero]')) return 'hero';
  if (el.closest('[data-nav-panel], [data-site-header]')) return 'menu';
  if (el.closest('[data-case-demo]')) return 'demo';
  if (el.closest('[data-case]')) return 'case';
  if (el.closest('[data-site-footer], [data-contact]')) return 'footer';
  if (el.closest('[data-channel]')) return 'channel';
  if (el.closest('[data-cmdk]')) return 'cmdk';
  return 'other';
}

function isTelegramHref(href: string): boolean {
  return /(?:https?:\/\/)?(?:t\.me|telegram\.me)\//i.test(href);
}

function isGithubHref(href: string): boolean {
  return /(?:https?:\/\/)?(?:www\.)?github\.com\//i.test(href);
}

function onDocumentClick(event: MouseEvent): void {
  if (!canTrack()) return;
  const target = event.target;
  if (!(target instanceof Element)) return;

  const link = target.closest('a');
  if (link?.href) {
    const href = link.href;
    if (isTelegramChannelHref(href) || link.hasAttribute('data-tg-channel')) {
      goal('tg_channel_click', { from: tgPlace(link) });
    } else if (isTelegramHref(href)) {
      goal('tg_click', { from: tgPlace(link) });
    } else if (href.startsWith('mailto:')) {
      goal('email_click');
    } else if (isGithubHref(href)) {
      goal('github_click');
    }
  }

  maybeDemoStart(target);
}

function maybeDemoStart(target: Element): void {
  const heroCta = target.closest<HTMLElement>('[data-demo-start]');
  if (heroCta) {
    const slug = heroCta.dataset.demoStart || 'unknown';
    const from = heroCta.dataset.demoFrom || 'hero';
    const key = `demo_start:${slug}:${from}`;
    if (!firedGoals.has(key)) {
      firedGoals.add(key);
      goal('demo_start', { slug, from });
    }
    return;
  }

  const demo = target.closest<HTMLElement>('[data-case-demo]');
  if (!demo) return;
  const slug = demo.dataset.caseDemo || 'unknown';
  const key = `demo_start:${slug}`;
  if (firedGoals.has(key)) return;
  firedGoals.add(key);
  goal('demo_start', { slug });
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!canTrack()) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  maybeDemoStart(target);
}

function clearCaseRead(): void {
  caseReadCleanup?.();
  caseReadCleanup = null;
  caseReadObserver?.disconnect();
  caseReadObserver = null;
}

function mountCaseRead(): void {
  clearCaseRead();
  if (!canTrack()) return;

  const article = document.querySelector<HTMLElement>('[data-case]');
  if (!article) return;

  const key = `case_read:${location.pathname}`;
  if (firedGoals.has(key)) return;

  const marker = document.createElement('div');
  marker.setAttribute('data-metrika-case-end', '');
  marker.setAttribute('aria-hidden', 'true');
  marker.style.cssText = 'position:absolute;left:0;width:1px;height:1px;pointer-events:none;';

  if (getComputedStyle(article).position === 'static') {
    article.style.position = 'relative';
  }

  const place = (): void => {
    marker.style.top = `${Math.max(0, article.offsetHeight * 0.9)}px`;
  };
  place();
  article.appendChild(marker);

  caseReadObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (firedGoals.has(key)) return;
      firedGoals.add(key);
      goal('case_read');
      clearCaseRead();
    },
    { threshold: 0 },
  );
  caseReadObserver.observe(marker);

  const onResize = (): void => place();
  window.addEventListener('resize', onResize, { passive: true });
  caseReadCleanup = () => {
    window.removeEventListener('resize', onResize);
    marker.remove();
  };
}

function onPageLoad(): void {
  if (!canTrack()) return;
  mountCaseRead();

  if (typeof window.ym !== 'function') return;

  // Deferred init already counted this URL — skip once so VT hits still fire later.
  if (window.__ymInitUrl) {
    const counted = window.__ymInitUrl;
    window.__ymInitUrl = undefined;
    if (location.href === counted) return;
  }

  window.ym(METRIKA_ID, 'hit', location.href, { title: document.title });
}

/** Bind once for the whole SPA session (View Transitions safe). */
export function mountMetrika(): void {
  if (!canTrack() || mounted) return;
  mounted = true;

  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('astro:page-load', onPageLoad);
  document.addEventListener('astro:before-swap', clearCaseRead);
}

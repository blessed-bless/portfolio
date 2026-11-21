import { getLenis } from './lenis-scroll';

let bound = false;
let runId = 0;

function readHashId(): string | null {
  const raw = location.hash.replace(/^#/, '');
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function scrollToElement(target: HTMLElement, immediate: boolean): void {
  const lenis = getLenis();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const instant = immediate || reduced;

  if (lenis) {
    // Lenis already subtracts scroll-margin-top from element targets.
    lenis.scrollTo(target, {
      offset: 0,
      immediate: instant,
      duration: instant ? 0 : 1.05,
    });
    return;
  }

  target.scrollIntoView({
    block: 'start',
    behavior: instant ? 'auto' : 'smooth',
  });
}

async function waitFonts(): Promise<void> {
  try {
    if (document.fonts?.status === 'loaded') return;
    await Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((resolve) => window.setTimeout(resolve, 400)),
    ]);
  } catch {
    /* fonts API unavailable */
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function settleLayout(): Promise<void> {
  await waitFonts();
  await nextFrame();
  await nextFrame();
  // Hero carousel / WebGL often resize one tick after mount.
  await new Promise<void>((resolve) => window.setTimeout(resolve, 60));
  await nextFrame();
}

/** Scroll to location.hash once layout (fonts, Lenis, hero) has settled. */
export async function scrollToHash(): Promise<void> {
  const id = readHashId();
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;

  const token = ++runId;
  await settleLayout();
  if (token !== runId) return;

  scrollToElement(target, true);

  // Second pass after late layout shifts (carousel, images, Lenis start).
  await new Promise<void>((resolve) => window.setTimeout(resolve, 140));
  if (token !== runId) return;
  await settleLayout();
  if (token !== runId) return;

  const again = document.getElementById(id);
  if (again) scrollToElement(again, true);
}

function sameDocumentHashLink(anchor: HTMLAnchorElement): string | null {
  let url: URL;
  try {
    url = new URL(anchor.href, location.href);
  } catch {
    return null;
  }
  if (url.origin !== location.origin) return null;
  if (url.pathname !== location.pathname) return null;
  if (!url.hash || url.hash === '#') return null;
  try {
    return decodeURIComponent(url.hash.slice(1));
  } catch {
    return url.hash.slice(1);
  }
}

function onDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const anchor = (event.target as Element | null)?.closest?.('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) return;

  const id = sameDocumentHashLink(anchor);
  if (!id) return;
  if (!document.getElementById(id)) return;

  event.preventDefault();
  const next = `#${encodeURIComponent(id).replace(/%20/g, ' ')}`;
  if (location.hash !== `#${id}` && location.hash !== next) {
    history.pushState(null, '', `#${id}`);
  }
  void scrollToHash();
}

/** Bind same-page hash clicks once. Page-load scroll is driven from boot after Lenis. */
export function mountHashScroll(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('click', onDocumentClick, true);
}

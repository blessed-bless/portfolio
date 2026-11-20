import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ensureScrollTrigger } from './scroll-sync';

gsap.registerPlugin(SplitText);

let bound = false;
let titleTween: gsap.core.Tween | gsap.core.Timeline | null = null;
let splitRef: SplitText | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

function clearTitleAnim(): void {
  titleTween?.kill();
  titleTween = null;
  splitRef?.revert();
  splitRef = null;
}

function animateIncomingTitle(): void {
  clearTitleAnim();
  if (prefersReducedMotion()) return;

  const title = document.querySelector<HTMLElement>('[data-page-title]');
  if (!title) return;

  try {
    splitRef = SplitText.create(title, {
      type: 'lines',
      linesClass: 'page-title-line',
      aria: 'none',
    });
    const lines = splitRef.lines;
    if (!lines.length) {
      clearTitleAnim();
      return;
    }

    gsap.set(lines, { y: 14, opacity: 0 });
    titleTween = gsap.to(lines, {
      y: 0,
      opacity: 1,
      duration: 0.42,
      stagger: 0.05,
      ease: 'power3.out',
      delay: supportsViewTransitions() ? 0.05 : 0,
    });
  } catch {
    clearTitleAnim();
  }
}

function refreshScrollTools(): void {
  try {
    ensureScrollTrigger().refresh();
  } catch {
    /* ScrollTrigger may be unused on this page */
  }
}

function onBeforePreparation(event: Event): void {
  const ev = event as Event & { navigation?: string };
  if (!supportsViewTransitions() && 'preventDefault' in event) {
    // Let Astro fall through to full navigation without custom VT work.
    return;
  }
  void ev;
  clearTitleAnim();
}

function onPageLoad(): void {
  animateIncomingTitle();
  window.requestAnimationFrame(() => {
    refreshScrollTools();
  });
}

/** Bind once — safe across View Transitions. */
export function mountPageTransitions(): void {
  if (bound) return;
  bound = true;

  document.addEventListener('astro:before-preparation', onBeforePreparation);
  document.addEventListener('astro:before-swap', clearTitleAnim);
  document.addEventListener('astro:page-load', onPageLoad);

  // Swallow aborted transitions (rapid mobile taps) — avoid console noise.
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason ?? '');
    if (/transition was aborted|AbortError|ViewTransition/i.test(message)) {
      event.preventDefault();
    }
  });
}

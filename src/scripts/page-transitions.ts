import { getPerfTier, isLessMotionPreferred } from './perf';

let bound = false;
let titleTween: { kill: () => void } | null = null;
let splitRef: { revert: () => void } | null = null;
let wipeGen = 0;
let fallbackCovered = false;

type PrepEvent = Event & {
  loader: () => Promise<void>;
  signal?: AbortSignal;
};

type SwapEvent = Event & {
  viewTransition?: { finished: Promise<unknown> };
};

const WIPE_MS: Record<'high' | 'mid' | 'fade', number> = {
  high: 500,
  mid: 280,
  fade: 160,
};

/** Growing brand-chevron reveal. Last frame covers the viewport. */
const REVEAL_FRAMES = [
  'polygon(0% 0%, -40% 0%, -18% 78%, -32.96% 78%, -40% 100%, 0% 100%)',
  'polygon(0% 0%, -4% 0%, 18% 78%, 3.04% 78%, -4% 100%, 0% 100%)',
  'polygon(0% 0%, 32% 0%, 54% 78%, 39.04% 78%, 32% 100%, 0% 100%)',
  'polygon(0% 0%, 68% 0%, 90% 78%, 75.04% 78%, 68% 100%, 0% 100%)',
  'polygon(0% 0%, 104% 0%, 126% 78%, 111.04% 78%, 104% 100%, 0% 100%)',
  'polygon(0% 0%, 140% 0%, 162% 78%, 147.04% 78%, 140% 100%, 0% 100%)',
];

function prefersReducedMotion(): boolean {
  return isLessMotionPreferred() || getPerfTier() === 'low';
}

function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

function resolveVtMode(): 'high' | 'mid' | 'fade' {
  if (prefersReducedMotion()) return 'fade';
  if (getPerfTier() === 'mid') return 'mid';
  return 'high';
}

function wipeEl(): HTMLElement | null {
  return document.getElementById('vt-wipe');
}

function disarmWipe(): void {
  const wipe = wipeEl();
  if (!wipe) return;
  wipe.getAnimations().forEach((anim) => anim.cancel());
  wipe.style.opacity = '';
  wipe.style.visibility = '';
  wipe.style.clipPath = '';
  fallbackCovered = false;
}

function armWipe(): void {
  const wipe = wipeEl();
  if (!wipe) return;
  wipe.style.visibility = 'visible';
  wipe.style.opacity = '1';
  wipe.style.clipPath = 'none';
}

function clearTitleAnim(): void {
  titleTween?.kill();
  titleTween = null;
  splitRef?.revert();
  splitRef = null;
}

async function animateIncomingTitle(): Promise<void> {
  clearTitleAnim();
  if (prefersReducedMotion() || getPerfTier() !== 'high') return;

  const title = document.querySelector<HTMLElement>('[data-page-title]');
  if (!title) return;

  try {
    const gsap = (await import('gsap')).default;
    const { SplitText } = await import('gsap/SplitText');
    const { promoteToGsapTicker } = await import('./raf-hub');
    gsap.registerPlugin(SplitText);
    await promoteToGsapTicker();

    splitRef = SplitText.create(title, {
      type: 'lines',
      linesClass: 'page-title-line',
      aria: 'none',
    });
    const lines = (splitRef as { lines: HTMLElement[] }).lines;
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

async function refreshScrollTools(): Promise<void> {
  try {
    const { ensureScrollTrigger } = await import('./scroll-sync');
    ensureScrollTrigger().refresh();
  } catch {
    /* ScrollTrigger may be unused on this page */
  }
}

async function playFallbackCover(ms: number): Promise<void> {
  const wipe = wipeEl();
  if (!wipe) return;
  wipe.style.visibility = 'visible';
  wipe.style.opacity = '1';
  const anim = wipe.animate(
    REVEAL_FRAMES.map((clipPath) => ({ clipPath })),
    { duration: ms, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' },
  );
  try {
    await anim.finished;
    fallbackCovered = true;
  } catch {
    anim.cancel();
    disarmWipe();
  }
}

function revealFallback(ms: number): void {
  const wipe = wipeEl();
  if (!wipe || !fallbackCovered) {
    disarmWipe();
    return;
  }
  const anim = wipe.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: ms, easing: 'linear', fill: 'forwards' },
  );
  anim.finished.finally(() => disarmWipe());
}

function onBeforePreparation(event: Event): void {
  const ev = event as PrepEvent;
  const gen = ++wipeGen;
  const mode = resolveVtMode();
  document.documentElement.dataset.vtMode = mode;
  disarmWipe();

  if (!supportsViewTransitions()) {
    const original = ev.loader;
    ev.loader = async () => {
      await original();
      if (gen !== wipeGen || ev.signal?.aborted || ev.defaultPrevented) return;
      if (mode === 'fade') return;
      await playFallbackCover(WIPE_MS[mode]);
    };
    return;
  }

  const original = ev.loader;
  ev.loader = async () => {
    await original();
    if (gen !== wipeGen || ev.signal?.aborted || ev.defaultPrevented) return;
    if (mode === 'fade') return;
    armWipe();
  };
}

function onBeforeSwap(event: Event): void {
  clearTitleAnim();
  const gen = wipeGen;
  const vt = (event as SwapEvent).viewTransition;
  const mode = resolveVtMode();
  const settle = (): void => {
    if (gen !== wipeGen) return;
    disarmWipe();
    delete document.documentElement.dataset.vtMode;
  };
  if (vt?.finished) {
    vt.finished.finally(settle);
    return;
  }
  window.setTimeout(settle, WIPE_MS[mode] + 60);
}

function onPageLoad(): void {
  if (fallbackCovered) {
    const mode = resolveVtMode();
    revealFallback(mode === 'fade' ? 160 : 180);
  }
  void animateIncomingTitle();
  window.requestAnimationFrame(() => {
    void refreshScrollTools();
  });
}

/** Bind once — safe across View Transitions. */
export function mountPageTransitions(): void {
  if (bound) return;
  bound = true;

  document.addEventListener('astro:before-preparation', onBeforePreparation);
  document.addEventListener('astro:before-swap', onBeforeSwap);
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

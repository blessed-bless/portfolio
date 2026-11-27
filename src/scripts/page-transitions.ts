import { getPerfTier, isLessMotionPreferred } from './perf';

let bound = false;
let coverNav = false;
let titleTween: { kill: () => void } | null = null;
let splitRef: { revert: () => void } | null = null;
let wipeGen = 0;
let fallbackCovered = false;

type PrepEvent = Event & {
  loader: () => Promise<void>;
  to: URL;
  signal?: AbortSignal;
};

type SwapEvent = Event & {
  viewTransition?: { finished: Promise<unknown> };
};

type TransitionMode = 'high' | 'mid' | 'quick' | 'fade';

const WIPE_MS: Record<TransitionMode, number> = {
  high: 380,
  mid: 260,
  quick: 180,
  fade: 120,
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

function resolveVtMode(destination: URL): TransitionMode {
  const orderPath = /^\/(?:en\/)?order\/?$/;
  if (coverNav && !prefersReducedMotion()) return 'fade';
  if (prefersReducedMotion()) return 'fade';
  if (destination.hash || orderPath.test(destination.pathname) || orderPath.test(location.pathname) ||
      matchMedia('(max-width: 900px)').matches) return 'quick';
  return getPerfTier() === 'mid' ? 'mid' : 'high';
}

function usesWipe(mode: TransitionMode): boolean {
  return mode === 'high' || mode === 'mid';
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
  if (prefersReducedMotion() || getPerfTier() !== 'high' || location.hash ||
      matchMedia('(max-width: 900px)').matches) return;

  const gen = wipeGen;
  const title = document.querySelector<HTMLElement>('[data-page-title]:not([data-hero-line])');
  if (!title) return;

  try {
    const gsap = (await import('gsap')).default;
    const { SplitText } = await import('gsap/SplitText');
    const { promoteToGsapTicker } = await import('./raf-hub');
    gsap.registerPlugin(SplitText);
    await promoteToGsapTicker();
    if (gen !== wipeGen || !title.isConnected || prefersReducedMotion()) return;

    const split = SplitText.create(title, {
      type: 'lines',
      linesClass: 'page-title-line',
      aria: 'auto',
    });
    splitRef = split;
    const { lines } = split;
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
    if (gen === wipeGen) clearTitleAnim();
  }
}

async function playFallbackCover(ms: number, gen: number): Promise<void> {
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
    if (gen === wipeGen) fallbackCovered = true;
  } catch {
    anim.cancel();
    if (gen === wipeGen) disarmWipe();
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
  const gen = wipeGen;
  void anim.finished.then(
    () => { if (gen === wipeGen) disarmWipe(); },
    () => { if (gen === wipeGen) disarmWipe(); },
  );
}

function onBeforePreparation(event: Event): void {
  const ev = event as PrepEvent;
  const gen = ++wipeGen;
  const mode = resolveVtMode(ev.to);
  document.documentElement.dataset.vtMode = mode;
  disarmWipe();

  if (!supportsViewTransitions()) {
    const original = ev.loader;
    ev.loader = async () => {
      await original();
      if (gen !== wipeGen || ev.signal?.aborted || ev.defaultPrevented) return;
      if (!usesWipe(mode)) return;
      await playFallbackCover(WIPE_MS[mode], gen);
    };
    return;
  }

  const original = ev.loader;
  ev.loader = async () => {
    await original();
    if (gen !== wipeGen || ev.signal?.aborted || ev.defaultPrevented) return;
    if (!usesWipe(mode)) return;
    armWipe();
  };
}

function onBeforeSwap(event: Event): void {
  coverNav = false;
  clearTitleAnim();
  const gen = wipeGen;
  const vt = (event as SwapEvent).viewTransition;
  const mode = document.documentElement.dataset.vtMode as TransitionMode | undefined;
  const settle = (): void => {
    if (gen !== wipeGen) return;
    disarmWipe();
    delete document.documentElement.dataset.vtMode;
  };
  if (vt?.finished) {
    void vt.finished.then(settle, settle);
    return;
  }
  window.setTimeout(settle, WIPE_MS[mode ?? 'quick'] + 60);
}

function onPageLoad(): void {
  if (fallbackCovered) revealFallback(150);
  void animateIncomingTitle();
}

/** Bind once — safe across View Transitions. */
export function mountPageTransitions(): void {
  if (bound) return;
  bound = true;

  document.addEventListener('click', (event) => {
    const node = event.target;
    if (!(node instanceof Element)) {
      coverNav = false;
      return;
    }
    const link = node.closest('a');
    coverNav = Boolean(link?.querySelector('[data-vt-cover]'));
  }, true);
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

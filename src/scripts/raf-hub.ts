import { getPerfTier, type PerfTier } from './perf';

type TickFn = (time: number, delta: number) => void;

const subscribers = new Set<TickFn>();
let started = false;
let nativeRaf = 0;
let lastTime = 0;
let useGsap = false;
let gsapTickerFn: ((time: number) => void) | null = null;
let tickerPaused = false;

function nativeLoop(now: number): void {
  if (tickerPaused) return;
  const delta = lastTime ? now - lastTime : 16.67;
  lastTime = now;
  for (const fn of subscribers) fn(now, delta);
  if (subscribers.size && !useGsap) {
    nativeRaf = requestAnimationFrame(nativeLoop);
  }
}

function ensureStarted(): void {
  if (started) return;
  started = true;
  nativeRaf = requestAnimationFrame(nativeLoop);
}

/** Call after gsap is loaded (home scroll / SplitText) to share one ticker. */
export async function promoteToGsapTicker(): Promise<void> {
  if (useGsap) return;
  const gsap = (await import('gsap')).default;
  useGsap = true;
  cancelAnimationFrame(nativeRaf);
  gsapTickerFn = () => {
    const time = gsap.ticker.time * 1000;
    const delta = lastTime ? time - lastTime : 16.67;
    lastTime = time;
    for (const fn of subscribers) fn(time, delta);
  };
  gsap.ticker.add(gsapTickerFn);
  gsap.ticker.lagSmoothing(500, 33);
}

/** Shared rAF — Lenis, cursor, carousel subscribe here. */
export function subscribeTicker(fn: TickFn): () => void {
  ensureStarted();
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function pauseTicker(): void {
  if (tickerPaused) return;
  tickerPaused = true;
  cancelAnimationFrame(nativeRaf);
  if (useGsap && gsapTickerFn) {
    void import('gsap').then((mod) => mod.default.ticker.remove(gsapTickerFn!));
  }
}

export function resumeTicker(): void {
  if (!tickerPaused) return;
  tickerPaused = false;
  if (useGsap && gsapTickerFn) {
    void import('gsap').then((mod) => mod.default.ticker.add(gsapTickerFn!));
  } else if (subscribers.size) {
    nativeRaf = requestAnimationFrame(nativeLoop);
  }
}

export function bindVisibilityPause(): () => void {
  const onVis = (): void => {
    if (document.hidden) pauseTicker();
    else resumeTicker();
  };
  document.addEventListener('visibilitychange', onVis);
  onVis();
  return () => document.removeEventListener('visibilitychange', onVis);
}

/** Pause a local loop when element is off-screen or tab hidden. */
export function observeActivity(
  el: Element,
  setActive: (active: boolean) => void,
): () => void {
  let intersecting = true;
  let visible = !document.hidden;

  const sync = (): void => {
    setActive(intersecting && visible);
  };

  const io = new IntersectionObserver(
    (entries) => {
      intersecting = entries.some((e) => e.isIntersecting);
      sync();
    },
    { root: null, threshold: 0.01 },
  );
  io.observe(el);

  const onVis = (): void => {
    visible = !document.hidden;
    sync();
  };
  document.addEventListener('visibilitychange', onVis);
  sync();

  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
  };
}

export function scrubAllowed(): boolean {
  return getPerfTier() === 'high';
}

export function onPerfChange(cb: (tier: PerfTier) => void): () => void {
  const handler = (event: Event): void => {
    const detail = (event as CustomEvent<{ tier: PerfTier }>).detail;
    if (detail?.tier) cb(detail.tier);
  };
  window.addEventListener('portfolio:perf', handler);
  return () => window.removeEventListener('portfolio:perf', handler);
}

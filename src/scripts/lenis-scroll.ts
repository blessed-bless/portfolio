import Lenis from 'lenis';
import { getPerfTier, perfAllows } from './perf';
import { subscribeTicker } from './raf-hub';

let lenis: Lenis | null = null;
let unsubscribe: (() => void) | null = null;

export function startLenis(): void {
  if (!perfAllows('lenis') || lenis) return;

  lenis = new Lenis({
    duration: getPerfTier() === 'mid' ? 0.9 : 1.05,
    smoothWheel: true,
    touchMultiplier: 1.1,
  });

  document.documentElement.classList.add('lenis', 'lenis-smooth');
  unsubscribe = subscribeTicker((time) => {
    lenis?.raf(time);
  });
}

export function stopLenis(): void {
  unsubscribe?.();
  unsubscribe = null;
  lenis?.destroy();
  lenis = null;
  document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
}

export function getLenis(): Lenis | null {
  return lenis;
}

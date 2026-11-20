import Lenis from 'lenis';

let lenis: Lenis | null = null;
let rafId = 0;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tick(time: number): void {
  lenis?.raf(time);
  rafId = requestAnimationFrame(tick);
}

export function startLenis(): void {
  if (prefersReducedMotion() || lenis) return;

  lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    touchMultiplier: 1.1,
  });

  document.documentElement.classList.add('lenis', 'lenis-smooth');
  rafId = requestAnimationFrame(tick);
}

export function stopLenis(): void {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  lenis?.destroy();
  lenis = null;
  document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
}

export function getLenis(): Lenis | null {
  return lenis;
}

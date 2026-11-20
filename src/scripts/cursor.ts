import { getPerfTier, perfAllows } from './perf';
import { observeActivity, subscribeTicker } from './raf-hub';

const HOVER_SELECTOR = 'a, button, [data-cursor="hover"], .project-card, .btn';
const READY_ATTR = 'data-cursor-ready';

type CursorHandle = {
  root: HTMLElement;
  dispose: () => void;
};

let active: CursorHandle | null = null;

export function canUseCustomCursor(): boolean {
  if (!perfAllows('cursor')) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  if (window.matchMedia('(hover: none)').matches) return false;
  if (navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches) return false;
  return window.matchMedia('(pointer: fine)').matches;
}

export function isCursorMountedOn(root: HTMLElement): boolean {
  return active?.root === root && root.getAttribute(READY_ATTR) === 'true';
}

/**
 * One cursor for the session. mid/low: no trail lerp (ring snaps with dot).
 * Driven by the shared gsap ticker — no private rAF.
 */
export function mountCustomCursor(root: HTMLElement): () => void {
  if (isCursorMountedOn(root)) {
    return active!.dispose;
  }

  active?.dispose();
  active = null;

  if (!canUseCustomCursor()) return () => undefined;

  const dot = root.querySelector<HTMLElement>('[data-cursor-dot]');
  const ring = root.querySelector<HTMLElement>('[data-cursor-ring]');
  if (!dot || !ring) return () => undefined;

  document.body.classList.add('has-custom-cursor');
  root.hidden = false;
  root.setAttribute(READY_ATTR, 'true');
  root.dataset.visible = 'false';
  root.dataset.hover = 'false';
  root.dataset.onControl = 'false';

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let rx = x;
  let ry = y;
  let hovering = false;
  let onControl = false;
  let visible = false;
  let running = false;
  let disposed = false;
  const smoothTrail = getPerfTier() === 'high';

  const setHoverState = (): void => {
    root.dataset.hover = hovering ? 'true' : 'false';
    root.dataset.onControl = onControl ? 'true' : 'false';
  };

  const paint = (): void => {
    const hoverScale = hovering ? 0.55 : 1;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${hoverScale})`;
  };

  const onTick = (): void => {
    if (!running || disposed) return;
    if (smoothTrail) {
      rx += (x - rx) * 0.28;
      ry += (y - ry) * 0.28;
    } else {
      rx = x;
      ry = y;
    }
    paint();
  };

  const unsubTicker = subscribeTicker(onTick);
  const unsubActivity = observeActivity(root, (activeNow) => {
    running = activeNow && visible && !disposed;
  });

  const onMove = (event: PointerEvent): void => {
    x = event.clientX;
    y = event.clientY;
    if (!visible) {
      visible = true;
      root.dataset.visible = 'true';
      rx = x;
      ry = y;
      paint();
    }
    running = !document.hidden;
  };

  const onOver = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const nextHover = Boolean(target.closest(HOVER_SELECTOR));
    const nextControl = Boolean(target.closest('a, button, .btn, [role="button"]'));
    if (nextHover === hovering && nextControl === onControl) return;
    hovering = nextHover;
    onControl = nextControl;
    setHoverState();
  };

  const onLeaveWindow = (): void => {
    visible = false;
    root.dataset.visible = 'false';
    running = false;
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerover', onOver, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeaveWindow);

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    running = false;
    unsubTicker();
    unsubActivity();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerover', onOver);
    document.documentElement.removeEventListener('pointerleave', onLeaveWindow);
    document.body.classList.remove('has-custom-cursor');
    root.hidden = true;
    root.dataset.visible = 'false';
    root.removeAttribute(READY_ATTR);
    if (active?.dispose === dispose) active = null;
  };

  active = { root, dispose };
  return dispose;
}

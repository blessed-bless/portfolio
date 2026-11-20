const HOVER_SELECTOR =
  'a, button, [data-cursor="hover"], .project-card, .btn';

export function canUseCustomCursor(): boolean {
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  if (window.matchMedia('(hover: none)').matches) return false;
  if (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: fine)').matches === false) {
    return false;
  }
  return window.matchMedia('(pointer: fine)').matches;
}

export function mountCustomCursor(root: HTMLElement): () => void {
  if (!canUseCustomCursor()) return () => undefined;

  const dot = root.querySelector<HTMLElement>('[data-cursor-dot]');
  const ring = root.querySelector<HTMLElement>('[data-cursor-ring]');
  if (!dot || !ring) return () => undefined;

  document.body.classList.add('has-custom-cursor');
  root.hidden = false;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let rx = x;
  let ry = y;
  let hovering = false;
  let raf = 0;
  let visible = false;

  const onMove = (event: PointerEvent): void => {
    x = event.clientX;
    y = event.clientY;
    if (!visible) {
      visible = true;
      root.dataset.visible = 'true';
    }
  };

  const onOver = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    hovering = Boolean(target.closest(HOVER_SELECTOR));
    root.dataset.hover = hovering ? 'true' : 'false';
  };

  const onLeave = (): void => {
    visible = false;
    root.dataset.visible = 'false';
  };

  const render = (): void => {
    rx += (x - rx) * 0.22;
    ry += (y - ry) * 0.22;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${hovering ? 1.65 : 1})`;
    raf = requestAnimationFrame(render);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerover', onOver, { passive: true });
  window.addEventListener('pointerleave', onLeave);
  raf = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerover', onOver);
    window.removeEventListener('pointerleave', onLeave);
    document.body.classList.remove('has-custom-cursor');
    root.hidden = true;
  };
}

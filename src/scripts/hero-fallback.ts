import { getLenis } from './lenis-scroll';

export function isWeakGpu(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    try {
      const mobile = /Mobi|Android/i.test(navigator.userAgent);
      return mobile && (navigator.hardwareConcurrency || 8) <= 4;
    } finally {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    return true;
  }
}

export function mountHeroFallback(
  root: HTMLElement,
  track: HTMLElement,
  onActiveIndexChange: (index: number) => void,
): () => void {
  const cards = [...track.querySelectorAll<HTMLAnchorElement>('[data-hero-cover]')];
  if (cards.length === 0) return () => {};

  const prev = root.querySelector<HTMLButtonElement>('[data-hero-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-hero-next]');
  let active = -1;
  let settleTimer = 0;
  let drag: { id: number; startX: number; scrollLeft: number; moved: boolean } | undefined;
  let suppressClick = false;

  root.dataset.webgl = 'off';
  root.dataset.carousel = 'snap';
  track.hidden = false;

  const setActive = (index: number): void => {
    if (active === index) return;
    active = index;
    cards.forEach((card, i) => {
      card.dataset.active = String(i === index);
      if (i === index) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
    onActiveIndexChange(index);
  };

  const nearestIndex = (): number => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const offset = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
      if (offset < distance) {
        nearest = index;
        distance = offset;
      }
    });
    return nearest;
  };

  const goTo = (index: number, smooth = true): void => {
    const wrapped = ((index % cards.length) + cards.length) % cards.length;
    const card = cards[wrapped];
    const left = card.offsetLeft + (card.offsetWidth - track.clientWidth) / 2;
    window.clearTimeout(settleTimer);
    setActive(wrapped);
    cards.forEach((cover) => cover.removeAttribute('data-playing'));
    track.scrollTo({ left, behavior: smooth && root.dataset.motion === 'on' ? 'smooth' : 'instant' });
    settleTimer = window.setTimeout(settleCover, 100);
  };

  const settleCover = (): void => {
    const index = nearestIndex();
    setActive(index);
    cards.forEach((card, i) => card.toggleAttribute('data-playing', i === index));
  };

  const onScroll = (): void => {
    window.clearTimeout(settleTimer);
    if (drag?.moved) return;
    settleTimer = window.setTimeout(settleCover, 100);
  };

  const onClick = (event: MouseEvent): void => {
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      return;
    }
    if (event.detail === 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const card = (event.target as Element | null)?.closest<HTMLAnchorElement>('[data-hero-cover]');
    const index = card ? cards.indexOf(card) : -1;
    if (index < 0 || index === active) return;
    event.preventDefault();
    goTo(index);
  };

  const onPointerDown = (event: PointerEvent): void => {
    suppressClick = false;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { id: event.pointerId, startX: event.clientX, scrollLeft: track.scrollLeft, moved: false };
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      suppressClick = true;
      track.dataset.dragging = '';
      track.setPointerCapture(event.pointerId);
      getLenis()?.stop();
    }
    track.scrollLeft = drag.scrollLeft - delta;
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (drag?.id !== event.pointerId) return;
    const wasDragging = drag.moved;
    drag = undefined;
    if (!wasDragging) return;
    const nearest = nearestIndex();
    delete track.dataset.dragging;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    getLenis()?.start();
    goTo(nearest);
  };

  const onDragStart = (event: DragEvent): void => event.preventDefault();

  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    goTo(active + (event.key === 'ArrowRight' ? 1 : -1));
  };

  const onPrev = (): void => goTo(active - 1);
  const onNext = (): void => goTo(active + 1);
  track.addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('click', onClick);
  track.addEventListener('dragstart', onDragStart);
  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  root.addEventListener('keydown', onKey);
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);

  goTo(0, false);

  return () => {
    window.clearTimeout(settleTimer);
    track.removeEventListener('scroll', onScroll);
    track.removeEventListener('click', onClick);
    track.removeEventListener('dragstart', onDragStart);
    track.removeEventListener('pointerdown', onPointerDown);
    track.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    root.removeEventListener('keydown', onKey);
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    if (drag?.moved) getLenis()?.start();
  };
}

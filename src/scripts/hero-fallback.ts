import type { Project } from '../lib/work-types';
import { getLenis } from './lenis-scroll';

export function isWeakGpu(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    if (info) {
      const renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '');
      if (/SwiftShader|llvmpipe|Softwar|Microsoft Basic/i.test(renderer)) return true;
    }
    const mobile = /Mobi|Android/i.test(navigator.userAgent);
    if (mobile && (navigator.hardwareConcurrency || 8) <= 4) return true;
    return false;
  } catch {
    return true;
  }
}

type FallbackOptions = {
  projects: Project[];
  counter: HTMLElement | null;
  caption: HTMLElement | null;
  hint: HTMLElement | null;
  onSelect: (project: Project) => void;
};

export function mountHeroFallback(
  root: HTMLElement,
  track: HTMLElement,
  options: FallbackOptions,
): () => void {
  const { projects, counter, caption, hint, onSelect } = options;
  const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-hero-cover]'));
  let active = 0;
  let settleTimer = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragOriginScroll = 0;
  let dragDistance = 0;
  let pointerId: number | null = null;

  root.dataset.webgl = 'off';
  root.dataset.carousel = 'snap';
  track.hidden = false;
  track.removeAttribute('hidden');

  const syncChrome = (index: number): void => {
    const project = projects[index];
    if (!project) return;
    const number = String(index + 1).padStart(2, '0');
    const total = String(projects.length).padStart(2, '0');
    if (counter) counter.textContent = `${number} / ${total}`;
    if (caption) {
      caption.hidden = false;
      caption.innerHTML = `<span>${number}</span><span>${project.title}</span><span>${project.year}</span><span>${project.stack}</span>`;
    }
    cards.forEach((card, i) => {
      card.dataset.active = i === index ? 'true' : 'false';
      card.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  };

  const nearestIndex = (): number => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  };

  const wrap = (value: number): number => {
    const len = projects.length;
    return ((value % len) + len) % len;
  };

  const goTo = (index: number, smooth = true): void => {
    const target = cards[wrap(index)];
    if (!target) return;
    active = wrap(index);
    target.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'smooth'
        : 'auto',
    });
    syncChrome(active);
    if (hint) hint.dataset.hidden = 'true';
  };

  const onScroll = (): void => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      const next = nearestIndex();
      if (next !== active) {
        active = next;
        syncChrome(active);
      }
    }, 80);
  };

  const onClick = (event: Event): void => {
    if (dragDistance > 8) {
      event.preventDefault();
      return;
    }
    const card = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-hero-cover]');
    if (!card || !track.contains(card)) return;
    const index = cards.indexOf(card);
    if (index < 0) return;
    if (index === active) {
      const project = projects[index];
      if (project?.hasPage) onSelect(project);
      return;
    }
    event.preventDefault();
    goTo(index);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    dragStartX = event.clientX;
    dragOriginScroll = track.scrollLeft;
    dragDistance = 0;
    getLenis()?.stop();
    try {
      track.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging || (pointerId !== null && event.pointerId !== pointerId)) return;
    const dx = event.clientX - dragStartX;
    dragDistance = Math.abs(dx);
    track.scrollLeft = dragOriginScroll - dx;
    if (hint) hint.dataset.hidden = 'true';
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!dragging || (pointerId !== null && event.pointerId !== pointerId)) return;
    dragging = false;
    pointerId = null;
    getLenis()?.start();
    try {
      track.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    if (dragDistance > 24) {
      const delta = event.clientX < dragStartX ? 1 : -1;
      goTo(active + delta);
    } else {
      goTo(nearestIndex());
    }
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(active + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(active - 1);
    }
  };

  const prev = root.querySelector<HTMLButtonElement>('[data-hero-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-hero-next]');
  const onPrev = (): void => goTo(active - 1);
  const onNext = (): void => goTo(active + 1);

  track.addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('click', onClick);
  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointermove', onPointerMove);
  track.addEventListener('pointerup', onPointerUp);
  track.addEventListener('pointercancel', onPointerUp);
  root.addEventListener('keydown', onKey);
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);

  syncChrome(0);
  goTo(0, false);

  return () => {
    window.clearTimeout(settleTimer);
    track.removeEventListener('scroll', onScroll);
    track.removeEventListener('click', onClick);
    track.removeEventListener('pointerdown', onPointerDown);
    track.removeEventListener('pointermove', onPointerMove);
    track.removeEventListener('pointerup', onPointerUp);
    track.removeEventListener('pointercancel', onPointerUp);
    root.removeEventListener('keydown', onKey);
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    getLenis()?.start();
  };
}

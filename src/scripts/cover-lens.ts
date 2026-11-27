import {
  ShaderFitOptions,
  ShaderMount,
  lensDistortionFragmentShader,
  type LensDistortionUniforms,
} from '@paper-design/shaders';
import { getPerfTier, isLessMotionPreferred, onPerfChange } from './perf';
import { subscribeTicker } from './raf-hub';

const MAX_PIXELS = 720 * 450;

let host: HTMLElement | null = null;
let mount: ShaderMount | null = null;
let current: HTMLElement | null = null;
let image: HTMLImageElement | null = null;
let pointerX = 0;
let pointerY = 0;
let lastPaint: { rect: DOMRect; x: number; y: number } | null = null;
let unsubTick: (() => void) | null = null;
let bound = false;
let failed = false;

function fineDesktop(): boolean {
  return (
    window.matchMedia('(min-width: 901px)').matches &&
    window.matchMedia('(pointer: fine)').matches &&
    !isLessMotionPreferred()
  );
}

function lensAllowed(): boolean {
  return fineDesktop() && getPerfTier() === 'high' && !failed;
}

function tiltAllowed(): boolean {
  return fineDesktop() && getPerfTier() === 'mid';
}

function isShown(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 8 && rect.height > 8 && getComputedStyle(el).display !== 'none';
}

function visibleImage(target: HTMLElement): HTMLImageElement | null {
  const light = document.documentElement.dataset.theme === 'light';
  const img = target.querySelector<HTMLImageElement>(
    light ? '.project-cover--light' : '.project-cover--dark',
  );
  if (!img || !img.complete || img.naturalWidth === 0) return null;
  return img;
}

function ensureHost(): HTMLElement {
  if (host) return host;
  const el = document.createElement('div');
  el.id = 'cover-lens';
  el.hidden = true;
  el.setAttribute('aria-hidden', 'true');
  const slot = document.createElement('div');
  slot.dataset.lensMount = '';
  const meta = document.createElement('span');
  meta.className = 'project-cover__meta';
  meta.dataset.lensMeta = '';
  el.append(slot, meta);
  document.documentElement.appendChild(el);
  host = el;
  return el;
}

function uniforms(img: HTMLImageElement, bulge: number, angle: number) {
  return {
    u_image: img,
    u_spread: 0.1,
    u_bias: 0.15,
    u_angle: angle,
    u_perspective: 0.18,
    u_count: 4,
    u_dispersion: 0.12,
    u_dispersionShift: 0.15,
    u_dispersionColor: 0.76,
    u_focusCenter: 0.2,
    u_focusEdges: 0.55,
    u_swirl: 0,
    u_noise: 0,
    u_noiseFrequency: 0,
    u_noiseOffset: 0,
    u_lensBulge: bulge,
    u_lensCircle: 0,
    u_grainMixer: 0,
    u_grainOverlay: 0,
    u_imageX: 0,
    u_imageY: 0,
    u_fit: ShaderFitOptions.cover,
    u_scale: 1,
    u_rotation: 0,
    u_originX: 0.5,
    u_originY: 0.5,
    u_offsetX: 0,
    u_offsetY: 0,
    u_worldWidth: 0,
    u_worldHeight: 0,
  } satisfies LensDistortionUniforms;
}

function ensureMount(slot: HTMLElement, img: HTMLImageElement, bulge: number, angle: number): ShaderMount | null {
  if (mount) return mount;
  try {
    mount = new ShaderMount(
      slot,
      lensDistortionFragmentShader,
      uniforms(img, bulge, angle),
      { alpha: false, antialias: false, powerPreference: 'low-power' },
      0,
      0,
      1,
      MAX_PIXELS,
      ['u_image'],
    );
    return mount;
  } catch {
    failed = true;
    mount = null;
    slot.replaceChildren();
    return null;
  }
}

function place(el: HTMLElement, rect: DOMRect): void {
  const inset = 1;
  el.hidden = false;
  el.dataset.on = 'true';
  el.style.width = `${Math.max(0, rect.width - inset * 2)}px`;
  el.style.height = `${Math.max(0, rect.height - inset * 2)}px`;
  el.style.transform = `translate3d(${rect.left + inset}px, ${rect.top + inset}px, 0)`;
}

function syncMeta(target: HTMLElement): void {
  const meta = host?.querySelector<HTMLElement>('[data-lens-meta]');
  const source = target.querySelector('.project-cover__meta');
  if (!meta) return;
  meta.innerHTML = source?.innerHTML ?? '';
}

function hide(): void {
  unsubTick?.();
  unsubTick = null;
  current?.classList.remove('is-lens-live', 'is-tilt');
  current?.style.removeProperty('--tilt-x');
  current?.style.removeProperty('--tilt-y');
  current?.style.removeProperty('--shine');
  current = null;
  image = null;
  lastPaint = null;
  if (host) {
    host.dataset.on = 'false';
    host.hidden = true;
  }
}

function paintLens(): void {
  if (!current || !image || !host || document.hidden) return;
  const rect = current.getBoundingClientRect();
  if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= innerWidth || rect.top >= innerHeight) {
    hide();
    return;
  }
  const previous = lastPaint;
  const moved = !previous || rect.left !== previous.rect.left || rect.top !== previous.rect.top ||
    rect.width !== previous.rect.width || rect.height !== previous.rect.height;
  if (!moved && previous?.x === pointerX && previous.y === pointerY) return;
  if (moved) place(host, rect);
  lastPaint = { rect, x: pointerX, y: pointerY };
  const dx = (pointerX - (rect.left + rect.width / 2)) / Math.max(rect.width, 1);
  const dy = (pointerY - (rect.top + rect.height / 2)) / Math.max(rect.height, 1);
  const dist = Math.min(1, Math.hypot(dx, dy));
  const bulge = 0.025 + dist * 0.038;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (mount) {
    const rich = current.hasAttribute('data-lens-rich');
    mount.setUniforms({
      u_lensBulge: bulge,
      u_angle: angle,
      u_grainOverlay: rich ? 0.28 : 0,
      u_dispersion: rich ? 0.28 : 0.12,
      u_dispersionShift: rich ? 0.22 : 0.15,
      ...(!previous && { u_image: image }),
    });
  } else {
    const slot = host.querySelector<HTMLElement>('[data-lens-mount]');
    if (!slot || !ensureMount(slot, image, bulge, angle)) hide();
  }
}

function paintTilt(): void {
  if (!current) return;
  const rect = current.getBoundingClientRect();
  const dx = (pointerX - (rect.left + rect.width / 2)) / Math.max(rect.width / 2, 1);
  const dy = (pointerY - (rect.top + rect.height / 2)) / Math.max(rect.height / 2, 1);
  const clamp = (value: number) => Math.max(-1, Math.min(1, value));
  current.style.setProperty('--tilt-y', `${clamp(dx) * 3}deg`);
  current.style.setProperty('--tilt-x', `${clamp(-dy) * 2.5}deg`);
  current.style.setProperty('--shine', `${clamp(dx) * 30}%`);
}

function show(target: HTMLElement): void {
  if (!isShown(target)) return;
  if (tiltAllowed()) {
    if (current && current !== target) current.classList.remove('is-tilt');
    current = target;
    current.classList.add('is-tilt');
    paintTilt();
    return;
  }
  if (!lensAllowed()) return;
  const img = visibleImage(target);
  if (!img) return;
  if (current && current !== target) current.classList.remove('is-lens-live');
  current = target;
  image = img;
  current.classList.add('is-lens-live');
  ensureHost();
  syncMeta(target);
  paintLens();
  if (current && !unsubTick) unsubTick = subscribeTicker(paintLens);
}

function targetFrom(event: Event): HTMLElement | null {
  const node = event.target;
  if (!(node instanceof Element)) return null;
  return node.closest<HTMLElement>('[data-cover-lens]');
}

function onOver(event: PointerEvent): void {
  pointerX = event.clientX;
  pointerY = event.clientY;
  const target = targetFrom(event);
  if (!target || target === current) return;
  hide();
  show(target);
}

function onMove(event: PointerEvent): void {
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!current) return;
  if (current.classList.contains('is-tilt')) paintTilt();
}

function onOut(event: PointerEvent): void {
  if (!current) return;
  const next = event.relatedTarget instanceof Element ? event.relatedTarget.closest('[data-cover-lens]') : null;
  if (next === current) return;
  hide();
}

/** One shared lens. High: WebGL, paused until a cover is hovered. Mid: CSS tilt. */
export function mountCoverLens(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('pointerover', onOver);
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerout', onOut);
  document.addEventListener('astro:before-preparation', hide);
  document.addEventListener('astro:before-swap', () => {
    hide();
    mount?.dispose();
    mount = null;
  });
  onPerfChange(() => {
    hide();
    if (!lensAllowed()) {
      mount?.dispose();
      mount = null;
    }
  });
  document.addEventListener('astro:page-load', hide);
}

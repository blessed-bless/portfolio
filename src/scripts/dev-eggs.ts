const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
] as const;

const WORD = 'bogdan';
const EFFECT_MS = 2000;
const TOAST_TEXT = 'Нашёл. Напиши в Telegram кодовое слово «пасхалка»';

let eggsBound = false;
let effectRunning = false;
let konamiIndex = 0;
let typedBuffer = '';

function printConsoleCard(): void {
  if (typeof console === 'undefined') return;
  const style =
    'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;color:#8B5CF6;';
  console.log(
    '%cСмотришь код? Исходники тут → github.com/blessed-bless. Есть задача — bogdan@dubstepmolitva.ru',
    style,
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensureToast(): HTMLElement {
  let toast = document.querySelector<HTMLElement>('[data-egg-toast]');
  if (toast) return toast;

  toast = document.createElement('p');
  toast.className = 'egg-toast mono';
  toast.setAttribute('data-egg-toast', '');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.dataset.open = 'false';
  document.body.appendChild(toast);
  return toast;
}

function showToast(message: string): void {
  const toast = ensureToast();
  toast.textContent = message;
  toast.dataset.open = 'true';
  window.setTimeout(() => {
    toast.dataset.open = 'false';
  }, 3200);
}

function paintWireframe(cover: HTMLElement): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'egg-wireframe';
  overlay.setAttribute('aria-hidden', 'true');
  const w = cover.clientWidth || 160;
  const h = cover.clientHeight || 100;
  overlay.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="100%">
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#A78BFA" stroke-width="1.5"/>
    <line x1="0" y1="${h * 0.33}" x2="${w}" y2="${h * 0.33}" stroke="#A78BFA" stroke-width="1" opacity="0.7"/>
    <line x1="0" y1="${h * 0.66}" x2="${w}" y2="${h * 0.66}" stroke="#A78BFA" stroke-width="1" opacity="0.7"/>
    <line x1="${w * 0.33}" y1="0" x2="${w * 0.33}" y2="${h}" stroke="#A78BFA" stroke-width="1" opacity="0.7"/>
    <line x1="${w * 0.66}" y1="0" x2="${w * 0.66}" y2="${h}" stroke="#A78BFA" stroke-width="1" opacity="0.7"/>
    <line x1="0" y1="0" x2="${w}" y2="${h}" stroke="#A78BFA" stroke-width="1" opacity="0.45"/>
    <line x1="${w}" y1="0" x2="0" y2="${h}" stroke="#A78BFA" stroke-width="1" opacity="0.45"/>
  </svg>`;
  cover.appendChild(overlay);
  return overlay;
}

function runWireframePulse(): void {
  if (effectRunning) return;
  effectRunning = true;

  showToast(TOAST_TEXT);

  const tier = document.documentElement.dataset.perf;
  if (prefersReducedMotion() || tier === 'low') {
    effectRunning = false;
    return;
  }

  const covers = Array.from(
    document.querySelectorAll<HTMLElement>('.project-cover-wrap, [data-project-cover], .featured__cover, .work-card__cover'),
  );

  const targets =
    covers.length > 0
      ? covers
      : Array.from(document.querySelectorAll<HTMLElement>('img.project-cover')).map(
          (img) => img.parentElement as HTMLElement,
        ).filter(Boolean);

  const overlays: HTMLElement[] = [];
  for (const cover of targets) {
    if (!cover) continue;
    const style = getComputedStyle(cover);
    if (style.position === 'static') cover.style.position = 'relative';
    cover.classList.add('egg-wireframe-host');
    overlays.push(paintWireframe(cover));
  }

  document.documentElement.dataset.eggWire = 'true';

  window.setTimeout(() => {
    for (const overlay of overlays) overlay.remove();
    for (const cover of targets) cover?.classList.remove('egg-wireframe-host');
    delete document.documentElement.dataset.eggWire;
    effectRunning = false;
  }, EFFECT_MS);
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  ) {
    return;
  }

  if (KONAMI[konamiIndex] === event.code) {
    konamiIndex += 1;
    if (konamiIndex >= KONAMI.length) {
      konamiIndex = 0;
      typedBuffer = '';
      runWireframePulse();
    }
  } else {
    konamiIndex = KONAMI[0] === event.code ? 1 : 0;
  }

  if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
    typedBuffer = (typedBuffer + event.key.toLowerCase()).slice(-WORD.length);
    if (typedBuffer === WORD) {
      typedBuffer = '';
      konamiIndex = 0;
      runWireframePulse();
    }
  }
}

function injectEggStyles(): void {
  if (document.getElementById('egg-styles')) return;
  const style = document.createElement('style');
  style.id = 'egg-styles';
  style.textContent = `
.egg-toast {
  position: fixed;
  left: 50%;
  bottom: max(1.25rem, env(safe-area-inset-bottom));
  z-index: 80;
  transform: translateX(-50%) translateY(120%);
  margin: 0;
  padding: 0.65rem 1rem;
  border: var(--stroke) solid var(--border-strong);
  background: var(--bg-elevated);
  color: var(--fg);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-mono);
  text-transform: none;
  opacity: 0;
  pointer-events: none;
  transition: transform var(--dur-2) var(--ease-out), opacity var(--dur-2) var(--ease-out);
  max-width: min(92vw, 28rem);
  text-align: center;
}
.egg-toast[data-open='true'] {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.egg-wireframe-host { isolation: isolate; }
.egg-wireframe {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
}
.egg-wireframe svg { display: block; width: 100%; height: 100%; }
html[data-egg-wire='true'] .project-cover { opacity: 0.18; }
@media (prefers-reduced-motion: reduce) {
  .egg-toast { transition: none; }
}
`;
  document.head.appendChild(style);
}

/** Once per full page load — not on View Transitions. */
export function mountDevEggs(): void {
  if (eggsBound) return;
  eggsBound = true;
  injectEggStyles();
  printConsoleCard();
  window.addEventListener('keydown', onKeyDown);
}

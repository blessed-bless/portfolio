import { initPerfProfile, onPerfChange, perfAllows } from './perf';
import { applyTheme, resolveInitialTheme } from './theme';

let cursorTeardown: (() => void) | null = null;
let resizeTimer = 0;
let chromeBound = false;
let stopLenisFn: (() => void) | null = null;

async function ensureCursor(): Promise<void> {
  if (!perfAllows('cursor')) {
    cursorTeardown?.();
    cursorTeardown = null;
    return;
  }
  const { canUseCustomCursor, isCursorMountedOn, mountCustomCursor } = await import('./cursor');
  if (!canUseCustomCursor()) {
    cursorTeardown?.();
    cursorTeardown = null;
    return;
  }

  const cursorRoot = document.querySelector<HTMLElement>('[data-site-cursor]');
  if (!cursorRoot) return;
  if (isCursorMountedOn(cursorRoot)) return;

  cursorTeardown?.();
  cursorTeardown = mountCustomCursor(cursorRoot);
}

async function bootChrome(): Promise<void> {
  applyTheme(resolveInitialTheme());

  // Lenis is desktop-only — on narrow/touch it fights native scroll and burns TBT.
  const allowLenis =
    perfAllows('lenis') &&
    window.matchMedia('(min-width: 901px)').matches &&
    window.matchMedia('(pointer: fine)').matches;

  if (allowLenis) {
    const { stopLenis, startLenis } = await import('./lenis-scroll');
    stopLenisFn = stopLenis;
    stopLenis();
    startLenis();
  } else {
    stopLenisFn?.();
    stopLenisFn = null;
  }

  await ensureCursor();
}

function bindResizeRefresh(): void {
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        void import('./scroll-sync')
          .then(({ ensureScrollTrigger }) => {
            try {
              ensureScrollTrigger().refresh();
            } catch {
              /* ok */
            }
          })
          .catch(() => undefined);
      }, 180);
    },
    { passive: true },
  );
}

initPerfProfile();

async function bootChromeAndHash(): Promise<void> {
  await bootChrome();
  const { scrollToHash } = await import('./hash-scroll');
  await scrollToHash();
}

function mountPrivacyChrome(): void {
  void import('./cookie-notice').then(({ mountCookieNotice }) => mountCookieNotice());
  void import('./lead-form').then(({ mountLeadForms }) => mountLeadForms());
}

void import('./raf-hub').then(({ bindVisibilityPause }) => bindVisibilityPause());
void import('./metrika').then(({ mountMetrika }) => mountMetrika());
void import('./dev-eggs').then(({ mountDevEggs }) => mountDevEggs());
void import('./page-transitions').then(({ mountPageTransitions }) => mountPageTransitions());
void import('./cover-lens').then(({ mountCoverLens }) => mountCoverLens());
void import('./heading-motion').then(({ mountHeadingMotion }) => mountHeadingMotion());
void import('./hash-scroll').then(({ mountHashScroll }) => mountHashScroll());
mountPrivacyChrome();
void bootChromeAndHash();

if (!chromeBound) {
  chromeBound = true;
  bindResizeRefresh();
  onPerfChange(() => {
    void bootChrome();
  });
}

document.addEventListener('astro:page-load', () => {
  void bootChromeAndHash();
  mountPrivacyChrome();
});
document.addEventListener('astro:before-swap', () => {
  stopLenisFn?.();
});

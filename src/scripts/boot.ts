import { getPerfTier, initPerfProfile, isLessMotionPreferred, onPerfChange, perfAllows } from './perf';
import { applyTheme, resolveInitialTheme } from './theme';

let cursorTeardown: (() => void) | null = null;
let chromeBound = false;
let stopMagnetic: (() => void) | null = null;
let magneticGen = 0;

function bootMagnetic(): void {
  const gen = ++magneticGen;
  if (isLessMotionPreferred() || getPerfTier() === 'low' ||
      !matchMedia('(min-width: 901px) and (pointer: fine)').matches) {
    stopMagnetic?.();
    stopMagnetic = null;
    document.documentElement.dataset.magnetic = '0';
    return;
  }
  void import('./magnetic').then(({ mountMagneticMotion }) => {
    if (gen !== magneticGen) return;
    stopMagnetic?.();
    stopMagnetic = mountMagneticMotion();
  });
}

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
  // Lenis stays off. Smoothed wheel scroll fights short pins and a real mouse.
  await ensureCursor();
}

initPerfProfile();

async function bootChromeAndHash(): Promise<void> {
  await bootChrome();
  const { scrollToHash } = await import('./hash-scroll');
  await scrollToHash();
}

function mountPrivacyChrome(): void {
  void import('./cookie-notice').then(({ mountCookieNotice }) => mountCookieNotice());
}

function mountPageCoverLens(): void {
  if (!document.querySelector('[data-cover-lens]')) return;
  void import('./cover-lens').then(({ mountCoverLens }) => mountCoverLens());
}

void import('./raf-hub').then(({ bindVisibilityPause }) => bindVisibilityPause());
void import('./dev-eggs').then(({ mountDevEggs }) => mountDevEggs());
void import('./page-transitions').then(({ mountPageTransitions }) => mountPageTransitions());
mountPageCoverLens();
void import('./heading-motion').then(({ mountHeadingMotion }) => mountHeadingMotion());
void import('./home-motion').then(({ mountHomeMotion }) => mountHomeMotion());
bootMagnetic();
void import('./hash-scroll').then(({ mountHashScroll }) => mountHashScroll());
mountPrivacyChrome();
void bootChromeAndHash();

if (!chromeBound) {
  chromeBound = true;
  onPerfChange(() => {
    void bootChrome();
    bootMagnetic();
  });
}

document.addEventListener('astro:page-load', () => {
  void bootChromeAndHash();
  mountPrivacyChrome();
  mountPageCoverLens();
  bootMagnetic();
  void import('./home-motion').then(({ mountHomeMotion }) => mountHomeMotion());
});
document.addEventListener('astro:before-swap', () => {
  magneticGen += 1;
  stopMagnetic?.();
  stopMagnetic = null;
  void import('./home-motion').then(({ stopHomeMotion }) => stopHomeMotion());
});

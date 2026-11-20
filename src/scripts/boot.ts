import { applyTheme, resolveInitialTheme } from './theme';
import { startLenis, stopLenis } from './lenis-scroll';
import { mountCustomCursor } from './cursor';
import { mountMetrika } from './metrika';
import { mountDevEggs } from './dev-eggs';
import { mountPageTransitions } from './page-transitions';
import { ensureScrollTrigger } from './scroll-sync';

let cursorTeardown: (() => void) | null = null;

function bootChrome(): void {
  applyTheme(resolveInitialTheme());
  stopLenis();
  startLenis();

  const cursorRoot = document.querySelector<HTMLElement>('[data-site-cursor]');
  cursorTeardown?.();
  cursorTeardown = null;
  if (cursorRoot) {
    cursorTeardown = mountCustomCursor(cursorRoot);
  }

  window.requestAnimationFrame(() => {
    try {
      ensureScrollTrigger().refresh();
    } catch {
      /* ok */
    }
  });
}

mountMetrika();
mountDevEggs();
mountPageTransitions();
bootChrome();

document.addEventListener('astro:page-load', bootChrome);
document.addEventListener('astro:before-swap', () => {
  cursorTeardown?.();
  cursorTeardown = null;
  stopLenis();
});

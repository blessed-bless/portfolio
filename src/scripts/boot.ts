import { applyTheme, resolveInitialTheme } from './theme';
import { startLenis, stopLenis } from './lenis-scroll';
import { mountCustomCursor } from './cursor';
import { runPreloader } from './preloader';

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

  const preloader = document.querySelector<HTMLElement>('[data-preloader]');
  if (preloader) {
    void runPreloader(preloader);
  }
}

bootChrome();

document.addEventListener('astro:page-load', bootChrome);
document.addEventListener('astro:before-swap', () => {
  cursorTeardown?.();
  cursorTeardown = null;
  stopLenis();
});

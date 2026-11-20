const STORAGE_KEY = 'portfolio-preloader-seen';
const MAX_MS = 1500;

export function shouldShowPreloader(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  // Headless / E2E: не мешаем скриншотам и аудиту
  if (navigator.webdriver) {
    return false;
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}

export function markPreloaderSeen(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function runPreloader(root: HTMLElement): Promise<void> {
  if (!shouldShowPreloader()) {
    root.remove();
    return Promise.resolve();
  }

  document.documentElement.dataset.preloading = 'true';
  root.hidden = false;
  const started = performance.now();

  return new Promise((resolve) => {
    const finish = (): void => {
      const elapsed = performance.now() - started;
      const wait = Math.max(0, Math.min(MAX_MS, 420) - elapsed);

      window.setTimeout(() => {
        root.dataset.state = 'leave';
        markPreloaderSeen();
        window.setTimeout(() => {
          document.documentElement.dataset.preloading = 'false';
          root.remove();
          resolve();
        }, 320);
      }, wait);
    };

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
      window.setTimeout(finish, MAX_MS);
    }
  });
}

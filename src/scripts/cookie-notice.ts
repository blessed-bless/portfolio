const STORAGE_KEY = 'portfolio-cookie-ok';
const BOUND = 'bound';

function accepted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* private mode */
  }
}

function hideNotice(root: HTMLElement): void {
  root.hidden = true;
  delete document.documentElement.dataset.showCookie;
}

export function mountCookieNotice(): void {
  const root = document.querySelector<HTMLElement>('div[data-cookie-banner]');
  if (!root) return;

  if (accepted()) {
    hideNotice(root);
    return;
  }

  document.documentElement.dataset.showCookie = '1';
  root.hidden = false;

  if (root.dataset[BOUND] === 'true') return;
  root.dataset[BOUND] = 'true';

  root.querySelector<HTMLButtonElement>('[data-cookie-ok]')?.addEventListener('click', () => {
    remember();
    hideNotice(root);
  });
}

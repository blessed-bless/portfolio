type AnalyticsChoice = 'allow' | 'decline';

const STORAGE_KEY = 'portfolio-analytics-choice';
let currentChoice: AnalyticsChoice | undefined;

export function analyticsChoice(): AnalyticsChoice | undefined {
  if (currentChoice) return currentChoice;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'allow' || stored === 'decline') currentChoice = stored;
  } catch {
    // The choice still applies to this page when storage is unavailable.
  }
  return currentChoice;
}

export function mountCookieNotice(): void {
  const root = document.querySelector<HTMLElement>('[data-cookie-banner]');
  const settings = document.querySelector<HTMLButtonElement>('[data-cookie-settings]');
  if (!root || !settings || !settings.hidden) return;

  const allow = root.querySelector<HTMLButtonElement>('[data-cookie-allow]');
  const decline = root.querySelector<HTMLButtonElement>('[data-cookie-decline]');
  const showNotice = (show: boolean): void => {
    root.hidden = !show;
    if (show) document.documentElement.dataset.showCookie = '1';
    else delete document.documentElement.dataset.showCookie;
  };

  let settingsOpened = false;
  const choose = (choice: AnalyticsChoice): void => {
    const previous = analyticsChoice();
    currentChoice = choice;
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Keep the in-memory choice and stop the counter below even without storage.
    }
    showNotice(false);
    if (settingsOpened) settings.focus({ preventScroll: true });
    settingsOpened = false;
    if (choice === 'allow') {
      void import('./metrika').then(({ mountMetrika }) => mountMetrika());
    } else if (previous === 'allow') {
      void import('./metrika').then(({ stopMetrika }) => stopMetrika());
    }
  };

  allow?.addEventListener('click', () => choose('allow'));
  decline?.addEventListener('click', () => choose('decline'));
  settings.addEventListener('click', () => {
    settingsOpened = true;
    showNotice(true);
    decline?.focus({ preventScroll: true });
  });
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !analyticsChoice()) return;
    showNotice(false);
    settingsOpened = false;
    settings.focus({ preventScroll: true });
  });
  settings.hidden = false;
  showNotice(!analyticsChoice());
  if (analyticsChoice() === 'allow') {
    void import('./metrika').then(({ mountMetrika }) => mountMetrika());
  }
}

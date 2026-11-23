import { goal } from './metrika';

const BOUND = 'leadFormBound';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const UTM_STORAGE_KEY = 'portfolio-utm';
const UTM_MAX_LEN = 200;

function clipUtm(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > UTM_MAX_LEN ? trimmed.slice(0, UTM_MAX_LEN) : trimmed;
}

function captureUtmFromUrl(): void {
  try {
    // First-touch: keep the landing UTMs for the whole session.
    if (sessionStorage.getItem(UTM_STORAGE_KEY)) return;

    const params = new URLSearchParams(location.search);
    const found: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value?.trim()) found[key] = clipUtm(value);
    }
    if (Object.keys(found).length === 0) return;
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
  } catch {
    /* private mode / quota */
  }
}

function readStoredUtm(): Partial<Record<(typeof UTM_KEYS)[number], string>> {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
    for (const key of UTM_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.trim()) out[key] = clipUtm(value);
    }
    return out;
  } catch {
    return {};
  }
}

function consentError(form: HTMLFormElement): HTMLElement | null {
  return form.querySelector<HTMLElement>('[data-lead-consent-error]');
}

function statusEl(form: HTMLFormElement): HTMLElement | null {
  return form.querySelector<HTMLElement>('[data-lead-status]');
}

function markConsent(form: HTMLFormElement, ok: boolean): void {
  const box = form.querySelector<HTMLInputElement>('input[name="consent"]');
  const err = consentError(form);
  if (box) {
    box.setAttribute('aria-invalid', ok ? 'false' : 'true');
  }
  if (err) {
    err.hidden = ok;
  }
}

function setStatus(form: HTMLFormElement, kind: 'success' | 'error' | 'clear'): void {
  const node = statusEl(form);
  if (!node) return;
  if (kind === 'clear') {
    node.hidden = true;
    node.textContent = '';
    node.dataset.kind = '';
    return;
  }
  const message =
    kind === 'success' ? form.dataset.statusSuccess || '' : form.dataset.statusError || '';
  node.textContent = message;
  node.dataset.kind = kind;
  node.hidden = !message;
}

function utmLines(): string[] {
  captureUtmFromUrl();
  const stored = readStoredUtm();
  const rows = UTM_KEYS.flatMap((key) => {
    const value = stored[key];
    return value ? [`${key}: ${value}`] : [];
  });
  return rows.length ? ['', 'UTM:', ...rows] : [];
}

function buildTelegramHref(form: HTMLFormElement): string | null {
  const base = form.dataset.telegram?.replace(/\/$/, '');
  if (!base) return null;

  const data = new FormData(form);
  const name = String(data.get('name') ?? '').trim();
  const contact = String(data.get('contact') ?? '').trim();
  const message = String(data.get('message') ?? '').trim();
  if (!name || !contact || !message) return null;

  const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
  const lines =
    lang === 'en'
      ? [`Request from the site`, `Name: ${name}`, `Contact: ${contact}`, '', message, ...utmLines()]
      : [`Заявка с сайта`, `Имя: ${name}`, `Контакт: ${contact}`, '', message, ...utmLines()];

  return `${base}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function onSubmit(event: Event): void {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  setStatus(form, 'clear');

  const data = new FormData(form);
  // Honeypot: bots fill hidden "company"; humans never see it.
  if (String(data.get('company') ?? '').trim()) {
    setStatus(form, 'success');
    form.reset();
    markConsent(form, true);
    return;
  }

  const consent = form.querySelector<HTMLInputElement>('input[name="consent"]');
  if (!consent?.checked) {
    markConsent(form, false);
    setStatus(form, 'error');
    consent?.focus();
    return;
  }
  markConsent(form, true);

  if (!form.reportValidity()) {
    setStatus(form, 'error');
    return;
  }

  const href = buildTelegramHref(form);
  if (!href) {
    setStatus(form, 'error');
    return;
  }

  const submit = form.querySelector<HTMLButtonElement>('[data-lead-submit]');
  const idle = submit?.dataset.labelIdle ?? '';
  const busy = submit?.dataset.labelBusy ?? idle;
  if (submit) {
    submit.disabled = true;
    submit.textContent = busy;
  }

  goal('lead_submit', { from: 'contact' });
  window.open(href, '_blank', 'noopener,noreferrer');
  setStatus(form, 'success');

  window.setTimeout(() => {
    if (submit) {
      submit.disabled = false;
      submit.textContent = idle;
    }
  }, 1200);
}

function onConsentChange(event: Event): void {
  const input = event.currentTarget;
  if (!(input instanceof HTMLInputElement)) return;
  const form = input.closest('form');
  if (!(form instanceof HTMLFormElement)) return;
  if (input.checked) {
    markConsent(form, true);
    setStatus(form, 'clear');
  }
}

export function mountLeadForms(): void {
  captureUtmFromUrl();
  document.querySelectorAll<HTMLFormElement>('[data-lead-form]').forEach((form) => {
    if (form.dataset[BOUND] === 'true') return;
    form.dataset[BOUND] = 'true';
    form.addEventListener('submit', onSubmit);
    const consent = form.querySelector<HTMLInputElement>('input[name="consent"]');
    consent?.addEventListener('change', onConsentChange);
  });
}

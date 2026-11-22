import { goal } from './metrika';

const BOUND = 'leadFormBound';

function consentError(form: HTMLFormElement): HTMLElement | null {
  return form.querySelector<HTMLElement>('[data-lead-consent-error]');
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
      ? [`Request from the site`, `Name: ${name}`, `Contact: ${contact}`, '', message]
      : [`Заявка с сайта`, `Имя: ${name}`, `Контакт: ${contact}`, '', message];

  return `${base}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function onSubmit(event: Event): void {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();

  const consent = form.querySelector<HTMLInputElement>('input[name="consent"]');
  if (!consent?.checked) {
    markConsent(form, false);
    consent?.focus();
    return;
  }
  markConsent(form, true);

  if (!form.reportValidity()) return;

  const href = buildTelegramHref(form);
  if (!href) return;

  const submit = form.querySelector<HTMLButtonElement>('[data-lead-submit]');
  const idle = submit?.dataset.labelIdle ?? '';
  const busy = submit?.dataset.labelBusy ?? idle;
  if (submit) {
    submit.disabled = true;
    submit.textContent = busy;
  }

  goal('lead_submit', { from: 'contact' });
  window.open(href, '_blank', 'noopener,noreferrer');

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
  if (input.checked) markConsent(form, true);
}

export function mountLeadForms(): void {
  document.querySelectorAll<HTMLFormElement>('[data-lead-form]').forEach((form) => {
    if (form.dataset[BOUND] === 'true') return;
    form.dataset[BOUND] = 'true';
    form.addEventListener('submit', onSubmit);
    const consent = form.querySelector<HTMLInputElement>('input[name="consent"]');
    consent?.addEventListener('change', onConsentChange);
  });
}

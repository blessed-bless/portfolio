import { contactLinks } from '../../data/home';
import { demoLocale, demoShell } from '../../i18n/demo-copy';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function wait(ms: number): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function button(label: string, opts?: { primary?: boolean; pressed?: boolean }): HTMLButtonElement {
  const btn = el('button', `demo-ui__btn${opts?.primary ? ' demo-ui__btn--primary' : ''}`, label);
  btn.type = 'button';
  if (opts?.pressed != null) btn.setAttribute('aria-pressed', String(opts.pressed));
  return btn;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}

export function wantSameCta(projectLabel: string): HTMLAnchorElement {
  const base = contactLinks.telegram.replace(/\/$/, '');
  const copy = demoShell(demoLocale());
  const text = encodeURIComponent(copy.wantSameText(projectLabel));
  const link = el('a', 'demo-ui__btn demo-ui__btn--primary demo-ui__cta', copy.wantSame);
  link.href = `${base}?text=${text}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('data-cursor', 'hover');
  return link;
}

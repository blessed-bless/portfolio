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

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function mountReadingProgress(bar: HTMLElement): () => void {
  const onScroll = (): void => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${value})`;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}

export function mountCodeCopy(root: HTMLElement): () => void {
  const blocks = [...root.querySelectorAll('pre')];
  const cleanups: Array<() => void> = [];

  blocks.forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-block')) return;
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.parentNode?.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-block__copy mono';
    button.textContent = 'Копировать';
    button.setAttribute('data-cursor', 'hover');
    wrap.appendChild(button);

    const onClick = async (): Promise<void> => {
      const text = pre.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Скопировано';
      } catch {
        button.textContent = 'Не вышло';
      }
      window.setTimeout(() => {
        button.textContent = 'Копировать';
      }, 1600);
    };
    button.addEventListener('click', () => {
      void onClick();
    });
    cleanups.push(() => button.removeEventListener('click', onClick));
  });

  return () => cleanups.forEach((fn) => fn());
}

export function mountNextCase(trigger: HTMLElement, href: string): () => void {
  if (prefersReducedMotion() || !href) return () => undefined;

  let armed = false;
  let navigating = false;

  const go = (): void => {
    if (navigating) return;
    navigating = true;
    void import('astro:transitions/client').then(({ navigate }) => {
      navigate(href);
    });
  };

  const onScroll = (): void => {
    const rect = trigger.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.72) armed = true;
    if (armed && rect.top < window.innerHeight * 0.35) go();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}

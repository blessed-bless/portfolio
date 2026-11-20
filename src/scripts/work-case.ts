import { demoLocale, demoShell } from '../i18n/demo-copy';

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
  const copy = demoShell(demoLocale());
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
    button.textContent = copy.copy;
    button.setAttribute('data-cursor', 'hover');
    wrap.appendChild(button);

    const onClick = async (): Promise<void> => {
      const text = pre.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = copy.copied;
      } catch {
        button.textContent = copy.copyFailed;
      }
      window.setTimeout(() => {
        button.textContent = copy.copy;
      }, 1600);
    };
    button.addEventListener('click', () => {
      void onClick();
    });
    cleanups.push(() => button.removeEventListener('click', onClick));
  });

  return () => cleanups.forEach((fn) => fn());
}

export function mountMobileNav(root: HTMLElement): () => void {
  const toggle = root.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const panel = root.querySelector<HTMLElement>('[data-nav-panel]');
  const links = Array.from(panel?.querySelectorAll<HTMLElement>('a') ?? []);
  if (!toggle || !panel) return () => undefined;

  let open = false;
  let lastFocus: HTMLElement | null = null;
  let tween: { kill: () => void } | null = null;

  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setOpen = async (next: boolean): Promise<void> => {
    if (next === open) return;
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    root.dataset.navOpen = open ? 'true' : 'false';
    document.body.classList.toggle('nav-lock', open);

    if (open) {
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      const items = panel.querySelectorAll<HTMLElement>('[data-nav-item]');
      if (reduce()) {
        items.forEach((item) => {
          item.style.opacity = '1';
          item.style.transform = 'none';
        });
        links[0]?.focus();
        return;
      }
      const gsap = (await import('gsap')).default;
      tween?.kill();
      gsap.set(items, { opacity: 0, y: 18 });
      tween = gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.42,
        stagger: 0.05,
        ease: 'power2.out',
        onComplete: () => links[0]?.focus(),
      });
      return;
    }

    panel.setAttribute('aria-hidden', 'true');
    if (reduce()) {
      panel.hidden = true;
      lastFocus?.focus();
      return;
    }
    const gsap = (await import('gsap')).default;
    const items = panel.querySelectorAll<HTMLElement>('[data-nav-item]');
    tween?.kill();
    tween = gsap.to(items, {
      opacity: 0,
      y: 10,
      duration: 0.18,
      stagger: 0.02,
      ease: 'power1.in',
      onComplete: () => {
        panel.hidden = true;
        lastFocus?.focus();
      },
    });
  };

  const onToggle = (): void => {
    void setOpen(!open);
  };

  const onKey = (event: KeyboardEvent): void => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      void setOpen(false);
      return;
    }
    if (event.key !== 'Tab' || links.length === 0) return;
    const first = links[0];
    const last = links[links.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onLink = (): void => {
    void setOpen(false);
  };

  toggle.addEventListener('click', onToggle);
  document.addEventListener('keydown', onKey);
  links.forEach((link) => link.addEventListener('click', onLink));

  return () => {
    toggle.removeEventListener('click', onToggle);
    document.removeEventListener('keydown', onKey);
    links.forEach((link) => link.removeEventListener('click', onLink));
    document.body.classList.remove('nav-lock');
    tween?.kill();
  };
}

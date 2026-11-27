import { getPerfTier, isLessMotionPreferred } from './perf';

export function mountMobileNav(root: HTMLElement): () => void {
  const toggle = root.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const panel = root.querySelector<HTMLElement>('[data-nav-panel]');
  if (!toggle || !panel) return () => undefined;

  const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>('a'));
  const controls = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'));
  const mobile = matchMedia('(max-width: 768px)');
  let open = false;
  let animation: Animation | null = null;

  const setOpen = (next: boolean): void => {
    if (next === open) return;

    const opacity = panel.hidden ? 0 : Number(getComputedStyle(panel).opacity);
    animation?.cancel();
    animation = null;
    open = next;

    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.labelClose || 'Close menu' : toggle.dataset.labelOpen || 'Open menu');
    root.dataset.navOpen = String(open);
    document.body.classList.toggle('nav-lock', open);

    if (!open && mobile.matches) toggle.focus({ preventScroll: true });
    panel.inert = !open;
    panel.setAttribute('aria-hidden', String(!open));

    if (isLessMotionPreferred() || getPerfTier() === 'low') {
      panel.hidden = !open;
      if (open) controls[0]?.focus({ preventScroll: true });
      return;
    }

    panel.hidden = false;
    const fade = panel.animate([{ opacity }, { opacity: open ? 1 : 0 }], {
      duration: open ? 180 : 120,
      easing: getComputedStyle(panel).getPropertyValue('--ease-out').trim(),
    });
    animation = fade;
    fade.onfinish = () => {
      animation = null;
      panel.hidden = !open;
    };
    if (open) controls[0]?.focus({ preventScroll: true });
  };

  const onToggle = (): void => setOpen(!open);
  const close = (): void => setOpen(false);
  const onResize = (): void => {
    if (!mobile.matches) close();
  };

  const onKey = (event: KeyboardEvent): void => {
    if (!open || document.documentElement.dataset.cmdkOpen === 'true') return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab' || controls.length === 0) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  toggle.addEventListener('click', onToggle);
  document.addEventListener('keydown', onKey);
  mobile.addEventListener('change', onResize);
  links.forEach((link) => link.addEventListener('click', close));

  return () => {
    toggle.removeEventListener('click', onToggle);
    document.removeEventListener('keydown', onKey);
    mobile.removeEventListener('change', onResize);
    links.forEach((link) => link.removeEventListener('click', close));
    document.body.classList.remove('nav-lock');
    animation?.cancel();
  };
}

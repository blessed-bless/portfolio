import { cloneCoverWithoutVt } from './cover-vt';
import { getPerfTier } from './perf';
import { subscribeTicker } from './raf-hub';

type ViewMode = 'list' | 'grid';

function prefersReducedMotion(): boolean {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || getPerfTier() === 'low'
  );
}

async function loadFlip() {
  const gsap = (await import('gsap')).default;
  const { Flip } = await import('gsap/Flip');
  gsap.registerPlugin(Flip);
  return { gsap, Flip };
}

function readParams(): { view: ViewMode; tag: string } {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') === 'list' ? 'list' : 'grid';
  const tag = params.get('tag') || 'all';
  return { view, tag };
}

function writeParams(view: ViewMode, tag: string): void {
  const params = new URLSearchParams(window.location.search);
  params.set('view', view);
  if (tag === 'all') params.delete('tag');
  else params.set('tag', tag);
  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', next);
}

export function mountWorkIndex(root: HTMLElement): () => void {
  const list = root.querySelector<HTMLElement>('[data-work-list]');
  const items = [...root.querySelectorAll<HTMLElement>('[data-work-item]')];
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-work-view]')];
  const tagButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-work-tag]')];
  const follower = root.querySelector<HTMLElement>('[data-work-follower]');
  const media = follower?.querySelector<HTMLElement>('[data-work-follower-media]');

  if (!list) return () => undefined;

  let { view, tag } = readParams();
  const reduce = prefersReducedMotion();
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let flipReady: Awaited<ReturnType<typeof loadFlip>> | null = null;

  const ensureFlip = async () => {
    if (reduce) return null;
    flipReady ??= await loadFlip();
    return flipReady;
  };

  const mouse = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  const prev = { x: 0, y: 0 };
  let skew = 0;
  let visible = false;

  const syncChrome = (): void => {
    root.dataset.view = view;
    viewButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.workView === view));
    });
    tagButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.workTag === tag));
    });
  };

  const applyFilter = (animate: boolean): void => {
    void (async () => {
      const lib = animate ? await ensureFlip() : null;
      const state = lib ? lib.Flip.getState(items) : null;
      items.forEach((item) => {
        const tags = (item.dataset.tags || '').split(',').filter(Boolean);
        const show = tag === 'all' || tags.includes(tag);
        item.hidden = !show;
        item.style.display = show ? '' : 'none';
      });
      if (lib && state) {
        lib.Flip.from(state, {
          duration: 0.45,
          ease: 'power2.out',
          absolute: false,
          nested: true,
          onEnter: (elements) =>
            lib.gsap.fromTo(elements, { opacity: 0 }, { opacity: 1, duration: 0.3 }),
          onLeave: (elements) => lib.gsap.to(elements, { opacity: 0, duration: 0.2 }),
        });
      }
    })();
  };

  const setView = (next: ViewMode, animate = true): void => {
    view = next;
    writeParams(view, tag);
    syncChrome();
    if (!animate || reduce) {
      root.dataset.view = view;
      return;
    }
    void (async () => {
      const lib = await ensureFlip();
      if (!lib) {
        root.dataset.view = view;
        return;
      }
      const state = lib.Flip.getState(items);
      root.dataset.view = view;
      lib.Flip.from(state, { duration: 0.4, ease: 'power2.out' });
    })();
  };

  const setTag = (next: string): void => {
    tag = next;
    writeParams(view, tag);
    syncChrome();
    applyFilter(true);
  };

  const hideFollower = (): void => {
    visible = false;
    if (follower) follower.dataset.visible = 'false';
  };

  const showFollower = (row: HTMLElement, event?: Event): void => {
    if (!follower || view !== 'list' || coarse || reduce) return;
    const cover = row.querySelector('.project-cover-wrap') ?? row.querySelector('.project-cover');
    if (media && cover) media.replaceChildren(cloneCoverWithoutVt(cover));
    if (event && 'clientX' in event) {
      const pointer = event as PointerEvent;
      mouse.x = pointer.clientX;
      mouse.y = pointer.clientY;
      pos.x = pointer.clientX;
      pos.y = pointer.clientY;
      prev.x = pointer.clientX;
      prev.y = pointer.clientY;
      follower.style.transform = `translate3d(${pos.x + 28}px, ${pos.y - 40}px, 0)`;
    }
    follower.dataset.visible = 'true';
    visible = true;
  };

  const onMove = (event: PointerEvent): void => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  };

  const smoothFollow = getPerfTier() === 'high';
  const tick = (): void => {
    if (!visible || !follower) return;
    if (!smoothFollow) {
      follower.style.transform = `translate3d(${mouse.x + 28}px, ${mouse.y - 40}px, 0)`;
      return;
    }
    pos.x += (mouse.x - pos.x) * 0.16;
    pos.y += (mouse.y - pos.y) * 0.16;
    const vx = pos.x - prev.x;
    prev.x = pos.x;
    prev.y = pos.y;
    skew += (vx * 0.35 - skew) * 0.18;
    follower.style.transform = `translate3d(${pos.x + 28}px, ${pos.y - 40}px, 0) skewX(${skew}deg)`;
  };

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.workView === 'grid' ? 'grid' : 'list';
      setView(next);
    });
  });

  tagButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setTag(button.dataset.workTag || 'all');
    });
  });

  items.forEach((item) => {
    item.addEventListener('pointerenter', (event) => showFollower(item, event));
    item.addEventListener('pointerleave', hideFollower);
    item.addEventListener('focus', () => showFollower(item));
    item.addEventListener('blur', hideFollower);
  });

  window.addEventListener('pointermove', onMove, { passive: true });
  const unsubTicker = subscribeTicker(tick);

  syncChrome();
  applyFilter(false);

  return () => {
    unsubTicker();
    window.removeEventListener('pointermove', onMove);
    hideFollower();
  };
}

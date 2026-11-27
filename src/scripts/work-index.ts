import { cloneCoverWithoutVt } from './cover-vt';
import { getPerfTier, isLessMotionPreferred } from './perf';
import { subscribeTicker } from './raf-hub';

type ViewMode = 'list' | 'grid';

function prefersReducedMotion(): boolean {
  return (
    isLessMotionPreferred() || getPerfTier() === 'low'
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
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let flipReady: Awaited<ReturnType<typeof loadFlip>> | null = null;

  const ensureFlip = async () => {
    if (prefersReducedMotion()) return null;
    flipReady ??= await loadFlip();
    return flipReady;
  };

  const mouse = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
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

  let layoutRevision = 0;
  const updateLayout = (animate: boolean): void => {
    const revision = ++layoutRevision;
    const render = (lib: Awaited<ReturnType<typeof loadFlip>> | null): void => {
      if (revision !== layoutRevision || !root.isConnected) return;
      const state = lib?.Flip.getState(items);
      syncChrome();
      items.forEach((item) => {
        const tags = (item.dataset.tags || '').split(',').filter(Boolean);
        const show = tag === 'all' || tags.includes(tag);
        item.hidden = !show;
        item.style.display = show ? '' : 'none';
      });
      if (lib && state) {
        lib.Flip.from(state, {
          duration: 0.36,
          ease: 'power2.out',
          nested: true,
          onEnter: (elements) => lib.gsap.fromTo(elements, { opacity: 0 }, { opacity: 1, duration: 0.24 }),
        });
      }
    };
    if (!animate || prefersReducedMotion()) render(null);
    else void ensureFlip().then(render, (error) => {
      console.warn('Portfolio layout animation is unavailable', error);
      render(null);
    });
  };

  const setView = (next: ViewMode): void => {
    if (view === next) return;
    view = next;
    writeParams(view, tag);
    hideFollower();
    updateLayout(true);
  };

  const setTag = (next: string): void => {
    if (tag === next) return;
    tag = next;
    writeParams(view, tag);
    hideFollower();
    updateLayout(true);
  };

  const hideFollower = (): void => {
    visible = false;
    if (follower) follower.dataset.visible = 'false';
  };

  const showFollower = (row: HTMLElement, event?: Event): void => {
    if (!follower || view !== 'list' || coarse || prefersReducedMotion()) return;
    const cover = row.querySelector('.project-cover-wrap') ?? row.querySelector('.project-cover');
    if (media && cover) media.replaceChildren(cloneCoverWithoutVt(cover));
    const rect = row.getBoundingClientRect();
    mouse.x = event instanceof PointerEvent ? event.clientX : rect.right;
    mouse.y = event instanceof PointerEvent ? event.clientY : rect.top;
    pos.x = mouse.x;
    pos.y = mouse.y;
    placeFollower(pos.x, pos.y);
    follower.dataset.visible = 'true';
    visible = true;
  };

  const onMove = (event: PointerEvent): void => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  };

  const placeFollower = (x: number, y: number): void => {
    if (!follower) return;
    const gap = 16;
    const width = follower.offsetWidth;
    const height = follower.offsetHeight;
    const left = Math.max(gap, Math.min(window.innerWidth - width - gap, x + 28));
    const top = Math.max(gap, Math.min(window.innerHeight - height - gap, y - 40));
    follower.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  };

  const smoothFollow = getPerfTier() === 'high';
  const tick = (): void => {
    if (!visible || !follower) return;
    if (prefersReducedMotion()) {
      hideFollower();
      return;
    }
    if (!smoothFollow) {
      placeFollower(mouse.x, mouse.y);
      return;
    }
    pos.x += (mouse.x - pos.x) * 0.2;
    pos.y += (mouse.y - pos.y) * 0.2;
    placeFollower(pos.x, pos.y);
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

  updateLayout(false);

  return () => {
    layoutRevision += 1;
    unsubTicker();
    window.removeEventListener('pointermove', onMove);
    hideFollower();
  };
}

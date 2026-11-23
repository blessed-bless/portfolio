import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import {
  bindLenisToScrollTrigger,
  ensureScrollTrigger,
  isDesktopLayout,
  prefersReducedMotion,
} from './scroll-sync';
import { assignCoverVtName, cloneCoverWithoutVt } from './cover-vt';
import { getPerfTier, onPerfChange } from './perf';
import { promoteToGsapTicker } from './raf-hub';

type Teardown = () => void;

const teardowns: Teardown[] = [];

function clearTeardowns(): void {
  while (teardowns.length) {
    teardowns.pop()?.();
  }
}

function mountManifest(): void {
  const root = document.querySelector<HTMLElement>('[data-manifest]');
  if (!root) return;
  const words = root.querySelectorAll<HTMLElement>('.manifest__word');
  if (!words.length) return;

  const reduce = prefersReducedMotion();
  words.forEach((word) => {
    word.style.setProperty('--word-glow', reduce ? '1' : '0.28');
  });
  if (reduce) return;

  const ScrollTrigger = ensureScrollTrigger();
  const tier = document.documentElement.dataset.perf;
  const useScrub = tier === 'high';
  const tween = gsap.to(words, {
    '--word-glow': 1,
    ease: 'none',
    stagger: 0.08,
    scrollTrigger: {
      trigger: root,
      start: 'top 75%',
      end: 'bottom 35%',
      scrub: useScrub ? true : false,
      once: !useScrub,
    },
  });

  teardowns.push(() => {
    tween.scrollTrigger?.kill();
    tween.kill();
    ScrollTrigger.getAll()
      .filter((st) => st.trigger === root)
      .forEach((st) => st.kill());
  });
}

type FeaturedMode = 'sticky' | 'static';

function featuredMode(): FeaturedMode {
  if (prefersReducedMotion() || getPerfTier() === 'low' || !isDesktopLayout()) return 'static';
  return 'sticky';
}

function mountFeaturedPreview(): void {
  const section = document.querySelector<HTMLElement>('[data-featured]');
  const list = section?.querySelector<HTMLElement>('[data-featured-list]');
  if (!section || !list) return;

  const mode = featuredMode();
  section.dataset.featuredMode = mode;
  const rows = [...list.querySelectorAll<HTMLAnchorElement>('[data-featured-row]')];
  const media = section.querySelector<HTMLElement>('[data-featured-media]');
  const preview = section.querySelector<HTMLAnchorElement>('[data-featured-preview]');
  if (!rows.length) return;

  const prepareVt = (row: HTMLAnchorElement): void => {
    const slug = row.dataset.slug;
    if (!slug) return;
    const previewCover = media?.querySelector<HTMLElement>('.project-cover-wrap');
    const rowCover = row.querySelector<HTMLElement>('.project-cover-wrap');
    const previewVisible = Boolean(preview && preview.getClientRects().length > 0 && previewCover);
    const source = previewVisible ? previewCover : rowCover;
    if (source) assignCoverVtName(source, slug);
  };

  const onPointerDown = (event: Event): void => {
    prepareVt(event.currentTarget as HTMLAnchorElement);
  };

  const onPreviewDown = (): void => {
    const active = rows.find((row) => row.dataset.active === 'true') ?? rows[0];
    if (active) prepareVt(active);
  };

  rows.forEach((row) => row.addEventListener('pointerdown', onPointerDown));
  preview?.addEventListener('pointerdown', onPreviewDown);

  if (mode === 'static' || !media) {
    teardowns.push(() => {
      rows.forEach((row) => row.removeEventListener('pointerdown', onPointerDown));
      preview?.removeEventListener('pointerdown', onPreviewDown);
    });
    return;
  }

  gsap.registerPlugin(Flip);
  const ScrollTrigger = ensureScrollTrigger();
  let activeIndex = 0;
  const triggers: Array<{ kill: () => void }> = [];

  const existing = media.querySelector<HTMLElement>('.project-cover-wrap');
  if (existing) existing.dataset.flipId = 'featured-shot';
  rows.forEach((row, index) => {
    row.dataset.active = index === 0 ? 'true' : 'false';
  });

  const showCover = (index: number): void => {
    const nextIndex = Math.min(rows.length - 1, Math.max(0, index));
    const row = rows[nextIndex];
    if (!row) return;
    if (preview) preview.href = row.href;
    if (nextIndex === activeIndex && media.querySelector('[data-flip-id]')) return;
    activeIndex = nextIndex;
    rows.forEach((item, i) => {
      item.dataset.active = i === nextIndex ? 'true' : 'false';
    });
    const cover = row.querySelector('.project-cover-wrap');
    if (!cover) return;
    const incoming = cloneCoverWithoutVt(cover);
    incoming.dataset.flipId = 'featured-shot';
    const previous = media.querySelector<HTMLElement>('[data-flip-id]');
    if (!previous) {
      media.replaceChildren(incoming);
      return;
    }
    const state = Flip.getState(previous);
    media.replaceChildren(incoming);
    Flip.from(state, {
      duration: 0.32,
      ease: 'power3.out',
      absolute: true,
      prune: true,
    });
  };

  const onFocus = (event: Event): void => {
    const row = event.currentTarget as HTMLAnchorElement;
    const index = rows.indexOf(row);
    if (index >= 0) showCover(index);
  };

  rows.forEach((row) => {
    row.addEventListener('focus', onFocus);
    row.addEventListener('pointerenter', onFocus);
  });

  rows.forEach((row, index) => {
    triggers.push(
      ScrollTrigger.create({
        trigger: row,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) showCover(index);
        },
      }),
    );
  });

  teardowns.push(() => {
    rows.forEach((row) => {
      row.removeEventListener('pointerdown', onPointerDown);
      row.removeEventListener('focus', onFocus);
      row.removeEventListener('pointerenter', onFocus);
      row.dataset.active = 'false';
    });
    preview?.removeEventListener('pointerdown', onPreviewDown);
    triggers.forEach((trigger) => trigger.kill());
    list.style.transform = '';
    gsap.killTweensOf(media.querySelectorAll('[data-flip-id]'));
  });
}

function mountServicesPin(): void {
  const section = document.querySelector<HTMLElement>('[data-services]');
  const track = document.querySelector<HTMLElement>('[data-services-track]');
  if (!section || !track) return;

  const reduce = prefersReducedMotion();
  if (reduce || !isDesktopLayout()) return;

  const ScrollTrigger = ensureScrollTrigger();
  const getTravel = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);

  const tier = document.documentElement.dataset.perf;
  if (tier === 'low') return;

  const tween = gsap.to(track, {
    x: () => -getTravel(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${getTravel()}`,
      pin: true,
      scrub: tier === 'high' ? true : 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  teardowns.push(() => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(track, { clearProps: 'transform' });
    ScrollTrigger.getAll()
      .filter((st) => st.trigger === section)
      .forEach((st) => st.kill());
  });
}

function mountStackMarquee(): void {
  const root = document.querySelector<HTMLElement>('[data-stack]');
  if (!root) return;
  const rows = root.querySelectorAll<HTMLElement>('[data-marquee-row]');
  if (!rows.length) return;

  const reduce = prefersReducedMotion();
  if (reduce) {
    rows.forEach((row) => {
      row.style.animationPlayState = 'paused';
    });
    return;
  }

  const onEnter = () => {
    root.dataset.paused = 'true';
  };
  const onLeave = () => {
    root.dataset.paused = 'false';
  };
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);

  teardowns.push(() => {
    root.removeEventListener('pointerenter', onEnter);
    root.removeEventListener('pointerleave', onLeave);
    root.dataset.paused = 'false';
  });
}

function mountMagneticTitle(): void {
  const title = document.querySelector<HTMLElement>('[data-magnetic-title]');
  if (!title) return;

  const reduce = prefersReducedMotion();
  const letters = title.querySelectorAll<HTMLElement>('.contact__letter');
  if (!letters.length || reduce || !isDesktopLayout()) return;

  const strength = 18;
  const onMove = (event: PointerEvent): void => {
    letters.forEach((letter) => {
      const rect = letter.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const pull = Math.max(0, 1 - dist / 220);
      letter.style.transform = `translate3d(${dx * pull * 0.12}px, ${dy * pull * 0.12}px, 0)`;
      letter.style.setProperty('--letter-lift', String(pull * strength));
    });
  };

  const onLeave = (): void => {
    letters.forEach((letter) => {
      letter.style.transform = '';
      letter.style.setProperty('--letter-lift', '0');
    });
  };

  title.addEventListener('pointermove', onMove);
  title.addEventListener('pointerleave', onLeave);

  teardowns.push(() => {
    title.removeEventListener('pointermove', onMove);
    title.removeEventListener('pointerleave', onLeave);
    onLeave();
  });
}

function mountCopyEmail(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-copy-email]');
  const toast = document.querySelector<HTMLElement>('[data-copy-toast]');
  if (!button) return;

  let timer = 0;
  const showToast = (message: string): void => {
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.open = 'true';
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      toast.dataset.open = 'false';
    }, 1800);
  };

  const onClick = (): void => {
    const email = button.dataset.email || button.textContent?.trim() || '';
    if (!email || email.includes('{{')) {
      showToast('Почта ещё не заполнена');
      return;
    }
    void navigator.clipboard.writeText(email).then(
      () => {
        showToast('Почта скопирована');
        void import('./metrika').then(({ goal }) => goal('email_click', { from: 'copy' }));
      },
      () => showToast('Не удалось скопировать'),
    );
  };

  button.addEventListener('click', onClick);
  teardowns.push(() => {
    button.removeEventListener('click', onClick);
    window.clearTimeout(timer);
  });
}

export function mountHomePage(): void {
  clearTeardowns();
  void promoteToGsapTicker();
  const ScrollTrigger = ensureScrollTrigger();
  ScrollTrigger.getAll().forEach((st) => st.kill());

  const unbind = bindLenisToScrollTrigger();
  teardowns.push(unbind);

  mountManifest();
  mountFeaturedPreview();
  mountServicesPin();
  mountStackMarquee();
  mountMagneticTitle();
  mountCopyEmail();

  teardowns.push(
    onPerfChange(() => {
      mountHomePage();
    }),
  );

  ScrollTrigger.refresh();
}

export function unmountHomePage(): void {
  clearTeardowns();
  ensureScrollTrigger().getAll().forEach((st) => st.kill());
}

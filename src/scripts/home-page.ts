import gsap from 'gsap';
import {
  bindLenisToScrollTrigger,
  ensureScrollTrigger,
  isDesktopLayout,
  prefersReducedMotion,
} from './scroll-sync';
import { assignCoverVtName, cloneCoverWithoutVt } from './cover-vt';

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
  const tween = gsap.to(words, {
    '--word-glow': 1,
    ease: 'none',
    stagger: 0.08,
    scrollTrigger: {
      trigger: root,
      start: 'top 75%',
      end: 'bottom 35%',
      scrub: true,
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

function mountFeaturedPreview(): void {
  const list = document.querySelector<HTMLElement>('[data-featured]');
  const follower = document.querySelector<HTMLElement>('[data-featured-follower]');
  if (!list || !follower) return;

  const reduce = prefersReducedMotion();
  const mobile = !isDesktopLayout() || window.matchMedia('(pointer: coarse)').matches;
  const rows = list.querySelectorAll<HTMLAnchorElement>('[data-featured-row]');
  const media = follower.querySelector<HTMLElement>('[data-featured-media]');

  let activeRow: HTMLAnchorElement | null = null;
  let visible = false;
  const mouse = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  const prev = { x: 0, y: 0 };
  let skew = 0;
  let raf = 0;

  const hide = (): void => {
    visible = false;
    follower.dataset.visible = 'false';
    activeRow = null;
  };

  const showFor = (row: HTMLAnchorElement, event?: Event): void => {
    activeRow = row;
    const cover = row.querySelector('.project-cover-wrap') ?? row.querySelector('.project-cover');
    if (media && cover) {
      media.replaceChildren(cloneCoverWithoutVt(cover));
    }
    if (mobile || reduce) {
      follower.dataset.mode = 'static';
      follower.dataset.visible = 'true';
      return;
    }
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
    follower.dataset.mode = 'follow';
    follower.dataset.visible = 'true';
    visible = true;
  };

  const prepareVt = (row: HTMLAnchorElement): void => {
    const slug = row.dataset.slug;
    if (!slug) return;
    const followerCover = media?.querySelector<HTMLElement>('.project-cover-wrap');
    const rowCover = row.querySelector<HTMLElement>('.project-cover-wrap');
    const source =
      follower.dataset.visible === 'true' && followerCover ? followerCover : rowCover;
    if (source) assignCoverVtName(source, slug);
  };

  const onEnter = (event: Event): void => {
    const row = event.currentTarget as HTMLAnchorElement;
    showFor(row, event);
  };

  const onLeave = (): void => {
    if (mobile || reduce) {
      if (!list.matches(':hover')) hide();
      return;
    }
    hide();
  };

  const onMove = (event: PointerEvent): void => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  };

  const tick = (): void => {
    raf = requestAnimationFrame(tick);
    if (!visible || mobile || reduce) return;
    pos.x += (mouse.x - pos.x) * 0.16;
    pos.y += (mouse.y - pos.y) * 0.16;
    const vx = pos.x - prev.x;
    prev.x = pos.x;
    prev.y = pos.y;
    skew += (vx * 0.35 - skew) * 0.18;
    follower.style.transform = `translate3d(${pos.x + 28}px, ${pos.y - 40}px, 0) skewX(${skew}deg)`;
  };

  const onPointerDown = (event: Event): void => {
    prepareVt(event.currentTarget as HTMLAnchorElement);
  };

  rows.forEach((row) => {
    row.addEventListener('pointerenter', onEnter);
    row.addEventListener('focus', onEnter);
    row.addEventListener('pointerleave', onLeave);
    row.addEventListener('blur', onLeave);
    row.addEventListener('pointerdown', onPointerDown);
  });
  list.addEventListener('pointerleave', hide);
  if (!mobile && !reduce) {
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
  }

  teardowns.push(() => {
    rows.forEach((row) => {
      row.removeEventListener('pointerenter', onEnter);
      row.removeEventListener('focus', onEnter);
      row.removeEventListener('pointerleave', onLeave);
      row.removeEventListener('blur', onLeave);
      row.removeEventListener('pointerdown', onPointerDown);
    });
    list.removeEventListener('pointerleave', hide);
    window.removeEventListener('pointermove', onMove);
    cancelAnimationFrame(raf);
    hide();
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

  const tween = gsap.to(track, {
    x: () => -getTravel(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${getTravel()}`,
      pin: true,
      scrub: true,
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
      () => showToast('Почта скопирована'),
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

  ScrollTrigger.refresh();
}

export function unmountHomePage(): void {
  clearTeardowns();
  ensureScrollTrigger().getAll().forEach((st) => st.kill());
}

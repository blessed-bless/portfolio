import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { getLenis } from './lenis-scroll';
import { getPerfTier, isLessMotionPreferred } from './perf';
import { subscribeTicker } from './raf-hub';

type Level = 'full' | 'lite' | 'off';

let springReady = false;

function level(): Level {
  if (isLessMotionPreferred() || getPerfTier() === 'low') return 'off';
  if (!window.matchMedia('(min-width: 901px)').matches) return 'off';
  if (!window.matchMedia('(pointer: fine)').matches) return 'off';
  return getPerfTier() === 'high' ? 'full' : 'lite';
}

function springEase(): string {
  if (!springReady) {
    gsap.registerPlugin(CustomEase);
    CustomEase.create('btn-spring', 'M0,0 C0.16,1.25 0.3,1.12 0.52,0.98 0.74,0.86 0.86,1.02 1,1');
    springReady = true;
  }
  return 'btn-spring';
}

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

/** Magnetic primary buttons plus a light scroll-velocity skew on featured rows and the stack. */
export function mountMagneticMotion(): () => void {
  const mode = level();
  document.documentElement.dataset.magnetic = mode === 'off' ? '0' : '1';
  if (mode === 'off') {
    return () => {
      document.documentElement.dataset.magnetic = '0';
    };
  }

  const strength = mode === 'full' ? 16 : 6;
  const maxSkew = mode === 'full' ? 2.2 : 1;
  const buttons = [...document.querySelectorAll<HTMLElement>('.btn--primary')];
  const cleanups: Array<() => void> = [];

  buttons.forEach((btn) => {
    const onMove = (event: PointerEvent): void => {
      const rect = btn.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.max(0, 1 - dist / 150);
      gsap.to(btn, {
        x: (dx / dist) * pull * strength,
        y: (dy / dist) * pull * strength,
        duration: 0.28,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };
    const onLeave = (): void => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: mode === 'full' ? 0.75 : 0.35,
        ease: mode === 'full' ? springEase() : 'power2.out',
        overwrite: 'auto',
      });
    };
    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      btn.removeEventListener('pointermove', onMove);
      btn.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(btn);
      gsap.set(btn, { x: 0, y: 0 });
    });
  });

  let lastY = window.scrollY;
  let skew = 0;
  const rows = () => document.querySelectorAll<HTMLElement>('[data-featured-row], [data-marquee-row]');
  const unsub = subscribeTicker(() => {
    const lenis = getLenis();
    const velocity = lenis ? lenis.velocity : window.scrollY - lastY;
    lastY = window.scrollY;
    const target = clamp(velocity * (mode === 'full' ? 0.012 : 0.006), maxSkew);
    skew += (target - skew) * 0.16;
    if (Math.abs(skew) < 0.04) skew = 0;
    const transform = skew === 0 ? '' : `skewY(${skew.toFixed(2)}deg)`;
    rows().forEach((row) => {
      if (row.style.transform !== transform) row.style.transform = transform;
    });
  });

  return () => {
    unsub();
    cleanups.forEach((fn) => fn());
    rows().forEach((row) => {
      row.style.transform = '';
    });
    document.documentElement.dataset.magnetic = '0';
  };
}

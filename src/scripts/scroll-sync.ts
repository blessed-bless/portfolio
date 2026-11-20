import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './lenis-scroll';

let registered = false;

export function ensureScrollTrigger(): typeof ScrollTrigger {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return ScrollTrigger;
}

export function bindLenisToScrollTrigger(): () => void {
  ensureScrollTrigger();
  const lenis = getLenis();
  if (!lenis) {
    ScrollTrigger.refresh();
    return () => undefined;
  }

  const onScroll = () => {
    ScrollTrigger.update();
  };
  lenis.on('scroll', onScroll);
  ScrollTrigger.refresh();

  return () => {
    lenis.off('scroll', onScroll);
  };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isDesktopLayout(): boolean {
  return window.matchMedia('(min-width: 901px)').matches;
}

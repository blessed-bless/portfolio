import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { isLessMotionPreferred, perfAllows } from './perf';

gsap.registerPlugin(SplitText);

function prefersReducedMotion(): boolean {
  return isLessMotionPreferred();
}

type IntroOptions = {
  onCarouselEnter?: () => Promise<void> | void;
};

export async function animateHeroIntro(
  root: HTMLElement,
  options: IntroOptions = {},
): Promise<void> {
  const name = root.querySelector<HTMLElement>('[data-hero-name]');
  const line = root.querySelector<HTMLElement>('[data-hero-line]');
  if (!name || !line) return;

  // Skip SplitText on narrow/reduced/mid — char wraps were a CLS source on mobile.
  if (
    prefersReducedMotion() ||
    !perfAllows('splitChars') ||
    window.matchMedia('(max-width: 900px)').matches
  ) {
    await options.onCarouselEnter?.();
    return;
  }

  await Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 500);
    }),
  ]);
  if (!root.isConnected) {
    await options.onCarouselEnter?.();
    return;
  }

  try {
    const nameSplit = SplitText.create(name, {
      type: 'chars',
      charsClass: 'hero-char',
      aria: 'none',
    });
    const lines = [...line.querySelectorAll<HTMLElement>(':scope > span')];

    // Keep name opaque for LCP; clip via overflow on the parent.
    // Animate the existing headline lines so the browser can still wrap the text.
    gsap.set(nameSplit.chars, { yPercent: 115, force3D: true });
    gsap.set(lines, { y: 22, opacity: 0.3, force3D: true });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(nameSplit.chars, {
      yPercent: 0,
      duration: 0.7,
      stagger: 0.022,
    });

    tl.to(
      lines,
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.085,
      },
      0.45,
    );

    tl.add(() => {
      void options.onCarouselEnter?.();
    }, 0.85);

    await tl.then();
  } catch {
    await options.onCarouselEnter?.();
  }
}

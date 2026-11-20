import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const feet = root.querySelectorAll<HTMLElement>('[data-hero-foot], [data-hero-foot-mobile]');
  const caption = root.querySelector<HTMLElement>('[data-hero-caption]');
  const chrome = root.querySelectorAll<HTMLElement>(
    '[data-hero-counter], [data-hero-hint], [data-hero-caption]',
  );
  if (!name || !line) return;

  if (prefersReducedMotion()) {
    await options.onCarouselEnter?.();
    return;
  }

  await Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 500);
    }),
  ]);

  try {
    const nameSplit = SplitText.create(name, {
      type: 'chars',
      charsClass: 'hero-char',
      aria: 'none',
    });
    const lineSplit = SplitText.create(line, {
      type: 'chars,words',
      charsClass: 'hero-char',
      wordsClass: 'hero-word',
      aria: 'none',
    });

    gsap.set([...nameSplit.chars, ...lineSplit.chars], {
      yPercent: 115,
      opacity: 0,
    });
    if (feet.length) gsap.set(feet, { opacity: 0, y: 12 });
    if (chrome.length) gsap.set(chrome, { opacity: 0, y: 8 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(nameSplit.chars, {
      yPercent: 0,
      opacity: 1,
      duration: 0.7,
      stagger: 0.022,
    });

    tl.to(
      lineSplit.chars,
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.01,
      },
      0.45,
    );

    tl.add(() => {
      void options.onCarouselEnter?.();
    }, 0.85);

    if (chrome.length) {
      tl.to(chrome, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 }, 1.1);
    }
    if (feet.length) {
      tl.to(feet, { opacity: 1, y: 0, duration: 0.35 }, 1.2);
    }

    await tl.then();
  } catch {
    await options.onCarouselEnter?.();
  }
}

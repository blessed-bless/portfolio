import { getPerfTier, isLessMotionPreferred } from './perf';

type HeadingMode = 'scramble' | 'lines' | 'off';

let observer: IntersectionObserver | null = null;
let bound = false;

function headingMode(): HeadingMode {
  if (isLessMotionPreferred() || getPerfTier() === 'low' || matchMedia('(max-width: 900px)').matches) return 'off';
  return 'lines';
}

function charset(): string {
  return document.documentElement.lang.startsWith('en')
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01'
    : 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ01';
}

async function playHeading(el: HTMLElement): Promise<void> {
  if (el.dataset.played === 'true') return;
  const mode = headingMode();
  el.dataset.played = 'true';
  if (mode === 'off') return;

  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return;

  try {
    const gsap = (await import('gsap')).default;
    if (mode === 'lines') {
      const { SplitText } = await import('gsap/SplitText');
      gsap.registerPlugin(SplitText);
      const split = SplitText.create(el, {
        type: 'lines',
        linesClass: 'scramble-line',
        aria: 'none',
      });
      gsap.set(split.lines, { yPercent: 110 });
      gsap.to(split.lines, {
        yPercent: 0,
        duration: 0.7,
        stagger: 0.05,
        ease: 'power3.out',
      });
      return;
    }

    const { ScrambleTextPlugin } = await import('gsap/ScrambleTextPlugin');
    gsap.registerPlugin(ScrambleTextPlugin);
    gsap.to(el, {
      duration: 0.85,
      ease: 'none',
      scrambleText: {
        text,
        chars: charset(),
        speed: 0.4,
        tweenLength: false,
      },
    });
  } catch {
    el.dataset.played = 'true';
  }
}

function playWordmark(el: HTMLElement): void {
  if (el.dataset.played === 'true') return;
  el.dataset.played = 'true';
  if (headingMode() === 'off') return;
  el.classList.add('is-in');
}

function watch(el: HTMLElement): void {
  if (el.dataset.watched === 'true') return;
  el.dataset.watched = 'true';
  if (headingMode() === 'off') {
    if (el.hasAttribute('data-wordmark')) {
      el.querySelector<HTMLElement>('[data-wordmark-inner]')?.style.setProperty('transform', 'none');
    }
    el.dataset.played = 'true';
    return;
  }
  observer?.observe(el);
}

function scan(): void {
  document.querySelectorAll<HTMLElement>('[data-scramble], [data-wordmark]').forEach(watch);
}

/** Scramble or line-reveal once per heading. Low and reduced motion leave the text in place. */
export function mountHeadingMotion(): void {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          observer?.unobserve(el);
          if (el.hasAttribute('data-wordmark')) playWordmark(el);
          else void playHeading(el);
        });
      },
      { threshold: 0.45 },
    );
  }

  if (!bound) {
    bound = true;
    document.addEventListener('astro:page-load', scan);
  }
  scan();
}

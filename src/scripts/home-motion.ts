import { getPerfTier, isLessMotionPreferred } from './perf';

let cleanup: (() => void) | null = null;

function showCounts(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((node) => {
    node.textContent = node.dataset.count || '0';
  });
}

export async function mountHomeMotion(): Promise<void> {
  cleanup?.();
  cleanup = null;

  const root = document.querySelector<HTMLElement>('[data-home-root]');
  if (!root) return;

  const reduced = isLessMotionPreferred() || getPerfTier() === 'low';
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  if (reduced) {
    showCounts(root);
    root.querySelectorAll<HTMLElement>('[data-process-step]').forEach((step) => {
      step.dataset.current = 'true';
    });
    return;
  }

  const gsap = (await import('gsap')).default;
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);
  const { promoteToGsapTicker } = await import('./raf-hub');
  await promoteToGsapTicker();
  if (!root.isConnected) return;

  const triggers: Array<{ kill: () => void }> = [];

  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((node) => {
    const tween = gsap.from(node, {
      y: 16,
      opacity: 0,
      duration: 0.55,
      ease: 'power3.out',
      scrollTrigger: { trigger: node, start: 'top 90%', once: true },
    });
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  });

  root.querySelectorAll<HTMLElement>('[data-count]').forEach((node) => {
    const target = Number(node.dataset.count || '0');
    const state = { value: 0 };
    const tween = gsap.to(state, {
      value: target,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: node, start: 'top 86%', once: true },
      onUpdate: () => {
        node.textContent = String(Math.round(state.value));
      },
    });
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  });

  root.querySelectorAll<HTMLElement>('[data-band]').forEach((section) => {
    const band = section.dataset.band || '';
    triggers.push(
      ScrollTrigger.create({
        trigger: section,
        start: 'top 62%',
        end: 'bottom 38%',
        onToggle: (self) => {
          if (self.isActive) root.dataset.band = band;
        },
      }),
    );
  });

  const process = root.querySelector<HTMLElement>('[data-process]');
  const pin = process?.querySelector<HTMLElement>('[data-process-pin]');
  const steps = process ? [...process.querySelectorAll<HTMLElement>('[data-process-step]')] : [];
  const bar = process?.querySelector<HTMLElement>('[data-process-bar]');

  if (process && pin && steps.length && !narrow) {
    process.dataset.active = 'true';
    const first = steps[0];
    if (first) first.dataset.current = 'true';
    triggers.push(
      ScrollTrigger.create({
        trigger: process,
        start: 'top 72px',
        end: '+=65%',
        pin,
        pinSpacing: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
          steps.forEach((step, stepIndex) => {
            step.dataset.current = String(stepIndex === index);
          });
          if (bar) bar.style.transform = `scaleX(${Math.max(self.progress, 0.04)})`;
        },
      }),
    );
  } else {
    steps.forEach((step) => {
      step.dataset.current = 'true';
    });
    if (bar) bar.style.transform = 'scaleX(1)';
  }

  cleanup = () => {
    triggers.forEach((trigger) => trigger.kill());
    delete root.dataset.band;
    if (process) delete process.dataset.active;
  };
}

export function stopHomeMotion(): void {
  cleanup?.();
  cleanup = null;
}

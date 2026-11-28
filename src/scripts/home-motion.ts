import { getPerfTier, isLessMotionPreferred } from './perf';

let cleanup: (() => void) | null = null;

function showCounts(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((node) => {
    node.textContent = node.dataset.count || '0';
  });
}

function revealProcess(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>('[data-process-step]').forEach((step) => {
    step.dataset.current = 'true';
  });
  const bar = scope.querySelector<HTMLElement>('[data-process-bar]');
  if (bar) bar.style.transform = 'scaleX(1)';
}

export async function mountHomeMotion(): Promise<void> {
  cleanup?.();
  cleanup = null;

  const root = document.querySelector<HTMLElement>('[data-home-root]');
  const reduced = isLessMotionPreferred() || getPerfTier() === 'low';
  if (!root) {
    if (reduced) {
      revealProcess(document);
      return;
    }
    await import('gsap');
    const process = document.querySelector<HTMLElement>('[data-process]');
    if (!process?.isConnected) return;
    revealProcess(document);
    cleanup = () => {
      delete process.dataset.active;
    };
    return;
  }

  if (reduced) {
    showCounts(root);
    revealProcess(root);
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
      y: 14,
      duration: 0.55,
      ease: 'power3.out',
      scrollTrigger: { trigger: node, start: 'top 92%', once: true },
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
  revealProcess(root);

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

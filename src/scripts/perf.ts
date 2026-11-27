export type PerfTier = 'high' | 'mid' | 'low';

const STORAGE_KEY = 'portfolio-perf';
const FORCE_KEY = 'portfolio-perf-force';
const LESS_MOTION_KEY = 'portfolio-less-motion';
const SESSION_FLOOR_KEY = 'portfolio-perf-floor';

const ORDER: PerfTier[] = ['low', 'mid', 'high'];

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

let tier: PerfTier = 'high';
let demoting = false;
let fpsWatchStarted = false;

function isMobileUa(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function readForced(): PerfTier | null {
  try {
    const params = new URLSearchParams(location.search);
    const q = params.get('perf');
    if (q === 'low' || q === 'mid' || q === 'high') {
      sessionStorage.setItem(FORCE_KEY, q);
      return q;
    }
    const stored = sessionStorage.getItem(FORCE_KEY);
    if (stored === 'low' || stored === 'mid' || stored === 'high') return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function isLessMotionPreferred(): boolean {
  try {
    if (localStorage.getItem(LESS_MOTION_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setLessMotion(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(LESS_MOTION_KEY, '1');
    else localStorage.removeItem(LESS_MOTION_KEY);
  } catch {
    /* ignore */
  }
  applyPerfTier(enabled ? 'low' : floorTier(detectHardwareTier()));
  window.dispatchEvent(new CustomEvent('portfolio:less-motion', { detail: { enabled } }));
}

export function isLessMotionToggleOn(): boolean {
  try {
    return localStorage.getItem(LESS_MOTION_KEY) === '1';
  } catch {
    return false;
  }
}

export function toggleLessMotion(): boolean {
  const next = !isLessMotionToggleOn();
  setLessMotion(next);
  return next;
}

function detectHardwareTier(): PerfTier {
  if (isLessMotionPreferred()) return 'low';
  const nav = navigator as NavigatorWithMemory;
  if (nav.connection?.saveData) return 'low';
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return 'low';
  if (isMobileUa() && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) {
    return 'low';
  }
  if (!hasWebGL2()) return 'low';

  if (isMobileUa()) return 'mid';
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return 'mid';
  return 'high';
}

function floorTier(value: PerfTier): PerfTier {
  try {
    const floor = sessionStorage.getItem(SESSION_FLOOR_KEY);
    if (floor === 'low' || floor === 'mid' || floor === 'high') {
      return ORDER[Math.min(ORDER.indexOf(value), ORDER.indexOf(floor))] ?? value;
    }
  } catch {
    /* ignore */
  }
  return value;
}

function setSessionFloor(value: PerfTier): void {
  try {
    const current = sessionStorage.getItem(SESSION_FLOOR_KEY);
    if (current === 'low') return;
    if (current === 'mid' && value === 'high') return;
    sessionStorage.setItem(SESSION_FLOOR_KEY, value);
  } catch {
    /* ignore */
  }
}

export function getPerfTier(): PerfTier {
  return tier;
}

export function applyPerfTier(next: PerfTier): void {
  tier = next;
  document.documentElement.dataset.perf = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('portfolio:perf', { detail: { tier: next } }));
}

function demoteOne(): void {
  if (demoting) return;
  const index = ORDER.indexOf(tier);
  if (index <= 0) return;
  demoting = true;
  const next = ORDER[index - 1] ?? 'low';
  setSessionFloor(next);
  applyPerfTier(next);
  demoting = false;
}

function startFpsProbe(): void {
  if (fpsWatchStarted) return;
  fpsWatchStarted = true;

  let frames = 0;
  let last = performance.now();
  let windowStart = last;
  let lowStreakStart: number | null = null;
  let bootChecked = false;

  const tick = (now: number): void => {
    const dt = now - last;
    last = now;
    frames += 1;

    if (!bootChecked && now - windowStart >= 2000) {
      bootChecked = true;
      const fps = (frames * 1000) / Math.max(now - windowStart, 1);
      frames = 0;
      windowStart = now;
      if (fps < 45) demoteOne();
    } else if (bootChecked) {
      const instant = dt > 0 ? 1000 / dt : 60;
      if (instant < 40) {
        if (lowStreakStart == null) lowStreakStart = now;
        else if (now - lowStreakStart >= 3000) {
          demoteOne();
          lowStreakStart = now;
        }
      } else {
        lowStreakStart = null;
      }
    }

    if (!document.hidden) requestAnimationFrame(tick);
  };

  const onVisibility = (): void => {
    if (!document.hidden) {
      last = performance.now();
      requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  requestAnimationFrame(tick);
}

/** Resolve and stamp data-perf. Safe to call multiple times. */
export function initPerfProfile(): PerfTier {
  const forced = readForced();
  let next: PerfTier;
  if (forced) {
    next = forced;
  } else if (isLessMotionPreferred() && (() => {
    try {
      return localStorage.getItem(LESS_MOTION_KEY) === '1';
    } catch {
      return false;
    }
  })()) {
    next = 'low';
  } else {
    next = floorTier(detectHardwareTier());
  }
  applyPerfTier(next);
  // Defer FPS probe — running rAF during boot inflates TBT on Lighthouse.
  const kickProbe = (): void => {
    window.setTimeout(() => startFpsProbe(), 2500);
  };
  if (document.readyState === 'complete') kickProbe();
  else window.addEventListener('load', kickProbe, { once: true });
  return next;
}

export function perfAllows(feature: 'webgl' | 'cursor' | 'lenis' | 'splitChars' | 'shaderWarp' | 'eggsWire' | 'demoMotion'): boolean {
  switch (feature) {
    case 'webgl':
      return tier !== 'low';
    case 'cursor':
      return tier === 'high';
    case 'lenis':
      return tier !== 'low';
    case 'splitChars':
      return tier === 'high';
    case 'shaderWarp':
      return tier === 'high';
    case 'eggsWire':
      return tier !== 'low';
    case 'demoMotion':
      return tier !== 'low';
    default:
      return true;
  }
}

export function maxPixelRatio(): number {
  if (tier === 'high') return Math.min(window.devicePixelRatio || 1, 2);
  if (tier === 'mid') return Math.min(window.devicePixelRatio || 1, 1.5);
  return 1;
}

export function onPerfChange(cb: (next: PerfTier) => void): () => void {
  const handler = (event: Event): void => {
    const detail = (event as CustomEvent<{ tier: PerfTier }>).detail;
    if (detail?.tier) cb(detail.tier);
  };
  window.addEventListener('portfolio:perf', handler);
  return () => window.removeEventListener('portfolio:perf', handler);
}

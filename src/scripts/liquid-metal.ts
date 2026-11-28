import {
  ShaderFitOptions,
  ShaderMount,
  getShaderColorFromString,
  liquidMetalFragmentShader,
  toProcessedLiquidMetal,
  type LiquidMetalUniforms,
  type ShaderMountUniforms,
} from '@paper-design/shaders';
import { getPerfTier } from './perf';

const MAX_PIXEL_COUNT = 512 * 512;
const SPEED = 0.22;

/** Same geometry as BrandMark.astro — opaque fills for the alpha mask. */
const BRAND_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path d="M156 112 L156 372 L222 314 L362 314 Z" fill="#ffffff" stroke="#ffffff" stroke-width="28" stroke-linejoin="round"/>
  <rect x="292" y="358" width="92" height="42" rx="8" fill="#ffffff"/>
</svg>`;

const MASK_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(BRAND_MARK_SVG)}`;

let maskImagePromise: Promise<HTMLImageElement> | null = null;

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (gl) {
      const lose = gl.getExtension('WEBGL_lose_context');
      lose?.loseContext();
    }
    return Boolean(gl);
  } catch {
    return false;
  }
}

function isDesktopPointer(): boolean {
  return (
    window.matchMedia('(min-width: 901px)').matches &&
    window.matchMedia('(pointer: fine)').matches
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function canUseLiquidMetal(): boolean {
  return (
    hasWebGL2() &&
    getPerfTier() === 'high' &&
    isDesktopPointer() &&
    !prefersReducedMotion()
  );
}

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function themeUniforms(): Pick<LiquidMetalUniforms, 'u_colorBack' | 'u_colorTint'> {
  const accent = readToken('--accent') || '#7c3aed';
  return {
    u_colorBack: getShaderColorFromString('#00000000'),
    u_colorTint: getShaderColorFromString(accent),
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!img.complete || img.naturalWidth === 0) {
        reject(new Error('LiquidMetal mask image failed to decode'));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('LiquidMetal mask image failed to load'));
    img.src = url;
  });
}

async function processedMaskImage(): Promise<HTMLImageElement> {
  if (!maskImagePromise) {
    maskImagePromise = (async () => {
      const { pngBlob } = await toProcessedLiquidMetal(MASK_DATA_URL);
      const objectUrl = URL.createObjectURL(pngBlob);
      try {
        return await loadImage(objectUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    })();
  }
  try {
    return await maskImagePromise;
  } catch (error) {
    maskImagePromise = null;
    throw error;
  }
}

function buildUniforms(image: HTMLImageElement): LiquidMetalUniforms {
  return {
    ...themeUniforms(),
    u_image: image,
    u_repetition: 2.4,
    u_shiftRed: 0.22,
    u_shiftBlue: 0.18,
    u_contour: 0.45,
    u_softness: 0.28,
    u_distortion: 0.06,
    u_angle: 55,
    u_shape: 0,
    u_isImage: true,
    u_fit: ShaderFitOptions.contain,
    u_scale: 0.92,
    u_rotation: 0,
    u_originX: 0.5,
    u_originY: 0.5,
    u_offsetX: 0,
    u_offsetY: 0,
    u_worldWidth: 0,
    u_worldHeight: 0,
  };
}

export type LiquidMetalHandle = {
  dispose: () => void;
};

/**
 * Mounts LiquidMetal over the reserved mark slot when the gate passes.
 * Returns null when falling back to the static BrandMark SVG.
 */
export async function mountLiquidMetal(root: HTMLElement): Promise<LiquidMetalHandle | null> {
  if (!canUseLiquidMetal()) return null;

  const host = root.querySelector<HTMLElement>('[data-liquid-metal-host]');
  if (!host) return null;

  let image: HTMLImageElement;
  try {
    image = await processedMaskImage();
  } catch {
    return null;
  }

  // Gate may have changed while the mask was processing.
  if (!canUseLiquidMetal() || !root.isConnected) return null;

  let mount: ShaderMount;
  try {
    mount = new ShaderMount(
      host,
      liquidMetalFragmentShader,
      buildUniforms(image) as unknown as ShaderMountUniforms,
      { alpha: true, antialias: false, powerPreference: 'low-power' },
      SPEED,
      0,
      1,
      MAX_PIXEL_COUNT,
      ['u_image'],
    );
  } catch {
    return null;
  }

  root.classList.add('is-shader');
  const fallback = root.querySelector<HTMLElement>('[data-liquid-metal-fallback]');
  if (fallback) fallback.hidden = true;

  const themeObserver = new MutationObserver(() => {
    mount.setUniforms(themeUniforms());
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const widthMq = window.matchMedia('(min-width: 901px)');
  const pointerMq = window.matchMedia('(pointer: fine)');

  let disposed = false;
  let dropIfGated: (() => void) | null = null;

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    dropIfGated = null;
    themeObserver.disconnect();
    reduceMq.removeEventListener('change', onGateSignal);
    widthMq.removeEventListener('change', onGateSignal);
    pointerMq.removeEventListener('change', onGateSignal);
    window.removeEventListener('portfolio:less-motion', onGateSignal);
    window.removeEventListener('portfolio:perf', onGateSignal);
    mount.dispose();
    root.classList.remove('is-shader');
    if (fallback) fallback.hidden = false;
  };

  const onGateSignal = (): void => {
    dropIfGated?.();
  };

  dropIfGated = () => {
    if (!canUseLiquidMetal()) dispose();
  };

  reduceMq.addEventListener('change', onGateSignal);
  widthMq.addEventListener('change', onGateSignal);
  pointerMq.addEventListener('change', onGateSignal);
  window.addEventListener('portfolio:less-motion', onGateSignal);
  window.addEventListener('portfolio:perf', onGateSignal);

  return { dispose };
}

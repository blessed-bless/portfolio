import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  type Texture,
} from 'three';

export type CoverLabel = {
  number: string;
  title: string;
};

export type CoverRasterOptions = {
  width: number;
  height?: number;
  anisotropy?: number;
  label?: CoverLabel;
};

function themeCoverVars(): Record<string, string> {
  const styles = getComputedStyle(document.documentElement);
  const theme = document.documentElement.dataset.theme;
  if (theme === 'light') {
    return {
      '--cover-bg': '#EDE5FA',
      '--cover-line': '#6D28D9',
      '--cover-ink': '#32185C',
    };
  }
  return {
    '--cover-bg': styles.getPropertyValue('--bg-elevated').trim() || '#16131F',
    '--cover-line': styles.getPropertyValue('--accent-strong').trim() || '#A78BFA',
    '--cover-ink': styles.getPropertyValue('--fg').trim() || '#E9E3FF',
  };
}

async function svgFromUrl(url: string): Promise<SVGSVGElement> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cover fetch failed: ${url}`);
  const text = await response.text();
  const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = parsed.querySelector('svg');
  if (!svg) throw new Error(`Cover SVG missing: ${url}`);
  return svg;
}

export async function rasterizeCoverSvg(
  cover: SVGSVGElement,
  layer: 'art' | 'base',
  options: CoverRasterOptions,
): Promise<CanvasTexture> {
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height ?? (width * 10) / 16));

  const svg = cover.cloneNode(true) as SVGSVGElement;
  const vars = themeCoverVars();
  for (const [token, value] of Object.entries(vars)) {
    svg.style.setProperty(token, value);
  }

  for (const child of Array.from(svg.children)) {
    if (child.hasAttribute('data-cover-art') !== (layer === 'art')) child.remove();
  }
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', svg.getAttribute('viewBox') || `0 0 1600 1000`);

  const source = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  image.decoding = 'async';
  image.src = `data:image/svg+xml,${encodeURIComponent(source)}`;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  if (options.label && layer === 'base') {
    const scale = width / 1600;
    const fontPx = Math.max(12, Math.round(42 * scale));
    context.font = `650 ${fontPx}px Unbounded, Onest, system-ui, sans-serif`;
    context.textBaseline = 'alphabetic';
    context.fillStyle = vars['--cover-line'] || '#A78BFA';
    context.fillText(options.label.number, 100 * scale, 144 * scale);
    const numWidth = context.measureText(options.label.number).width;
    context.fillStyle = vars['--cover-ink'] || '#E9E3FF';
    context.fillText(options.label.title, Math.max(206 * scale, 100 * scale + numWidth + 12 * scale), 144 * scale);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = options.anisotropy ?? 1;
  texture.needsUpdate = true;
  return texture;
}

/** @deprecated Prefer rasterizeCoverUrl for file-based covers. */
export async function rasterizeCover(
  cover: SVGSVGElement,
  layer: 'art' | 'base',
  options: CoverRasterOptions,
): Promise<CanvasTexture> {
  return rasterizeCoverSvg(cover, layer, options);
}

export async function rasterizeCoverUrl(
  url: string,
  layer: 'art' | 'base',
  options: CoverRasterOptions,
): Promise<CanvasTexture> {
  const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  const themedUrl =
    theme === 'light' && url.includes('/covers/') && !url.includes('/covers/light/')
      ? url.replace('/covers/', '/covers/light/')
      : url;
  const svg = await svgFromUrl(themedUrl);
  return rasterizeCoverSvg(svg, layer, options);
}

export function applyTextureQuality(texture: Texture, anisotropy: number): void {
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = Math.max(1, anisotropy);
  texture.needsUpdate = true;
}

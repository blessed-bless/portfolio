import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  type Texture,
} from 'three';

export type CoverRasterOptions = {
  width: number;
  height?: number;
  anisotropy?: number;
};

export async function rasterizeCover(
  cover: SVGSVGElement,
  layer: 'art' | 'base',
  options: CoverRasterOptions,
): Promise<CanvasTexture> {
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height ?? (width * 10) / 16));

  const svg = cover.cloneNode(true) as SVGSVGElement;
  const styles = getComputedStyle(cover);
  for (const token of ['--cover-bg', '--cover-line', '--cover-ink']) {
    const value = styles.getPropertyValue(token);
    if (value) svg.style.setProperty(token, value);
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

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = options.anisotropy ?? 1;
  texture.needsUpdate = true;
  return texture;
}

export function applyTextureQuality(texture: Texture, anisotropy: number): void {
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = Math.max(1, anisotropy);
  texture.needsUpdate = true;
}

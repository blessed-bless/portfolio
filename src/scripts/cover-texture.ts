import { CanvasTexture, NoColorSpace } from 'three';

export async function rasterizeCover(
  cover: SVGSVGElement,
  layer: 'art' | 'base',
  width: number,
): Promise<CanvasTexture> {
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
  svg.setAttribute('height', String(width * 10 / 16));
  const source = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  image.src = `data:image/svg+xml,${encodeURIComponent(source)}`;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  context.drawImage(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  return texture;
}

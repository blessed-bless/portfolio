import { Resvg } from '@resvg/resvg-js';
import { loadOgFontBuffers } from './og-fonts';

/** Rasterize OG SVG with project TTF buffers (Cyrillic). */
export function renderOgPng(svg: string, width = 1200): Buffer {
  const fonts = loadOgFontBuffers();
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: {
      fontBuffers: fonts,
      loadSystemFonts: false,
      defaultFontFamily: 'Onest',
    },
  });
  return Buffer.from(resvg.render().asPng());
}

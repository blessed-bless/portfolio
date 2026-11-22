import { Resvg } from '@resvg/resvg-js';
import { ogFontFiles } from './og-fonts';

/** Rasterize OG SVG with the same font families used by the site. */
export function renderOgPng(svg: string, width = 1200): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: {
      fontFiles: ogFontFiles,
      loadSystemFonts: false,
      defaultFontFamily: 'Onest',
    },
  });
  return Buffer.from(resvg.render().asPng());
}

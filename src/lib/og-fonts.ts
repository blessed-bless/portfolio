import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Source fonts stay in the repo; prerender cwd is the project root. */
const fontsDir = join(process.cwd(), 'src/assets/fonts');

let fontBuffers: Buffer[] | null = null;
let fontFaceCss: string | null = null;

/** TTF buffers for Resvg (`font.fontBuffers`). */
export function loadOgFontBuffers(): Buffer[] {
  if (fontBuffers) return fontBuffers;
  fontBuffers = [
    readFileSync(join(fontsDir, 'Unbounded-Bold.ttf')),
    readFileSync(join(fontsDir, 'Onest-Bold.ttf')),
  ];
  return fontBuffers;
}

function loadFontFaceCss(): string {
  if (fontFaceCss) return fontFaceCss;
  const [unbounded, onest] = loadOgFontBuffers();
  fontFaceCss = `
@font-face {
  font-family: 'Unbounded';
  src: url(data:font/ttf;base64,${unbounded.toString('base64')}) format('truetype');
  font-weight: 100 900;
  font-style: normal;
}
@font-face {
  font-family: 'Onest';
  src: url(data:font/ttf;base64,${onest.toString('base64')}) format('truetype');
  font-weight: 100 900;
  font-style: normal;
}`;
  return fontFaceCss;
}

/** Inject @font-face for SVG responses viewed in a browser. */
export function withOgFonts(svg: string): string {
  const css = loadFontFaceCss();
  const styleBlock = `<style><![CDATA[${css}]]></style>`;
  if (/<defs[\s>]/i.test(svg)) {
    return svg.replace(/<defs([^>]*)>/i, `<defs$1>${styleBlock}`);
  }
  return svg.replace(/<svg([^>]*)>/i, `<svg$1><defs>${styleBlock}</defs>`);
}

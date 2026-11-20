import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Source fonts stay in the repo; prerender cwd is the project root. */
const fontsDir = join(process.cwd(), 'src/assets/fonts');

let fontFaceCss: string | null = null;

function loadFontFaceCss(): string {
  if (fontFaceCss) return fontFaceCss;
  const unbounded = readFileSync(join(fontsDir, 'Unbounded-Bold.ttf')).toString('base64');
  const onest = readFileSync(join(fontsDir, 'Onest-Bold.ttf')).toString('base64');
  fontFaceCss = `
@font-face {
  font-family: 'Unbounded';
  src: url(data:font/ttf;base64,${unbounded}) format('truetype');
  font-weight: 100 900;
  font-style: normal;
}
@font-face {
  font-family: 'Onest';
  src: url(data:font/ttf;base64,${onest}) format('truetype');
  font-weight: 100 900;
  font-style: normal;
}`;
  return fontFaceCss;
}

/** Inject @font-face for Onest/Unbounded so sharp/librsvg can paint Cyrillic. */
export function withOgFonts(svg: string): string {
  const css = loadFontFaceCss();
  const styleBlock = `<style><![CDATA[${css}]]></style>`;
  if (/<defs[\s>]/i.test(svg)) {
    return svg.replace(/<defs([^>]*)>/i, `<defs$1>${styleBlock}`);
  }
  return svg.replace(/<svg([^>]*)>/i, `<svg$1><defs>${styleBlock}</defs>`);
}

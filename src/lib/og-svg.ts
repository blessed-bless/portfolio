import { withOgFonts } from './og-fonts';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function buildOgSvg(options: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}): string {
  const title = escapeXml(options.title);
  const subtitle = options.subtitle ? escapeXml(options.subtitle) : '';
  const eyebrow = escapeXml(options.eyebrow ?? 'Богдан');

  return withOgFonts(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="#0D0B12"/>
  <circle cx="980" cy="120" r="220" fill="#3B2458" fill-opacity="0.55"/>
  <circle cx="1080" cy="520" r="180" fill="#7C3AED" fill-opacity="0.22"/>
  <rect x="72" y="72" width="28" height="28" fill="#7C3AED"/>
  <text x="120" y="94" fill="#F3F1EA" font-family="Onest, Unbounded, sans-serif" font-size="28" font-weight="700">${eyebrow}</text>
  <text x="72" y="300" fill="#F3F1EA" font-family="Unbounded, Onest, sans-serif" font-size="72" font-weight="700">${title}</text>
  ${
    subtitle
      ? `<text x="72" y="370" fill="#A8A3B5" font-family="Onest, Unbounded, sans-serif" font-size="28" font-weight="500">${subtitle}</text>`
      : ''
  }
  <rect x="72" y="520" width="160" height="6" fill="#B79CFF"/>
  <g transform="translate(1088 526) scale(0.078125)">
    <path d="M156 112 L156 372 L222 314 L362 314 Z" fill="#F3F1EA" stroke="#F3F1EA" stroke-width="28" stroke-linejoin="round"/>
    <rect x="292" y="358" width="92" height="42" rx="8" fill="#8B5CF6"/>
  </g>
</svg>`);
}

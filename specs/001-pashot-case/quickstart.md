# Quickstart: Pashot case

## Prerequisites

- Node.js 22.23 or newer, from the repo root.
- `npm ci` once, so `npm run check` can build.

## Build the demo

The cafe source is the handoff zip, not this repo. From a temp copy:

1. Set `base: '/demo/pashot/'` in the cafe `astro.config.mjs`.
2. Point root-absolute hashes (`/#…`) at `import.meta.env.BASE_URL`.
3. `npm install` and `npm run build` in that copy.
4. Copy the cafe `dist/` to `public/demo/pashot/`.

## Run the portfolio

```bash
npm run check
npm run preview
```

`npm run check` is the gate: production build, no Cyrillic on `/en` or covers, no broken internal links.

## What to open

| Address | Expect |
| --- | --- |
| `/` and `/en/` | One Pashot row in the project list |
| `/work/` and `/en/work/` | One Pashot card |
| `/work/pashot/` | Russian disclaimer, «Открыть демо», screenshots, measured scores |
| `/en/work/pashot/` | English warning, "Open demo", no Cyrillic |
| `/demo/pashot/` | Cafe page, unofficial bar, menu, lightbox, no console errors, no 404s |
| `/sitemap.xml` | Both case URLs, no demo URL |

Check `/demo/pashot/` at 1440px and 390px: switch a menu tab, switch a price, open and close a gallery photo.

## Scores

Run a mobile Lighthouse pass against the preview URL of `/demo/pashot/`. Write Performance and Accessibility into both case files. Keep the JSON report out of git (`lighthouse-*.json` is gitignored).

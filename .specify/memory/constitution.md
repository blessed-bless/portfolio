# Portfolio Constitution

## Core Principles

### I. Cases are content entries

A portfolio case is a pair of MDX files under `src/content/work/` and
`src/content/work/en/` with the same `slug` and `order`. The existing
`src/pages/work/[slug].astro` and `src/pages/en/work/[slug].astro` pages
render that collection. Home featured rows, `/work`, the command palette,
the hero carousel, the sitemap, and OG images read the same entries.
A case MUST NOT add a second page template or a hardcoded card list.

### II. Russian by default, English without Cyrillic

`ru` is the unprefixed locale. `en` lives under `/en/`. `scripts/check.mjs`
fails the build when Cyrillic appears in `/en/*` visible text, in
`alt` / `aria-label` / `title`, or in cover SVG text and `aria-label`.
English proper names MUST be transliterated. Cover SVGs MUST NOT contain
Cyrillic text nodes. The visible case title is drawn by `ProjectCover`,
not baked into the SVG.

### III. Claims match a source

Case copy describes work that exists in the repo or in the linked demo.
A performance figure MUST come from a measurement of that page.
Client quotes, revenue, and outcome metrics MUST NOT be added when the
source does not contain them. A portfolio concept is labeled in the case
note, the way «Грань» and «Зерно» are labeled.

### IV. Stay on this Astro site

The site is static Astro 7, MDX, TypeScript, `trailingSlash: 'always'`,
`site` `https://dubstepmolitva.ru`. Portfolio chrome uses the existing
tokens. Cover accent fills stay `#8B5CF6`. A hosted demo MAY keep its own
visual system inside its own files and MUST be served as static files
from `public/` without a new portfolio dependency. In-page demos that
already exist stay as `src/scripts/demos` plus `<Demo>`.

### V. Index only portfolio pages

`src/pages/sitemap.xml.ts` lists known portfolio routes and published
notes. It does not walk `public/`. `/system/` is `noindex` and disallowed
in `robots.txt`. A static demo that is not a case page MUST keep its own
`noindex` and MUST NOT be added to the sitemap.

## Assets

Covers exist in three places, as they do for the current cases:
`src/assets/covers/<slug>.svg` (OG via `src/lib/work-cover.ts`),
`public/covers/<slug>.svg`, and `public/covers/light/<slug>.svg`
(what the page loads through `coverPublicUrl`). Dark fallbacks are
`#16131F` / `#A78BFA`. Light fallbacks are `#EDE5FA` / `#6D28D9`.
Screenshots live in `src/assets/screenshots/` and render through `Figure`.
Internal portfolio links use a trailing slash.

## Quality gate

`npm run check` builds the site, then fails on Cyrillic in `/en` or cover
SVGs and on broken internal links. That script is the gate before a case
is called done. TypeScript stays explicit. The public credit in
`src/pages/humans.txt.ts` is Bogdan Ketasonx, GitHub `blessed-bless`.

## Governance

This file overrides ad-hoc habits when they conflict. An amendment edits
this document, bumps the version, and sets Last Amended. MAJOR removes or
redefines a principle. MINOR adds a principle or a new section. PATCH
changes wording only. A pull request that adds a case is checked against
principles I–V and against `npm run check`. Day-to-day commands live in
`AGENTS.md`. Hosting notes live in `docs/timeweb-hosting.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-27

# Research: Pashot portfolio case

## Decision: Serve the demo from `public/demo/pashot/`

**Rationale**: Astro copies `public/` into the build unchanged. `src/pages/sitemap.xml.ts` lists known routes and case entries only, so files under `public/demo/` stay out of the sitemap without a code change. Existing `/work/*` demos are either external hosts (`gran.dubstepmolitva.ru`, `zerno.dubstepmolitva.ru`) or in-page `<Demo>` scripts. There is no second-site pattern to copy. A subpath of static files is the smallest way to meet `/demo/pashot/`.

**Alternatives considered**: An Astro rewrite inside this repo (adds a second app and dependencies). An iframe of an external host (no host was provided, and the cafe site must not be presented as official). Using the prebuilt zip as-is (its asset URLs are rooted at `/`, so they break under the subpath).

## Decision: Rebuild the cafe source with `base: '/demo/pashot/'`

**Rationale**: The handoff source is already the approved page, including the disclaimer bar, `noindex`, and the footer note. Setting Astro `base` prefixes images, fonts, and bundled scripts. Root-absolute hashes (`/#menu`, `/#top`) ignore `base` and would land on the portfolio home. Those few links are rewritten to `import.meta.env.BASE_URL` plus the hash. Relative hashes (`#menu`) already stay on the page and are left alone.

**Alternatives considered**: A post-build HTML rewrite (fragile for `srcset` and CSS urls). Leaving the root hashes (breaks FR-006).

## Decision: Do not vendor the cafe source or its npm dependencies

**Rationale**: Principle IV forbids a new portfolio dependency for a case. The cafe build uses its own `package.json` in a temp directory. The portfolio commit contains the static output only.

**Alternatives considered**: A `demos/pashot` workspace (extra install step on every portfolio build, new lockfile surface).

## Decision: Case fields follow Gran / Zerno

**Rationale**: Those cases are one-page sites with a concept note, a primary button, `Figure` screenshots, a task section, a solution list, a numbers table, and a honesty section. Pashot uses that outline. Status `концепт` / `concept`, origin `demo`, tags `TypeScript` and `Web`, `hasPage`, `featured`, and `carousel` so the existing home list, hero, `/work` index, palette, sitemap, and OG routes pick it up. `order: 11` places it after `ipcheck` (10) and does not renumber current cards. `links.demo` is `/demo/pashot/` only.

**Alternatives considered**: `origin: client` (the label would read "концепт · клиент" and overstate a delivered client site). Omitting `featured` (the home project list would not show it). A bespoke card component (violates principle I).

## Decision: English copy is transliterated

**Rationale**: `scripts/check.mjs` rejects Cyrillic in `/en/*` text and attributes, and in cover SVG text. The English title is Pashot, the city is Anapa, and the disclaimer is translated. The Russian page keeps the cafe's wording, including the required sentence.

**Alternatives considered**: Keeping «Пашот» on the English page (fails `npm run check`).

## Decision: Covers are portfolio line art, three files

**Rationale**: `ProjectCover` loads `/covers/<slug>.svg` and `/covers/light/<slug>.svg`. OG reads `src/assets/covers/<slug>.svg`. For Zerno those three files share one drawing; the light file only swaps the fallback colors. Pashot follows that. The drawing uses `#8B5CF6` and has no `<text>`, so the cafe's amber palette stays inside the demo.

**Alternatives considered**: A screenshot as the cover (other web cases use SVG line art; a raster cover also has to satisfy `work-cover.ts`).

## Decision: Scores come from a mobile Lighthouse run of `astro preview`

**Rationale**: Principle III. The brief's 99 / 100 is the previous result. The case table is filled from the run against the preview of `/demo/pashot/`, which is the deploy-like path (built files, not the dev server).

**Alternatives considered**: Copying 99 and 100 from the brief (forbidden if the new run differs). Measuring the dev server (unminified, not the shipped files).

# Implementation Plan: Pashot portfolio case

**Branch**: `feat/pashot-case` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-pashot-case/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Host the approved Pashot one-page cafe site as static files at `/demo/pashot/`, and add a Russian and English case that follows the existing work collection. The demo keeps its unofficial bar, footer note, and `noindex`. The portfolio sitemap is left as it is, because it never walks `public/`. Case cards appear wherever the collection already lists cases with `featured` and `carousel`.

## Technical Context

**Language/Version**: TypeScript on Node.js 22, Astro 7 (portfolio already pins `node >= 22.23.4` and `astro ^7.4.13`)

**Primary Dependencies**: Existing portfolio dependencies only. The cafe site is built with its own Astro 7 install outside the portfolio `package.json`, then copied in. No new portfolio dependency.

**Storage**: Files. Case MDX in `src/content/work`. Demo output in `public/demo/pashot/`. Screenshots in `src/assets/screenshots/`. Covers in `src/assets/covers/` and `public/covers/`.

**Testing**: `npm run check` (build, no Cyrillic on `/en` or covers, internal links). Browser pass of home, both case pages, and the demo at 1440px and 390px. Mobile Lighthouse against `astro preview`.

**Target Platform**: Static site on Timeweb, `https://dubstepmolitva.ru`, trailing slashes.

**Project Type**: Static portfolio site (Astro content collection + `public/` files).

**Performance Goals**: Publish the mobile Performance and Accessibility scores measured on the preview of `/demo/pashot/`. Do not copy the brief's 99 / 100 if the run differs.

**Constraints**: Sole author Bogdan. No AI mentions in code, commits, or the PR. Demo stays `noindex` and off the sitemap. English case and cover SVGs have no Cyrillic. Portfolio UI stays on `#8B5CF6`. Minimal diff. Do not touch `.env`.

**Scale/Scope**: One new case, two locales, one static demo, four to six screenshots, three cover SVGs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Cases are content entries**: Pass. New files are `src/content/work/pashot.mdx` and `src/content/work/en/pashot.mdx`. No new route template. Lists already read the collection.
- **II. Russian by default, English without Cyrillic**: Pass. English title is Pashot, city Anapa. Cover SVGs have no text nodes.
- **III. Claims match a source**: Pass. Scores are filled after the preview measurement. No quotes or business results. Concept note is explicit.
- **IV. Stay on this Astro site**: Pass. Demo is static files under `public/`. Portfolio `package.json` is unchanged. Cover accent is `#8B5CF6`.
- **V. Index only portfolio pages**: Pass. Sitemap code is not extended to `public/`. Demo HTML keeps `<meta name="robots" content="noindex">`. Case pages are indexed, which is what the sitemap already does for every `hasPage` case.

Post-design re-check: same five gates, still pass. No complexity exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/001-pashot-case/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pages.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/content/work/pashot.mdx
src/content/work/en/pashot.mdx
src/assets/covers/pashot.svg
src/assets/screenshots/pashot-*.png
src/lib/work.ts                         # CASE_TITLE_MID entries only
public/covers/pashot.svg
public/covers/light/pashot.svg
public/demo/pashot/                     # static build, not a second app
```

**Structure Decision**: Single Astro project. The cafe source is built outside the repo (handoff zip) and only its `dist/` is copied to `public/demo/pashot/`. That matches how Astro already serves `public/`, and it avoids a workspace or a new dependency. Existing cases do not host a second site in-repo; Gran and Zerno are external URLs, and the in-page demos are scripts. Neither pattern serves a full cafe site under a subpath, so `public/demo/pashot/` is the smallest fit.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations.

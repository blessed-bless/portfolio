# Implementation Plan: Portfolio redesign

**Branch**: `feat/portfolio-redesign` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-portfolio-redesign/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Rebuild the home page around a Three.js ring of real case covers, a data-driven work list with the existing cover lens, and short GSAP sections for process, counts, about, and stack. Keep the order prices, consent-gated Metrika, locales, and case URLs. Leave Lenis off so the wheel stays native. Ship a still-image fallback, a command-palette toy, and remove orphaned components and committed scratch files.

## Technical Context

**Language/Version**: TypeScript strict, Astro 7, Node >= 22.23.4

**Primary Dependencies**: Existing `three`, `gsap` (ScrollTrigger, SplitText, ScrambleTextPlugin), `@paper-design/shaders`, `lenis` (kept, not started). New devDependencies: `@astrojs/check`, `typescript`.

**Storage**: N/A. Content collections and static files.

**Testing**: `node --test scripts/check.test.mjs scripts/order.test.mjs` via `npm run check` (which also builds), plus `astro check`. Browser pass with Playwright/Chromium.

**Target Platform**: Static site on Timeweb Cloud Apps. Browsers with and without WebGL. RU default, EN under `/en/`.

**Performance Goals**: Native wheel speed. WebGL loop pauses off-screen and when the tab is hidden. Mobile uses the still/snap fallback instead of the ring.

**Constraints**: No new runtime dependencies. No `.env` access. No edits under a future Pashot path. No price edits in `src/data/order.ts`. Magnetic motion stays off for touch, narrow screens, reduced motion, and the low performance tier. Sole author Bogdan Shcherbinin. No assistant attribution.

**Scale/Scope**: Home (RU+EN), shared work rows, case cover transition, 404/command toy, privacy sentences, gitignore and junk removal. About, uses, notes, and order structure stay.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Sole authorship: commits use Bogdan Shcherbinin `<blessed-bless@users.noreply.github.com>`. No co-author trailers.
- No assistant names in code, comments, commits, or the pull request.
- Branch `feat/portfolio-redesign` into `cursor/portfolio-hero-and-home`. No merge, no push to `main` or the default branch.
- Secrets untouched.
- No new runtime dependency. `@astrojs/check` and `typescript` are dev-only and named in the pull request.
- Strict TypeScript, small modules, dead components removed in the same change.
- `npm run build`, `npm run check`, and `astro check` gate the pull request.
- Order prices are displayed and not edited. The pull request lists them under "Needs owner decision".

Post-design: same gates. Lenis stays in the repo because hash scrolling and magnetic skew already read `getLenis()` and fall back to native scroll. Starting it would fight ScrollTrigger pins.

## Project Structure

### Documentation (this feature)

```text
specs/001-portfolio-redesign/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── home-ui.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Hero.astro              # ring stage + still fallback
│   ├── WorkRows.astro          # data-driven list, hover preview, full index
│   ├── BusinessOffers.astro    # priced rows + agent row + process
│   ├── Who.astro
│   ├── StackGrid.astro
│   ├── ChannelStrip.astro
│   ├── Stats.astro
│   └── Contact.astro           # round Telegram control
├── scripts/
│   ├── hero-ring.ts            # curved panels, drag, parallax, dispose
│   ├── home-motion.ts          # short pin, counts, tint
│   ├── orbit-toy.ts            # palette / 404 only
│   ├── cover-lens.ts           # grain + slight RGB shift on rich previews
│   ├── cursor.ts               # open / drag / play
│   ├── page-transitions.ts     # skip wipe when a cover is shared
│   └── boot.ts                 # do not start Lenis
├── pages/index.astro
├── pages/en/index.astro
├── i18n/ru.ts
├── i18n/en.ts
├── i18n/types.ts
└── data/privacy.ts
```

**Structure Decision**: Stay inside the existing Astro tree. The home page composes sections. Cases keep coming from `getProjects(locale)`, so a case added in content shows up in the ring and the list without a layout edit.

## Complexity Tracking

No constitution violations.

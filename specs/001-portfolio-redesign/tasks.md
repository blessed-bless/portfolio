---
description: "Task list for the portfolio redesign"
---

# Tasks: Portfolio redesign

**Input**: Design documents from `/specs/001-portfolio-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/home-ui.md, quickstart.md

**Tests**: Existing `scripts/order.test.mjs` and `scripts/check.mjs` stay. No new test framework.

**Organization**: Tasks follow the user stories in spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Path Conventions

- Astro site at the repository root: `src/`, `scripts/`, `public/`

## Phase 1: Setup

**Purpose**: Branch identity and the typecheck the constitution requires

- [x] T001 Set repo git identity to Bogdan Shcherbinin and create `feat/portfolio-redesign` from `wip/codex-local`
- [x] T002 Add `@astrojs/check` and `typescript` as devDependencies and an `astro check` script in `package.json`

---

## Phase 2: Foundational

**Purpose**: Copy and motion flags every story shares

- [x] T003 Add the new `UiDict` fields in `src/i18n/types.ts`, `src/i18n/ru.ts`, and `src/i18n/en.ts` (headline, agent row, stats labels, toy, full-index)
- [x] T004 Set `--accent` to `#8B5CF6` with one lighter and one darker tint in `src/styles/tokens.css`, including the light theme
- [x] T005 Stop calling `startLenis()` from `src/scripts/boot.ts` so wheel scrolling stays native
- [x] T006 Extend `src/scripts/cursor.ts` so open, drag, and play labels work on a fine pointer only

**Checkpoint**: Strings, accent, native scroll, and cursor labels are in place

---

## Phase 3: User Story 1 - Understand the offer (Priority: P1)

**Goal**: First screen states the offer and shows real covers on a ring, with a still fallback

**Independent Test**: Open `/` and `/en/`. Headline is readable immediately. Ring or still image is visible. Telegram and order links work.

### Implementation

- [x] T007 [US1] Mount a curved cover ring in `src/scripts/hero-ring.ts` for every `Project` from `getProjects`, using `Project.cover`, `Project.title`, and `Project.summary` (see `data-model.md` Case)
- [x] T008 [US1] Wire the ring, caption, grain, and still fallback in `src/components/Hero.astro`, and delete `src/scripts/hero-scene.ts` once nothing imports it
- [x] T009 [US1] Point `src/pages/index.astro` and `src/pages/en/index.astro` at the redesigned hero

**Checkpoint**: Home first screen works in both locales with and without the ring

---

## Phase 4: User Story 2 - Browse work and open a case (Priority: P1)

**Goal**: Data-driven rows, floating preview, titles-only index, cover morph, scroll restore

**Independent Test**: Hover a row, toggle the full index, open a case, go back

### Implementation

- [x] T010 [P] [US2] Build `src/components/WorkRows.astro` from `getProjects(locale)` (`Project.slug`, `Project.title`, `Project.stack`, `Project.origin` in `data-model.md`)
- [x] T011 [US2] Raise grain and dispersion for `[data-lens-rich]` in `src/scripts/cover-lens.ts`
- [x] T012 [US2] Skip the chevron wipe when the click contains `[data-vt-cover]` in `src/scripts/page-transitions.ts`
- [x] T013 [US2] Render `WorkRows` on `src/pages/index.astro` and `src/pages/en/index.astro`

**Checkpoint**: A new case in the collection appears in the list without a layout edit

---

## Phase 5: User Story 3 - Process, identity, contact (Priority: P2)

**Goal**: Services with the published prices, process, counts, who, stack, optional channel, contact

**Independent Test**: Home shows four `<strong>` prices outside `#faq`. Order prices unchanged. Contact is Telegram and email.

### Implementation

- [x] T014 [US3] Restyle `src/components/BusinessOffers.astro` so each `serviceOffers` row keeps `<strong>{priceLabel}</strong>` (`Service offer.minPrice` and `Service offer.priceLabel` in `data-model.md`) and add the agent row with no price
- [x] T015 [P] [US3] Add `src/components/Stats.astro`, `src/components/Who.astro`, `src/components/StackGrid.astro`, and `src/components/ChannelStrip.astro`
- [x] T016 [US3] Add the round Telegram control in `src/components/Contact.astro` without removing the mailto link
- [x] T017 [US3] Compose the new sections in `src/pages/index.astro` and `src/pages/en/index.astro`, fetching channel posts with a failure that yields no block
- [x] T018 [US3] Pin the process briefly and count the stats in `src/scripts/home-motion.ts`, started from `src/scripts/boot.ts`

**Checkpoint**: `scripts/order.test.mjs` still passes and `/order/` prices are untouched

---

## Phase 6: User Story 4 - Scroll, motion, small screens (Priority: P2)

**Goal**: Native wheel, reduced motion, 360px and 390px, keyboard ring

**Independent Test**: Wheel the home page, emulate reduced motion, tab the ring controls, check 360px overflow

### Implementation

- [x] T019 [US4] Guard pins, reveals, and counts in `src/scripts/home-motion.ts` when reduced motion or the low tier is on
- [x] T020 [US4] Keep hero, work rows, and offers free of horizontal overflow at 360px in their component styles
- [x] T021 [US4] Pause and dispose the ring in `src/scripts/hero-ring.ts` via `observeActivity` and page swap

**Checkpoint**: Reduced motion shows every section immediately

---

## Phase 7: User Story 5 - Privacy, consent, toy (Priority: P3)

**Goal**: Privacy wording, Sweden operator line, toy off the main path, junk removed

**Independent Test**: Privacy pages in both languages. Toy from the palette and from 404. Home does not mount the toy.

### Implementation

- [x] T022 [US5] Reword the Telegram sentence and the operator line in `src/data/privacy.ts`
- [x] T023 [P] [US5] Add the `toy` action in `src/data/command-palette.ts` and `src/scripts/command-palette.ts`, and mount `src/scripts/orbit-toy.ts` from the palette and `src/pages/404.astro`
- [x] T024 [US5] Delete unused `WhoAmI.astro`, `StackMarquee.astro`, `ChannelFeed.astro`, `Services.astro`, `Manifest.astro`, `Preloader.astro`, `FeaturedWork.astro`, and `src/scripts/preloader.ts`
- [x] T025 [US5] Remove scratch screenshots, `tmp/`, unused pingo and zerno jpg/png covers, and extend `.gitignore`

**Checkpoint**: No dead component imports. Privacy no longer mentions a form submission or Omsk.

---

## Phase 8: Polish

**Purpose**: Gates from the constitution and quickstart.md

- [x] T026 Run `npm run build`, `npm run check`, and `astro check`
- [x] T027 Browser-check home, a case, `/order/`, `/privacy/`, and 404 in both themes and both locales, including wheel scroll and reduced motion
- [x] T028 Capture 1440px and 390px screenshots and a desktop recording for the pull request

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup blocks everything else
- Foundational blocks the user stories
- US1 and US2 are both P1. US2 can start once copy fields exist. US3 composes pages that US1 and US2 also edit, so it lands after those page edits
- US4 hardens the motion modules from US1 and US3
- US5 is independent of the ring except for the final cleanup
- Polish runs last

### User Story Dependencies

- **US1**: after foundational. No dependency on other stories
- **US2**: after foundational. Shares the home page with US1
- **US3**: after the home page exists. Prices come from `src/data/order.ts` and are not edited
- **US4**: after the ring and `home-motion.ts` exist
- **US5**: after the new sections replace the old components

### Parallel Opportunities

- T003 and T004 touch different files
- T010 can be written beside T007
- T015 can be written beside T014
- T023 can be written beside T022

### Parallel Example: User Story 2

```bash
Task: "Build src/components/WorkRows.astro"
Task: "Raise grain in src/scripts/cover-lens.ts"
```

---

## Implementation Strategy

### MVP First

1. Finish setup and foundational copy
2. Ship the hero (US1)
3. Ship the work list (US2)
4. Then process, about, and contact (US3)

### Incremental Delivery

Each story leaves the site buildable. The order-page test is the guard for US3. Browser verification is the guard for US4.

---

## Notes

- Do not edit `Service offer.minPrice` in `src/data/order.ts`
- Do not create or edit Pashot files
- Do not read or write `.env*`
- Commit the spec kit files before the implementation commit

---

description: "Task list for the Pashot portfolio case"
---

# Tasks: Pashot portfolio case

**Input**: Design documents from `/specs/001-pashot-case/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No new test runner. Gate is `npm run check` plus the browser pass in quickstart.md.

**Organization**: Tasks follow the user stories in spec.md. The portfolio already has the case template, so listing work is frontmatter, not a new component.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

- Portfolio root: `/agent/repos/portfolio`
- Cafe source (not committed): `/tmp/pashot/src`
- Demo output: `public/demo/pashot/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the portfolio stays a single Astro app

- [x] T001 Confirm `package.json` gains no dependency and `.gitignore` already ignores `node_modules/`, `dist/`, and `.env` in `/agent/repos/portfolio`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: A static demo whose URLs work under `/demo/pashot/`

**⚠️ CRITICAL**: No case page can show real screenshots until this phase is done

- [x] T002 Set `base: '/demo/pashot/'` in `/tmp/pashot/src/astro.config.mjs` and route root hashes through `/tmp/pashot/src/src/lib/demo-hash.ts` from `SiteHeader.astro`, `SiteFooter.astro`, and `pages/404.astro`
- [x] T003 Build the cafe site and copy `dist/` to `public/demo/pashot/` so every asset URL starts with `/demo/pashot/`

**Checkpoint**: `public/demo/pashot/index.html` exists, keeps `noindex`, the unofficial bar, and the footer note

---

## Phase 3: User Story 1 - Open the unofficial cafe demo (Priority: P1) 🎯 MVP

**Goal**: A visitor can use the menu, gallery, map, and contacts on the hosted demo

**Independent Test**: Open `/demo/pashot/` at 1440px and 390px. Switch a category tab and a price tab. Open and close the lightbox. Console stays clean and no request 404s.

- [x] T004 [US1] Confirm `public/demo/pashot/index.html` keeps the unofficial bar, the footer disclaimer, and `<meta name="robots" content="noindex">` per `contracts/pages.md`
- [x] T005 [US1] Exercise menu tabs, a price filter, and the gallery lightbox on `/demo/pashot/` at 1440px and 390px and record any console error or 404

**Checkpoint**: Demo is usable on its own. Sitemap code is untouched, so the demo is not listed.

---

## Phase 4: User Story 2 - Read the case in Russian and English (Priority: P2)

**Goal**: Both case pages explain the rebuild, show screenshots, and link only to the demo

**Independent Test**: Open `/work/pashot/` and `/en/work/pashot/`. The Russian note is exact. The English page has no Cyrillic. Scores match the measurement.

- [x] T006 [P] [US2] Draw `src/assets/covers/pashot.svg`, `public/covers/pashot.svg`, and `public/covers/light/pashot.svg` in the portfolio line style with accent `#8B5CF6` and no text nodes, per data-model.md `CaseEntry.cover`
- [x] T007 [US2] Save desktop and mobile screenshots of the demo into `src/assets/screenshots/pashot-hero-1440.png`, `pashot-hero-390.png`, `pashot-menu-1440.png`, and `pashot-menu-390.png`
- [x] T008 [US2] Measure mobile Performance and Accessibility on a static preview of `/demo/pashot/` and keep the JSON outside git
- [x] T009 [P] [US2] Write `src/content/work/pashot.mdx` with data-model.md `CaseEntry` fields (`title` Пашот, `slug` pashot, `year` 2026, `role` Фронтенд, `stack` Astro and TypeScript, `status` концепт, `origin` demo, `links.demo` `/demo/pashot/`, `order` 11, `tags` TypeScript and Web, `hasPage` true, `featured` true, `carousel` true) and the exact disclaimer
- [x] T010 [P] [US2] Write `src/content/work/en/pashot.mdx` with the same constrained fields in English (`title` Pashot, `status` concept, `role` Frontend) and no Cyrillic
- [x] T011 [US2] Add `pashot` to `CASE_TITLE_MID` in `src/lib/work.ts` for both locales

**Checkpoint**: Both case files render through the existing `[slug].astro` pages

---

## Phase 5: User Story 3 - Find the case among the other work (Priority: P3)

**Goal**: Home, works list, and command palette show Pashot because the entry is `featured`, `carousel`, and `hasPage`

**Independent Test**: The four pages and the palette each show one Pashot link. No list component is edited.

- [x] T012 [US3] Leave `src/components/FeaturedWork.astro`, `src/pages/work/index.astro`, `src/pages/en/work/index.astro`, and `src/data/command-palette.ts` unchanged and confirm they already list every `hasPage` / `featured` / `carousel` entry, including the new `CaseEntry`

**Checkpoint**: Cards appear with no new card component

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Gate and sitemap

- [x] T013 Run `npm run check` from `/agent/repos/portfolio` and fix any Cyrillic or broken-link failure
- [x] T014 Confirm `dist/sitemap.xml` contains `/work/pashot/` and `/en/work/pashot/` and does not contain `/demo/pashot`
- [x] T015 Re-check the built site in a browser: home card, both case pages, and the demo at 1440px and 390px, with no console errors and no 404s

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) before the demo build
- Foundational (Phase 2) before screenshots, scores, and case copy
- US1 before US2 screenshots
- US2 case files before US3 can be observed and before the check
- Polish last

### User Story Dependencies

- **US1**: depends on Phase 2 only
- **US2**: depends on US1 for screenshots and the score
- **US3**: depends on the frontmatter written in US2. No extra code

### Parallel Opportunities

- T006 can run beside the demo build
- T009 and T010 can run together after T007 and T008
- T011 touches `work.ts` and stays after the MDX files only to avoid a stale title; it can run once the slugs are known

### Parallel Example: User Story 2

```bash
# After screenshots and the score exist:
# write src/content/work/pashot.mdx
# write src/content/work/en/pashot.mdx
```

### Implementation Strategy

MVP is the hosted demo (US1). The case pages (US2) explain it. The lists (US3) come from frontmatter the site already understands. Ship all three; a demo without a case would violate the request.

## Notes

- Do not add a portfolio dependency.
- Do not invent quotes or business results.
- If the measured scores differ from 99 and 100, publish the measured ones.

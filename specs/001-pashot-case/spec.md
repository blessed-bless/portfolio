# Feature Specification: Pashot portfolio case

**Feature Branch**: `feat/pashot-case`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Add a portfolio case for the Pashot cafe in Anapa: a live unofficial demo on the portfolio, Russian and English case pages, and a card wherever cases are listed. The cafe allowed the materials on the condition that the work is marked as not the official cafe site."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open the unofficial cafe demo (Priority: P1)

A visitor opens the Pashot demo from the portfolio and uses it as a one-page cafe site: menu, photos, map, and contacts. They can tell immediately that this is not the cafe's official site.

**Why this priority**: Without a working demo the case has nothing to show, and the cafe's permission depends on the unofficial label.

**Independent Test**: Open the demo address on a desktop width and a phone width. Use the menu, the gallery, and the contact block. Confirm the unofficial label is visible and that a search listing of the portfolio does not include this address.

**Acceptance Scenarios**:

1. **Given** the portfolio is built, **When** a visitor opens the Pashot demo, **Then** the page shows the cafe name, a menu, photos, a map, and contacts, and every image and font loads.
2. **Given** the demo is open, **When** the visitor switches menu categories and a price filter, **Then** the list changes to match that choice.
3. **Given** the demo is open, **When** the visitor opens a photo, **Then** a lightbox shows that photo and can be closed.
4. **Given** the demo is open at 1440px and at 390px, **When** the visitor scrolls the page, **Then** the page scrolls normally and the unofficial bar stays visible at the top.
5. **Given** the demo HTML, **When** a crawler reads it, **Then** the page asks not to be indexed, and the portfolio's sitemap does not list the demo address.
6. **Given** the visitor follows the menu, brand, or footer links inside the demo, **When** those links are in-page, **Then** they stay on the demo and do not jump to the portfolio home.

---

### User Story 2 - Read the case in Russian and English (Priority: P2)

A visitor opens the Pashot case in either language, understands what was rebuilt, sees real screenshots of the demo, and can open the demo. They do not see invented praise, client quotes, or business results.

**Why this priority**: The case is how the work is explained. The demo can stand alone, but the portfolio entry is the reason the demo is hosted here.

**Independent Test**: Open the Russian case and the English case. Check the disclaimer, the demo button, the screenshots, and that the published scores match a fresh measurement of the demo.

**Acceptance Scenarios**:

1. **Given** the Russian case, **When** a visitor reads the top of the page, **Then** they see the note «Неофициальный сайт. Концепт для портфолио, материалы используются с разрешения кафе» and a button that opens the demo.
2. **Given** the English case, **When** a visitor reads it, **Then** the same warning is in English, the cafe is named Pashot in Anapa, and the page contains no Cyrillic.
3. **Given** either case, **When** the visitor looks for a quote, a revenue figure, or a "results" claim, **Then** none are present.
4. **Given** either case, **When** the visitor looks at the scores, **Then** the mobile performance score and the accessibility score are the ones measured on the demo preview, not a number copied from the brief.
5. **Given** either case, **When** the visitor looks for another official cafe website, **Then** the only button is the demo. Contact links that already live inside the demo stay there.

---

### User Story 3 - Find the case among the other work (Priority: P3)

A visitor browsing the home page or the works list in either language sees Pashot as a card in the same style as the other cases, and can open the case.

**Why this priority**: A case that is not listed is invisible. The card depends on the case existing.

**Independent Test**: Open the Russian home, the English home, the Russian works list, and the English works list. Confirm one Pashot card on each, linking to the matching case.

**Acceptance Scenarios**:

1. **Given** the Russian home, **When** the visitor scans the project list, **Then** Pashot appears as a row in the same style as the other projects and links to the Russian case.
2. **Given** the English home, **When** the visitor scans the project list, **Then** Pashot appears in English and links to the English case.
3. **Given** the works list in either language, **When** the visitor scans the cards, **Then** Pashot is present and uses the same card treatment as the other cases.
4. **Given** the command palette, **When** the visitor searches for Pashot, **Then** the case is offered.

---

### Edge Cases

- A direct visit to the demo, not via the case, still shows the unofficial bar, the footer note, and the noindex instruction.
- Refreshing the demo on a phone width does not lose menu tabs, the price filter, or the lightbox.
- The English case and the cover art do not contain Cyrillic, including the cafe name.
- The portfolio sitemap lists the Russian and English case pages and does not list the demo.
- A missing demo asset is a failure: the page must not reference a file that 404s.
- The portfolio's own purple cover style stays on the case card. The demo keeps the cafe's own look.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The portfolio MUST host a working Pashot demo that a visitor can open from the case.
- **FR-002**: The demo MUST keep its unofficial bar and its footer note that it is not the official cafe site.
- **FR-003**: The demo MUST ask crawlers not to index it, and the portfolio sitemap MUST NOT list the demo.
- **FR-004**: Menu category tabs, the price filter, the photo lightbox, the map, and the contacts MUST work inside the demo at 1440px and at 390px.
- **FR-005**: Images and the logo font MUST load from the demo's own address, not from the portfolio root.
- **FR-006**: In-page navigation inside the demo MUST stay on the demo.
- **FR-007**: The site MUST offer a Russian case page and an English case page for Pashot, using the same structure as the existing cases.
- **FR-008**: The Russian case MUST show the exact note «Неофициальный сайт. Концепт для портфолио, материалы используются с разрешения кафе».
- **FR-009**: The English case MUST state the same warning in English and MUST contain no Cyrillic.
- **FR-010**: Each case MUST offer one button that opens the demo and MUST NOT add links to official cafe resources beyond what the demo already contains.
- **FR-011**: Each case MUST show desktop and mobile screenshots taken from this demo.
- **FR-012**: Each case MUST publish the mobile performance score and the accessibility score measured on a deploy-like preview of this demo.
- **FR-013**: The case MUST NOT include client quotes, invented metrics, or invented business results.
- **FR-014**: The case MUST appear on the home project list, the works list, and the command palette, in Russian and in English, in the same card style as the other cases.
- **FR-015**: The case card and cover MUST use the portfolio's purple visual system. The demo MUST keep the cafe's own visual system.

### Key Entities

- **Case**: One portfolio entry in two languages. Title, year, role, stack, status, short summary, unofficial note, demo link, screenshots, and the two measured scores. No quote and no business result.
- **Demo**: The one-page cafe site as hosted on the portfolio. Unofficial bar, footer note, noindex instruction, menu, gallery, map, contacts, images, and fonts.
- **Case card**: The list row or card that points at the case. Same fields and styling as the other cases. Cover art in the portfolio palette.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the demo, at both 1440px and 390px, menu tabs, the price filter, and the photo lightbox each respond on the first try, and the browser reports no console errors and no failed file requests.
- **SC-002**: A visitor can see the unofficial warning without scrolling on both the demo and each case page.
- **SC-003**: The portfolio sitemap contains the two case addresses and zero demo addresses.
- **SC-004**: The scores printed on the case match the measurement log of the demo preview, one for one.
- **SC-005**: Pashot is visible once on the Russian home, once on the English home, once on each works list, and once in each language's command palette.
- **SC-006**: The English case page and the cover artwork contain zero Cyrillic characters.

## Assumptions

- The English name is Pashot and the city is Anapa. The English page cannot carry the Cyrillic name without failing the site's existing English check.
- The case is marked as a concept and as a demo, not as a shipped official site. That matches the cafe's condition and the way other concept cases are labeled.
- The case is included in the home project list and the hero, because those surfaces list the cases that are marked for them today. It is ordered after the current cases so existing cards do not move.
- The year is 2026, the year of this rebuild.
- The role is frontend. The stack shown is the stack of the rebuilt page.
- The only new portfolio button is "open the demo". Phone, map, Instagram, and delivery links that already exist inside the demo stay in the demo.
- Published scores are whatever a mobile lab run of the hosted demo returns. The 99 and 100 in the brief are the previous result, not a number to copy if the new run differs.
- Screenshots are taken from this hosted demo, desktop and mobile, including the first screen and the menu.
- The demo is a static copy of the approved cafe page. Its source is not turned into a second app inside the portfolio build.

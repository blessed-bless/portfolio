# Feature Specification: Portfolio redesign

**Feature Branch**: `feat/portfolio-redesign`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Redesign dubstepmolitva.ru into a striking, animation-rich portfolio with real 3D, while staying clear for local business owners and startups."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand the offer in one screen (Priority: P1)

A local business owner opens the home page and, within a few seconds, sees what Bogdan builds (sites with booking, Telegram bots and Mini Apps, automation, AI agents) and who it is for. The first screen shows real project images and a way to write on Telegram or open pricing.

**Why this priority**: If the first screen is unclear, the rest of the motion does not matter.

**Independent Test**: Open `/` and `/en/` in a desktop browser. Read the headline without scrolling. Confirm a project image, a Telegram link, and a path to the order page are visible.

**Acceptance Scenarios**:

1. **Given** the Russian home page, **When** it loads, **Then** the headline names the kind of work and the audience, and a project image is visible beside or under the text.
2. **Given** the English home page, **When** it loads, **Then** the same offer is present in English with no Cyrillic in the visible copy.
3. **Given** animated graphics, motion, or a capable device is unavailable, **When** the home page loads, **Then** a still project image and the same headline remain usable.

---

### User Story 2 - Browse work and open a case (Priority: P1)

A visitor scans a list of projects (title, client type, stack), hovers a row to see a preview, opens a case, and can go back to the same place in the list.

**Why this priority**: Cases are the proof. The list must accept a new case without a layout change.

**Independent Test**: On the home page, hover a row, open a case, use the browser Back control, and confirm the list and scroll position return.

**Acceptance Scenarios**:

1. **Given** a pointer on a wide screen, **When** the visitor hovers a work row, **Then** a preview of that project's cover follows the pointer.
2. **Given** the full-index control, **When** it is turned on, **Then** the list shows titles without requiring the preview to understand the project.
3. **Given** a case opened from a cover, **When** the visitor goes back, **Then** the previous scroll position is restored.
4. **Given** a new case added to the project data, **When** the site is built, **Then** it appears in the list without a change to the list layout.

---

### User Story 3 - See how a project runs and how to start (Priority: P2)

The visitor reads four short steps, sees real counts from the published work, reads who Bogdan is and which tools he uses, and reaches Telegram or email. Pricing stays on the order page and still appears on the home page exactly as published.

**Why this priority**: Business owners need the process and a contact path, not only a showreel.

**Independent Test**: Scroll the home page to the process, the about block, the stack, and the contact block. Open `/order/` and confirm the four published prices are unchanged.

**Acceptance Scenarios**:

1. **Given** the home page, **When** the visitor reaches the process, **Then** each step is readable and the current step is marked.
2. **Given** the contact block, **When** the visitor looks for a form, **Then** there is none: only Telegram and email.
3. **Given** the order page, **When** prices are compared with the home page, **Then** the four published price strings match and were not edited.

---

### User Story 4 - Move through the site without strain (Priority: P2)

Scrolling with a mouse wheel feels like the browser's own scroll. Reduced motion shows content immediately. A phone at 390px and 360px has no sideways page scroll, and tap targets stay large enough to hit. Keyboard users can move the project ring and see focus.

**Why this priority**: The site is allowed to be rich, and it is not allowed to trap the scroll or hide content.

**Independent Test**: Wheel the home page, emulate reduced motion, tab to the project controls, and check 390px and 360px widths.

**Acceptance Scenarios**:

1. **Given** reduced motion, **When** any page loads, **Then** text is fully visible, nothing is pinned to the scroll, and no animated image loop runs.
2. **Given** a mouse wheel on the home page, **When** the visitor scrolls, **Then** the page moves at the native wheel rate.
3. **Given** a 360px viewport, **When** the home page, a case, the order page, and the privacy page are opened, **Then** the document does not scroll sideways.

---

### User Story 5 - Privacy, analytics, and a side toy (Priority: P3)

Analytics stays off until the visitor allows it, and turns off when they withdraw. The privacy page describes writing on Telegram, not submitting a form. A small interactive toy exists only on the 404 page or behind the command palette.

**Why this priority**: Consent and the privacy wording are already live. The toy must not sit on the sales path.

**Independent Test**: Load the home page with no consent and confirm the analytics tag is absent. Open the privacy page and read the Telegram sentence. Open the command palette and start the toy, then close it.

**Acceptance Scenarios**:

1. **Given** no analytics consent, **When** a page loads, **Then** the analytics tag is not requested.
2. **Given** the privacy page in either language, **When** the visitor reads the Telegram paragraph, **Then** it refers to writing on Telegram.
3. **Given** the command palette, **When** the visitor runs the toy command, **Then** a small interactive scene opens and can be closed. It is not part of the home page flow.

### Edge Cases

- WebGL context loss or a weak device: the still image and the text controls remain.
- The Telegram channel cannot be read at build time: the home page still builds and simply omits that block.
- A case has no live demo: the list and the ring still show its cover and open the case page.
- Light and dark themes: text meets AA contrast on both.
- The tab is hidden or the canvas leaves the screen: the image loop pauses.
- Keyboard only: previous and next project work, and focus is visible.
- Back from a case after a long scroll: the home scroll position returns.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home page MUST state what is built and for whom in the first screen, in Russian and in English.
- **FR-002**: The first screen MUST show real project images in a sideways sequence the visitor can drag on a capable desktop, with the active title and a one-line result in text.
- **FR-003**: When motion, animated graphics, or device capacity is insufficient, the first screen MUST show a still project image and the same text controls.
- **FR-004**: The work list MUST be generated from the case collection and MUST show title, client type, and stack.
- **FR-005**: On a fine pointer, hovering a work row MUST show a preview that follows the pointer. The preview MUST NOT be the only place that information exists.
- **FR-006**: The visitor MUST be able to switch the work list to a titles-only index.
- **FR-007**: Opening a case from its cover SHOULD animate that cover into the case header when the browser supports shared element transitions. Other navigations keep the existing page wipe. Back navigation MUST restore scroll position.
- **FR-008**: The home page MUST present services for business owners, each with an outcome line and a link to a matching case or demo, and MUST keep the order page as the longer explanation.
- **FR-009**: The four published order prices MUST appear on the home page outside the FAQ and MUST NOT be changed.
- **FR-010**: The home page MUST include a short process, a who-I-am block, and a stack block using the existing facts.
- **FR-011**: A channel block MUST render only when posts were collected at build time. A failed fetch MUST NOT fail the build.
- **FR-012**: Contact MUST stay Telegram (`https://t.me/ketasonx`) and `bogdan@dubstepmolitva.ru`, with no lead form.
- **FR-013**: Scroll-linked motion MUST keep wheel, trackpad, and keyboard scrolling at the native rate. Any pinned step sequence MUST be short.
- **FR-014**: Reduced motion MUST disable image loops, pinning, parallax, and title scramble, and MUST show content immediately.
- **FR-015**: Viewports of 390px and 360px MUST NOT overflow horizontally. Interactive controls MUST be at least 44px. The custom pointer MUST NOT appear on touch.
- **FR-016**: The project sequence MUST be operable from the keyboard. Focus MUST be visible.
- **FR-017**: Image loops MUST pause when the tab is hidden or the canvas is off-screen, and MUST release their resources when the page changes.
- **FR-018**: Analytics MUST load only after consent, MUST unload when consent is withdrawn, and MUST NOT enable session replay. The counter id and allowed hosts stay as they are.
- **FR-019**: Privacy copy MUST describe writing on Telegram. The operator location MUST be Sweden and MUST NOT name Omsk or Russia as the operator's city.
- **FR-020**: Russian and English MUST stay in parity for every new sentence. Existing case URLs, social images, structured data, sitemap, robots, and the verification file MUST keep working.
- **FR-021**: The command palette, theme switch, and skip link MUST keep working.
- **FR-022**: A small interactive toy MUST be reachable from the 404 page or the command palette, and MUST NOT run on the home page path.
- **FR-023**: Unused home components left behind by the redesign MUST be removed. Committed scratch screenshots and local tool folders MUST be removed from the tree and ignored.
- **FR-024**: Primary actions on a fine pointer MAY pull slightly toward the pointer and MAY use a round contact control. The custom pointer MAY show a short label such as open, drag, or play. These behaviours MUST turn off for touch, small screens, reduced motion, and a low performance tier.

### Key Entities

- **Case**: A published project with a stable URL, title, year, role, stack, origin, cover, summary, and links. The list and the first-screen sequence both read this collection.
- **Service offer**: A priced service on the order page (title, price, timing, example case). Prices are owner-controlled and are displayed, not edited.
- **Consent**: The visitor's choice to allow or refuse analytics. The tag exists only while consent is granted.
- **Channel post**: Optional title text, date, and link collected when the channel can be read. Absence is a valid state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can say what is offered and for whom after looking at the first screen for under 3 seconds.
- **SC-002**: From the home page, a visitor can open a case and return to the same scroll position in one Back action.
- **SC-003**: With reduced motion on, every home section's text is visible on first paint of that section, with no pinned scroll range.
- **SC-004**: At 360px and 390px, the home page, one case, the order page, and the privacy page have no horizontal document scroll.
- **SC-005**: Both locales, both themes, the order page, the privacy page, and the 404 page load without a console error during the scripted pass.
- **SC-006**: The four order prices on the home page match the order page character for character, and the order page has no enquiry form.
- **SC-007**: With consent refused, the analytics host is not requested. After consent, refusing it again removes the tag.
- **SC-008**: English HTML contains no Cyrillic. The production build and the link check complete without errors.

## Assumptions

- The audience is a local business owner or a startup founder deciding whether to write on Telegram. Motion supports that decision.
- The case collection remains the source for the list and the first-screen sequence, including cases added on another branch.
- Published order prices stay at their current amounts. The owner reviews them later.
- Residence for the privacy operator line is Sweden. Service areas already published elsewhere are left as they are.
- A channel block is optional. An empty result is success, not an error.
- Native scrolling is preferred to smoothed scrolling wherever the two would fight the wheel.
- Beauty is the goal, and a broken or trapped page is a failed release.

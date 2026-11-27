# UI contract: home and related surfaces

## Home (`/` and `/en/`)

Sections, in order:

1. Hero. Headline, audience line, Telegram link, order link, project ring or still image, caption (`aria-live="polite"`), previous and next buttons.
2. Work rows from `getProjects(locale)`. Titles-only toggle. Preview only as an enhancement.
3. Service rows from `serviceOffers(locale)` with price in `<strong>`, plus one agent row without a price. Link to `/order/`.
4. Process steps from `t.process`.
5. Counts: published cases, cases with a demo or live link, service rows including the agent row.
6. Who-I-am from `t.home.whoami`.
7. Stack from `t.aboutStackGroups`.
8. Channel, only if `fetchChannelPosts` returned posts.
9. FAQ (`#faq`) without the price strings inside it.
10. Contact (`#contact`) with `https://t.me/ketasonx` and `mailto:bogdan@dubstepmolitva.ru`. No form.

## Work row

- Link: localized `/work/{slug}/`.
- Cover `transition:name` equals `work-cover-{slug}`.
- Attributes: `data-cover-lens`, `data-lens-rich` on the preview; `data-cursor-open` on the link.
- Titles-only mode sets `data-mode="full"` on the list and hides stack and preview.

## Case header

Already uses `work-cover-{slug}` on the cover. Do not rename it.

## Command palette

New action id `action-toy`, action `toy`. It opens the toy dialog and does not navigate.

## 404

Existing liquid-metal mark stays. A play control opens the same toy dialog.

## Motion flags

- `prefers-reduced-motion: reduce` or the low performance tier: no ring loop, no pin, no scramble, no custom cursor.
- Pointer and hover and width over 900px: cursor labels, magnetic primary buttons, lens.

## Analytics

Unchanged contract in `src/scripts/metrika.ts` and the cookie notice.

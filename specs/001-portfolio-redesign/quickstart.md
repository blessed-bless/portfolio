# Quickstart: Portfolio redesign

## Prerequisites

- Node >= 22.23.4
- `npm install` in the repo root

## Checks

```bash
npm run build
npm run check
npx astro check
```

`npm run check` builds again, then fails if English HTML contains Cyrillic or an internal link is broken. `scripts/order.test.mjs` requires the four order prices on the home page, outside `#faq`, and Telegram plus email on `/order/` with no form.

## Browser pass

Start `npx astro dev --background`, then open:

- `/` and `/en/` in dark and light
- one case, `/order/`, `/privacy/`, a missing path for the 404
- 1440px, 390px, and 360px
- reduced motion emulation
- mouse wheel on the home page (not only `scrollTo`)
- hover a work row, open a case, go back
- command palette toy, then close it

Screenshots for the pull request: home, one case, and `/order/` at 1440px and 390px. A desktop recording of the wheel, the row hover, opening a case, and going back.

## Owner decision

Do not change values in `src/data/order.ts`. List the current prices in the pull request.

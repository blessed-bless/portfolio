# Page contract: Pashot

Visitor-visible addresses on `https://dubstepmolitva.ru`. Trailing slash required.

## `GET /demo/pashot/`

- HTML of the cafe page.
- Response contains the unofficial bar: «Неофициальный сайт. Концепт для портфолио».
- Response contains the footer sentence that this is not the official cafe site.
- Response contains `<meta name="robots" content="noindex"`.
- Stylesheet, script, font, and image URLs start with `/demo/pashot/`.
- In-page nav targets `/demo/pashot/#menu`, `/demo/pashot/#about`, `/demo/pashot/#gallery`, `/demo/pashot/#contacts`, and `/demo/pashot/#top`.
- Menu tabs and the price filter are in the page. The gallery exposes a lightbox dialog.
- No portfolio header, footer, or purple chrome.

## `GET /work/pashot/`

- Uses the existing case layout (cover, meta grid, MDX body, next case, actions).
- Visible note is exactly: «Неофициальный сайт. Концепт для портфолио, материалы используются с разрешения кафе».
- A control labeled «Открыть демо» points at `/demo/pashot/`.
- No link to Instagram, Yandex, or the delivery menu from the case body.
- Body includes at least one desktop screenshot and one mobile screenshot.
- Body includes the measured mobile performance score and accessibility score.

## `GET /en/work/pashot/`

- Same layout as the Russian case.
- Title and visible copy use Pashot and Anapa.
- The unofficial warning is in English.
- A control labeled "Open demo" points at `/demo/pashot/`.
- The rendered page contains no Cyrillic in text, `alt`, `aria-label`, or `title`.

## `GET /sitemap.xml`

- Contains `https://dubstepmolitva.ru/work/pashot/`.
- Contains `https://dubstepmolitva.ru/en/work/pashot/`.
- Does not contain `/demo/pashot`.

## Home and works lists

- `/` and `/en/` project lists each show one Pashot row linking to the locale's case.
- `/work/` and `/en/work/` each show one Pashot card in the existing card markup.
- The command palette lists the case in both locales because it lists every `hasPage` project.

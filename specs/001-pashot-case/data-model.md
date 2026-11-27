# Data model: Pashot portfolio case

The case is one content-collection entry per locale. Field rules are the existing `work` schema in `src/content.config.ts`. No new collection and no database.

## CaseEntry

| Field | Rule |
| --- | --- |
| title | RU: `Пашот`. EN: `Pashot`. Required string. |
| slug | `pashot` in both locales. Required string. |
| year | `2026`. Required string. |
| role | RU: `Фронтенд`. EN: `Frontend`. Required string. |
| stack | `['Astro', 'TypeScript']`. Array, min 1. |
| status | RU: `концепт`. EN: `concept`. Enum `workStatus`. |
| origin | `demo` in both locales. Enum `workOrigin`. |
| cover | `../../assets/covers/pashot.svg`. Required string. The file must exist for OG, and `public/covers/pashot.svg` plus `public/covers/light/pashot.svg` must exist for the page. |
| summary | One sentence. RU names the cafe and Anapa and lists menu, gallery, map, contacts. EN uses Pashot and Anapa and no Cyrillic. Required string. |
| links.demo | `/demo/pashot/`. Optional string on the links object. `github`, `live`, and `bot` stay unset. |
| order | `11`. Number. Same in both locales. |
| tags | `['TypeScript', 'Web']`. Each value is enum `workTag`. |
| hasPage | `true`. |
| featured | `true`. This is what puts the row on the home project list. |
| carousel | `true`. This is what puts the cover in the hero. |

## CaseBody

Not schema-checked. Both MDX bodies use the existing case components (`Button`, `Figure`) and the classes `case-lead-cta` and `case-note`.

| Piece | Rule |
| --- | --- |
| disclaimer | RU exact sentence: «Неофициальный сайт. Концепт для портфолио, материалы используются с разрешения кафе». EN translation, no Cyrillic. |
| primary action | One button to `/demo/pashot/`. No second button to Instagram, maps, or delivery. |
| screenshots | At least one 1440px and one 390px capture of this demo, imported from `src/assets/screenshots/`. |
| scores | Mobile performance and accessibility from the preview measurement. No other metrics. |
| excluded | Client quotes, revenue, conversion, "results" claims. |

## DemoBundle

Static files under `public/demo/pashot/`. Not a content entry.

| Piece | Rule |
| --- | --- |
| entry | `index.html` served at `/demo/pashot/`. |
| robots | The page `<meta name="robots" content="noindex">` from the cafe layout stays. |
| banner | The portfolio bar text stays. |
| footer | The "not the official site" sentence stays. |
| assets | Every `src`, `href`, and `srcset` that points at this site starts with `/demo/pashot/`. |
| in-page links | Hashes resolve under `/demo/pashot/`, not `/`. |

## Relationships

- A `CaseEntry` links to one `DemoBundle` via `links.demo`.
- The home list, `/work`, the palette, the hero, the sitemap, and OG include a `CaseEntry` only through the existing readers (`featured`, `carousel`, `hasPage`).
- The sitemap includes the case URLs and does not include the demo URL.

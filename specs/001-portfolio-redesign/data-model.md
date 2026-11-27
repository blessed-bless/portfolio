# Data model: Portfolio redesign

No new stored entities. The redesign reads collections and dictionaries that already exist.

## Case (`Project` in `src/lib/work-types.ts`)

| Field | Constraint |
| --- | --- |
| slug | Stable URL key. List and ring key off it. |
| title | Visible row title and ring caption. |
| role | Fallback category when no showcase copy exists. |
| stack | Visible on the row. Hidden in titles-only mode. |
| origin | Client type label via `workOrigin`. |
| cover | Public cover URL. Required for the ring and the preview. |
| summary | One-line result when showcase copy has no scenario. |
| links | Optional demo, live, bot, github. Missing links still open the case. |
| order | Sort order from the content collection. |
| hasPage | Only cases with a page are listed (`getProjects`). |
| featured | Unused by the new home list. The ring lists every case page. |

Relationship: one case, one RU document and one EN document, same slug.

## Service offer (`serviceOffers` in `src/data/order.ts`)

| Field | Constraint |
| --- | --- |
| id | `website`, `booking`, `bot`, `automation`. Do not add or rename. |
| minPrice | 30000, 50000, 25000, 20000. Do not edit. |
| weeks | Display timing. `null` means "timing after assessment". |
| caseSlug | Link target. Existing values stay. |
| priceLabel | `от N ₽` or `from N ₽`. Home renders it in `<strong>` outside `#faq`. |

## Agent row (copy only)

| Field | Constraint |
| --- | --- |
| title | RU and EN in `UiDict.home`. |
| outcome | One sentence. No price. |
| href | `/work/shipcrew/`, localized at render. |

## Channel post (`ChannelPost`)

| Field | Constraint |
| --- | --- |
| text | Clipped. Empty text is dropped by the parser. |
| date | ISO datetime from the preview HTML. |
| href | Absolute Telegram URL. |

State: missing network → `[]` → section omitted.

## Consent

Unchanged. `src/scripts/metrika.ts` loads counter `114410604` only after consent, calls `destruct` on revoke, and keeps Webvisor off. Hosts remain dubstepmolitva.ru and www.

## UI dictionary

Every new visible string is a field on `UiDict` with both `ru` and `en` values. English values contain no Cyrillic.

# Research: Portfolio redesign

## Decision: Curved ring in the existing Three.js scene

**Decision**: Replace `hero-scene.ts` with `hero-ring.ts`. Each case cover is a bent `PlaneGeometry` on a ring. Drag and buttons rotate it. The wheel does not.

**Rationale**: The live carousel is already WebGL, but it is a flat stack. A ring matches the requested sideways drag and keeps texture loading on `rasterizeCoverUrl`.

**Alternatives considered**: Keep the flat carousel (misses the brief). A full-page scroll-scrubbed ring (hijacks the wheel).

## Decision: Leave Lenis stopped

**Decision**: `boot.ts` does not call `startLenis()`. `getLenis()` stays for callers that already tolerate `null`.

**Rationale**: ScrollTrigger pins plus smoothed wheel scroll fight mice and Windows trackpads. The spec requires native wheel speed. Hash scrolling already uses `scrollIntoView` when Lenis is absent. Magnetic skew already uses `window.scrollY` delta in that case.

**Alternatives considered**: Lenis with a high lerp. Still a second scroller under a pin.

## Decision: Reuse the cover lens for the floating preview

**Decision**: Each work row positions a fixed preview under the pointer and marks it `data-cover-lens` plus `data-lens-rich`. The lens already follows an element's rectangle. Rich previews raise grain and dispersion.

**Rationale**: A second distortion shader would duplicate `@paper-design/shaders`. The lens already pauses until hover and bails on reduced motion.

**Alternatives considered**: A new follower canvas. More code, same effect.

## Decision: Shared cover name, wipe as the other path

**Decision**: Work-row covers use `transition:name={`work-cover-${slug}`}`, which the case header already uses. Clicks that contain `[data-vt-cover]` set a flag so the chevron wipe stays disarmed and the shared element can be seen. Every other navigation keeps the wipe.

**Rationale**: Astro view transitions morph matching names. The wipe paints on top and would hide the morph.

**Alternatives considered**: Remove the wipe. The brief keeps it as the fallback.

## Decision: Home services keep the four order prices

**Decision**: `BusinessOffers` still renders `serviceOffers(locale)` with `<strong>{priceLabel}</strong>` outside `#faq`. An extra agent row links to ShipCrew and has no price.

**Rationale**: `scripts/order.test.mjs` requires the four order price strings on the home page and forbids them inside the FAQ. Prices in `src/data/order.ts` are not edited.

**Alternatives considered**: Four new services with new prices. That edits the commercial offer and breaks the test.

## Decision: Channel block is conditional

**Decision**: `fetchChannelPosts` already returns `[]` on failure and times out at 8s. The home page renders `ChannelStrip` only when the array is non-empty.

**Rationale**: The build must succeed offline. An empty channel is not an error.

**Alternatives considered**: Drop the channel always. The brief asks to keep it when the build does not need the network.

## Decision: Toy off the main path

**Decision**: `orbit-toy.ts` mounts into a dialog opened from the command palette action `toy` and from a play control on the 404 page. It is not imported by the home page.

**Rationale**: The 404 liquid-metal mark stays. The toy is opt-in and disposed on close.

**Alternatives considered**: An always-on canvas on 404. Heavier, and it runs without a choice.

## Decision: Privacy operator line

**Decision**: Replace the Omsk / self-employed operator line with Sweden, and reword the Telegram sentence so it refers to writing in Telegram.

**Rationale**: Residence is Sweden. The page must not name Omsk. There is no lead form.

**Alternatives considered**: Leave the operator city. That contradicts the residence rule for privacy copy.

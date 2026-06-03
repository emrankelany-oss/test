# V5 Featured Work — Editorial "Feature-led" landing layout (Layout C)

**Date:** 2026-05-16
**Status:** Approved (design) — pending spec review
**Scope:** `/portfolio-v5` featured-work section only

## Goal

Change the final resting layout of the V5 featured-work cards from today's
flat uniform 3×2 grid to an asymmetric, editorial **"feature-led"**
composition (Layout C), reduce the set from 6 cards to 5, and show
**images only** (no text) on the cards for now.

The scroll-driven deck → grid animation must remain **byte-for-byte
identical**. Only the cards' final slot geometry and their content
visibility change.

## Confirmed decisions

- **Scroll animation:** keep exactly as-is. No changes to the GSAP
  timeline, ScrollTrigger pin, scrub, `anticipatePin`, idle float,
  per-card `CHOREO`, or the `compute()` slot-measurement logic.
- **Card count:** 5. Use `featuredWork.slice(0, 5)` — drops #06 Foodics
  Vancouver. Order preserved (01–05).
- **Composition:** Layout C, feature-led. Card 01 is the dominant card.
- **Content:** images only — the entire card text body is hidden for now
  (no client/title/headline/tags/KPI/number). The previously-discussed
  `.compact` modifier is therefore **not needed** and is dropped from the
  design (every slot shows just its image).
- **Mobile (≤720px):** the editorial grid collapses to a single stacked
  column, full-width slots, card order preserved. The existing mobile
  pin distance and reduced-motion paths are unchanged.
- **Approach:** Approach 1 — re-template the slot grid only. The slot
  anchors are measured generically by the existing GSAP code, so
  changing their CSS placement is sufficient; no animation code is
  touched.

## Architecture / why this is low-risk

`V5Stage` renders 6 invisible `.v5-grid-slot` anchors inside
`.v5-grid-inner`; each `.v5-card` is absolutely positioned to fill its
slot. On scroll, GSAP reads each slot's `getBoundingClientRect()` and
drives the card from a "deck" offset to the slot. Because the animation
math is derived from whatever rect each slot has, the landing layout is
fully determined by CSS. Reducing to 5 slots/cards + re-placing them in
CSS changes the destination without altering a single line of animation
logic.

## Exact composition

`.v5-grid-inner`: `grid-template-columns: repeat(12, 1fr)`,
`grid-template-rows: repeat(6, 1fr)`, existing `gap`, full width/height.

Per slot, keyed by `data-slot-index` (0-based; slot N → card 0N+1):

| Slot | Card | Role | grid-column | grid-row |
|------|------|------|-------------|----------|
| 0 | 01 Foodics Boundless | dominant feature | `1 / 7` | `1 / 5` |
| 1 | 02 Zid Ripple | wide banner | `7 / 13` | `1 / 3` |
| 2 | 03 Foodics Brand System | portrait accent | `7 / 10` | `3 / 7` |
| 3 | 04 Zid Launchpad | small accent | `10 / 13` | `3 / 6` |
| 4 | 05 InvoiceQ | wide strip | `1 / 7` | `5 / 7` |

This yields the approved asymmetry: a large landscape feature upper-left,
a wide banner top-right, a portrait accent and a small accent on the
right, and a wide strip running beneath the feature, with editorial
whitespace (e.g. col 10–13 / row 6 intentionally empty).

## Changes (2 files)

### `tma-web/components/portfolio-v5/V5Stage.jsx`
- `const CARDS = featuredWork.slice(0, 6);` → `slice(0, 5)`.
- Trim the `CHOREO` array from 6 entries to 5 (remove the last entry).
  Entries are deck-state offsets relative to each card's own slot, so the
  remaining 5 keep their existing feel. No other edits.

### `tma-web/app/globals.css`
- Replace the `.v5-grid-inner` template (currently
  `repeat(3,1fr) / repeat(2,1fr)`) with the 12×6 template above.
- Add 5 rules placing `.v5-grid-slot[data-slot-index="0..4"]`.
- Hide the card text body for now: `.v5-page .v5-card-body { display: none; }`
  (scoped to v5 so other pages are unaffected). Image, frame, rim, gloss,
  shadow remain — it stays a cinematic image card, just no text.
- Add `@media (max-width: 720px)`: `.v5-grid-inner` becomes a single
  column — `display:flex; flex-direction:column; gap:clamp(16px,4vw,24px)`;
  each `.v5-grid-slot` is `width:100%`, `aspect-ratio:16/10`, and its
  explicit `grid-column/grid-row` is reset to `auto` so order = source
  order (01→05).

Nothing else in `globals.css` (the `.v5-card`, image, hover, gloss rules
stay as-is).

## Out of scope

- The preloader (already complete and reverted to instant-swap).
- Card text styling/return — text is only hidden, not removed; can be
  restored later by dropping the one `display:none` rule.
- Any change to the hero, deck choreography feel, or scroll length.
- Re-ordering or re-selecting which 5 cases (locked: 01–05).

## Verification

On the running dev server (`/portfolio-v5`):
1. Exactly 5 cards present; #06 Vancouver absent.
2. Cards render **image only**, no text anywhere on them.
3. Final resting positions match the Layout-C table (feature upper-left,
   banner top-right, portrait + small accents right, strip under feature).
4. Scroll deck → grid animation, pin, scrub and idle float are visually
   identical to the pre-change behaviour.
5. ≤720px: cards stack in a single full-width column, order 01→05.
6. No console errors/warnings; reduced-motion path still snaps cleanly.

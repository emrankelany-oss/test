# Portfolio V6 (Origin Film) + V7 (Field Notebook) — Design Spec

Date: 2026-05-14
Author: Brainstorm session between Emran (UI/UX lead) and Claude.
Status: Approved for build.

Two new portfolio variants live alongside V2/V3/V5. Both are storytelling
experiences — same content, two different genres. V6 plays like a
documentary film; V7 reads like a hand-drawn designer's journal.

## Why two variants in parallel

The team is exploring how to retell the same Foodics / Zid case content
without falling back on the standard scroll-grid pattern that V2/V3/V5
already cover. V6 and V7 sit at opposite ends of the spectrum
(cinematic-formal vs. handmade-intimate), so picking one over the other
is a brand-tone decision, not a feature decision. Both ship at the same
time, both reuse the same source data, and we A/B-feel them internally
before the team votes a winner.

## Source data (no copy is invented)

All narrative copy traces back to `tma_portfolio_deck.md` in the user's
auto-memory and to the existing `data/portfolio.js`. The two case
studies with deep deck-narrative depth are Foodics (Boundless 22 / 23,
slides 12–16) and Zid (Ripple 2024, slides 17–21). Every other featured
item from `data/portfolio.js` (`foodics-vancouver`, `invoiceq-brand`,
etc.) is a deliverable showcase rather than a transformation story — so
V6 gives only Foodics and Zid the full three-act treatment.

## V6 — Origin Film (documentary scroll)

Route: `/portfolio-v6`. Page class: `pf-page v6-page`.

### Narrative structure

The page is a single film, played by scrolling top-to-bottom. It runs
~17–18 viewports total — long enough to feel cinematic, short enough to
finish in one sitting at relaxed scroll pace.

1. **Cold Open** (~1.5 viewports) — full-bleed black. One opening line
   types out word-by-word: *"Eight thousand restaurants. One vision."*
   A single counter ticks `8,000 → 32,000+`. Subtle film-grain overlay.
   No chrome (nav fades in only after the cold open clears).
2. **Title Card** (~1 viewport) — *"CASES WORTH TELLING — A FILM IN
   FOUR PARTS."* Episode markers slide in like credits: `EP. 01
   FOODICS`, `EP. 02 ZID`, `SHORT VANCOUVER`, `SHORT INVOICEQ`.
3. **Episode 01 — Foodics / Boundless** (~5 viewports, 3 acts pinned in
   sequence):
   - *Act I: The Problem* — muted greyscale plate from
     `case-foodics-boundless.png`. Pull-quote *"Perceived as just a POS
     system."* Subtitle ticker bottom-left lists the four problem
     bullets from the deck.
   - *Act II: The Idea* — color floods back. Boundless event imagery
     (3D POS render from slide-50, event keyframes) parallaxes.
     Pull-quote *"Build the stage that re-defines the category."*
   - *Act III: The Result* — three giant stat reveals, scrubbed by
     scroll: `$15.4M → $20.8M`, `8,000 → 32,000+`, `35% KSA market
     share`. Closing line *"From POS provider to $1B unicorn."*
4. **Interlude** (~0.5 viewport) — black slate, single line *"Same
   playbook. Different industry."*
5. **Episode 02 — Zid / Ripple 2024** (~5 viewports, same 3-act shape)
   — problem (fragmented commerce, perception gap), idea (Total
   Commerce launch in Diriyah, AI-powered marketing), result (200%
   growth, 12K merchants, 50% basket lift, 25% YoY GMV).
6. **Short Film — Foodics Vancouver TVC** (~2 viewports, 1-act trailer
   shape). Hero shot + Arabic tagline *"فودكس .. أساس مطعمك السيستم"*
   + OOH montage thumbnails sliding past + one closing line.
7. **Short Film — InvoiceQ Brand v1.0** (~2 viewports, same shape).
   Brand palette swatch reveal + logo + app mockup.
8. **B-Roll Reel** (~2 viewports) — title card *"AND 39 OTHERS FROM
   THE STUDIO FLOOR."* Below, a horizontal filmstrip uses all 39
   `galleryItems`. The strip translates leftward as the user scrolls
   down (parallax film-reel effect). Each frame is clickable — opens
   the case route if available, else a lightbox overlay.
9. **End Credits** (~1 viewport) — sticky strip that scrolls the
   client logo wall horizontally with role tags (`STRATEGY — TMA`,
   `BRAND DESIGN — TMA`, etc.). Ends in the shared `BigCTA`.

### Motion mechanics

- One GSAP `ScrollTrigger` timeline per pinned section (each episode
  + each short film + the b-roll). Lenis drives scroll, ScrollTrigger
  scrubs.
- Stat counters use `gsap.to({ val: from }, { val: to, snap: 1 })`,
  written back into `textContent` via the `onUpdate` callback.
- Greyscale-to-color transitions use animated `filter: saturate()` and
  `filter: grayscale()`, not opacity. This preserves the cinematic
  feel — the image is *bleeding back into color* rather than fading
  on top of a desaturated copy.
- All pin sections call `invalidateOnRefresh: true` so resize doesn't
  break the timeline.
- `prefers-reduced-motion: reduce` short-circuits every pin: content
  is shown stacked, stats display final values immediately, no
  filters animate.

### Component breakdown (under `components/portfolio-v6/`)

- `V6ColdOpen.jsx` — black cold-open with type-on opening line and
  the 8K→32K counter.
- `V6TitleCard.jsx` — episode-marker title sequence.
- `V6Episode.jsx` — accepts an episode object and renders three
  `V6Act` children in a pinned timeline. Same component drives both
  Foodics and Zid.
- `V6Act.jsx` — Problem | Idea | Result variant via prop. Problem
  uses greyscale plate + ticker, Idea uses parallax imagery, Result
  uses stat-counter triple.
- `V6Interlude.jsx` — slim black slate with single line, used between
  episodes and between short films.
- `V6ShortFilm.jsx` — one-act trailer treatment, accepts a short-film
  object (Vancouver + InvoiceQ).
- `V6BRoll.jsx` — horizontal-translating filmstrip of `galleryItems`,
  scrubbed by vertical scroll. Click → case route or lightbox.
- `V6EndCredits.jsx` — film-credits-style logo wall + role tags.

### New data file (`data/portfolio-film.js`)

Exports `filmEpisodes` (Foodics + Zid full-narrative objects) and
`filmShorts` (Vancouver + InvoiceQ). Each episode contains its acts as
plain objects — `{ problem: {...}, idea: {...}, result: {...} }` —
where every quote / bullet / stat traces back to the deck source.

## V7 — Field Notebook (hand-drawn case journal)

Route: `/portfolio-v7`. Page class: `pf-page v7-page`.

### Narrative structure

The page is presented as a designer's open notebook. Cream paper
background, subtle grain + ruled lines. Every section is a spread.
Page-flip transitions sweep between spreads on long scrolls.

1. **Cover page** — paper-textured hero. Hand-scribbled wordmark
   *"FIELD NOTES — VOL. 01"*. Date stamp *"AMMAN · RIYADH · 2019–
   2025"*. Paperclip SVG holding a polaroid of the team (placeholder
   asset — use `case-foodics-boundless.png` until the team supplies a
   real team shot). Scroll-hint *"turn the page →"*.
2. **Spread A — Foodics** — left page is the brief (torn-paper
   "BRIEF" headline, four problem bullets as sticky notes pinned with
   tape SVG, a marker scribble arrow pointing across the gutter).
   Right page is artefacts (Foodics POS polaroid rotated ~3°, OOH
   thumbnail taped at corner, hand-circled stat `$1B unicorn`, brand
   palette swatch strip `#330072 / #4E008E / #74D1EA`).
3. **Spread B — Zid Ripple 2024** — same template, Zid artefacts:
   Ripple stage photo (placeholder = case-zid-ripple.png), a "Total
   Commerce" napkin sketch that masks-reveals into the final logo,
   push-notification mockups taped at the corner, hand-drawn arrow
   from *"fragmented systems"* → *"one dashboard"*.
4. **Spread C — The Roster** — flat-lay journal page with logo
   stickers (the full logo grid from `/public/assets/logos/`). Each
   sticker slightly rotated; hover lifts it on Z with a soft shadow.
5. **Closing page** — *"WHAT'S NEXT?"* handwritten on a ruled blank
   page with a literal blank line inviting *"write us in"*. Clicking
   the blank line drops the cursor into the shared contact CTA
   (reuse `BigCTA`, styled to fit the paper aesthetic).

### Visual treatment

- Background: cream-paper color `#F4EFE6` + an SVG paper-grain
  pattern as a low-opacity overlay + a faint horizontal ruled-line
  pattern.
- Typography: pair the existing `Inter Tight` with `Caveat`
  (handwriting). Caveat is loaded via `next/font/google` in
  `app/layout.jsx` as a CSS variable (`--font-caveat`). Used only
  scoped under `.v7-page` so it doesn't leak into other variants.
- Decorative SVG atoms: paperclip, tape strip, push-pin, marker
  underline, hand-drawn arrow. Inline SVG in
  `components/portfolio-v7/atoms/`.
- Every artefact is wrapped in `.v7-tape` or `.v7-pin` for the
  rotated, pinned-down look. Hover: lifts on Z, soft shadow.

### Motion mechanics

- GSAP for page-flip transitions between spreads (3D `rotateY` on the
  spread wrapper, with the back-face hidden).
- Framer Motion for individual artefact "drop-in" reveals as a spread
  enters viewport — quick fade + small settle-rotation
  (`rotate: -8 → -3deg` with overshoot), like an artefact being
  placed onto the page.
- Reduced-motion: artefacts fade in without rotation/overshoot. Page
  flips become hard cuts.

### Component breakdown (under `components/portfolio-v7/`)

- `atoms/Tape.jsx` — strip of masking tape, accepts rotation prop.
- `atoms/Paperclip.jsx` — silver paperclip SVG.
- `atoms/Pin.jsx` — push-pin SVG.
- `atoms/MarkerArrow.jsx` — hand-drawn arrow SVG.
- `V7Paper.jsx` — paper-texture background layer.
- `V7Cover.jsx` — opening cover spread.
- `V7Spread.jsx` — generic 2-page spread, driven by a case prop.
  Renders left brief + right artefacts.
- `V7Artefact.jsx` — taped/pinned wrapper for any artefact, accepts
  rotation and pin-style props.
- `V7Roster.jsx` — flat-lay logo stickers.
- `V7Closing.jsx` — closing "what's next?" page that wraps `BigCTA`.

## Shared conventions (apply to both variants)

- Both pages reuse `ClientShell`, `SmoothScroll`, `PortfolioMotion`,
  `Nav`, `Footer`, `BigCTA` — same wrapper layout as
  `app/portfolio-v5/page.jsx`.
- No nav link added. V3/V5 don't have one either; these are internal
  lab variants accessible by URL.
- Page metadata follows the V3/V5 shape (`title`, `description`,
  `openGraph.images`).
- All variant CSS appended at the bottom of `app/globals.css`,
  scoped under `.v6-page` / `.v7-page`. No global selectors.
- Next.js 16. Per `tma-web/AGENTS.md`, this is *not* the Next.js the
  agent's training data assumes — verify `next/font/google` and
  `metadata` shape against `node_modules/next/dist/docs/` before
  committing any code that touches them.

## Testing

Manual smoke test on `localhost:3000/portfolio-v6` and
`localhost:3000/portfolio-v7`:

- Both pages render without console errors.
- Scroll completes top-to-bottom without pin-jank on resize.
- Reduced-motion preference snaps content to final states with no
  scroll-driven transforms running.
- Mobile (≤720px): V6 collapses each act to a stacked layout, V7
  shows one notebook page per viewport instead of two-up spreads.

## Out of scope

- No new copy is written. If the deck has gaps (e.g. the Social Media
  & Community Building service blurb is duplicated in the source
  deck), V6/V7 simply don't include that piece.
- No new client photography or video is sourced. Existing
  `case-foodics-boundless.png` / `case-zid-ripple.png` / slide-*.jpg
  assets only.
- No nav-link change in `Nav.jsx`. The variants are reachable by
  direct URL.
- No content lightbox component — V6 b-roll lightbox is a stretch,
  fall back to clickable thumbnails that open the case route where
  available and do nothing where not.

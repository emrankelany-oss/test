# V19 Filament Intro — Wordmark Draw → Flight to "Design" → Scroll Handoff

**Date:** 2026-05-22
**Page:** `/portfolio-v19`
**Builds on:** the existing scroll-drawn filament (now spanning the `.v19-worklane`: Featured Work + Our Work) and the existing `V19Preloader` (cinemascope panels + counter + split reveal).

## Overview

Turn the filament into the page's intro. On load, the line *writes* the "The
Motion Agency" wordmark inside the existing cinemascope preloader; the panels
split open; a tip then flies on a smooth curve to the border of the "Design"
word in the hero. The intro plays once. Afterwards, scrolling draws the line
from "Design" down through the hero into the work lane (Featured → Our Work)
exactly as it does today, wiping each word's colour as the tip crosses it —
now including "Design".

## Goals

- One continuous-reading line across three phases: preloader → hero → work lane.
- Wordmark drawn as crisp, realistic typeset letterforms (site display font).
- Smooth, jump-free flight and handoff (shared measured coordinates).
- Intro is one-time per page load; thereafter pure scroll, reversible.
- Honors `prefers-reduced-motion`.

## Non-Goals

- No paid GSAP plugins (native SVG dash + GSAP core/ScrollTrigger only).
- Not changing the work-lane filament's existing routing/wipes (Featured, OUR,
  WORK) beyond what continuity requires.
- No runtime font-parsing dependency (wordmark vector is pre-generated offline).

## Experience — four beats

1. **Draw.** Black screen, cinemascope panels closed (as now). The filament
   stroke-draws the "The Motion Agency" wordmark (glyph outlines, left→right).
   The 00→100 counter and progress hairline run as now.
2. **Reveal.** The two panels split (top ↑ / bottom ↓, `power4.inOut`) onto the
   hero — unchanged from the current preloader.
3. **Flight.** The wordmark fades; a bright tip detaches and travels along a
   smooth cubic curve through the opening to the **border of "Design"**,
   drawing a trail that fades behind it, leaving the tip seated at Design.
4. **Scroll.** Intro complete. From "Design", scroll draws the line down through
   the hero into the work lane; as the tip crosses "Design" it wipes that word's
   colour, then continues to Featured / Our Work as today.

## Architecture — three coordinated SVGs

Both `.v19-hero` and the work-lane have opaque black backgrounds and are separate
stacking contexts, so a single SVG cannot sit *behind the content* of all three
phases. The line is therefore three coordinated segments that share exact
hand-off coordinates and one colour gradient, reading as one line.

### 1. Intro overlay SVG — `V19Preloader` (fixed, viewport coords)

Owns beats 1–3. Time-driven via the existing GSAP timeline.

- **Wordmark group:** the pre-generated glyph-outline `<path>`s (fill none,
  stroke = cool gradient). Drawn with `strokeDashoffset` per glyph, sequenced
  left→right so it reads as writing. Replaces the current single "M" monogram
  path; the wordmark text node (`.v19pl-word`) becomes decorative/removed since
  the line now renders the letters.
- **Flight path:** a single `<path>` from the wordmark's end region to the
  **measured** on-screen border of "Design". The Design coordinate is read at
  runtime (`getBoundingClientRect` of `.v19-line-4`'s inner text span, in
  viewport space, at scroll-top) just before the flight tween, so it lands
  precisely at any viewport size. The tip draws this path (dash), and a short
  trailing fade follows the tip (a second, lagging dash window) so the trail
  dissolves behind it.
- After landing, the overlay root fades (~0.3s) and unmounts via the existing
  `done` state. The split/scroll-release/hero-release logic is unchanged.

### 2. Hero lead SVG — in `.v19-hero` (scroll-driven)

- Path **starts at Design's border** (same measured coordinate the flight used),
  crosses the "Design" word horizontally (new wipe target), and descends to the
  hero's bottom-left corner `(0, heroH)` — the seam with the work lane.
- Hidden during the intro (`strokeDashoffset = length`). **Ignited** at
  flight-end: a tiny initial segment at Design is shown so the overlay can
  cross-dissolve into it with no pop. Then a `ScrollTrigger` (scrub) drives the
  draw as the user scrolls the hero.
- Implemented by extending `V19Filament` with a `variant="lead"` (path builder,
  hero trigger, single Design wipe target), OR a small dedicated component —
  decided in the plan; both keep one clear responsibility.

### 3. Work-lane SVG — existing `V19Filament` (unchanged behaviour)

- Starts at the lane top-left (`M 0 0`) = the hero seam, threads Featured → Our
  Work with the existing wipes. No behavioural change; only verified to still
  align at the seam.

## Continuity & handoff mechanics

- **Shared coordinates:** flight-end ≡ hero-lead start (Design border, measured
  in viewport space); hero-lead end `(0, heroH)` ≡ lane start `(0, 0)`. No jumps.
- **Cross-dissolve at Design:** intro overlay fades while the hero-lead shows its
  first pixels — not a hard cut.
- **Colour match:** all three use the same cool gradient, so seams are invisible.
- **Once per load:** reuse `V19Preloader`'s `hasPlayedThisLoad` module flag. On
  client-side route returns the intro is skipped and the line simply rests at
  Design (scroll-ready). A hard refresh replays.
- **Resize:** Design's coordinate and all paths are re-measured; `ScrollTrigger.refresh()`.

## Wordmark vector generation (offline, embedded)

- A one-off Node script (`opentype.js`) loads the site display font TTF
  (Inter Tight, resolved from `node_modules`/`public`), lays out "The Motion
  Agency", and emits glyph-outline path data + the group's intrinsic width/height.
- Output is written to a committed module
  (`tma-web/components/portfolio-v19/wordmarkPath.js`) exporting the path
  string(s) and viewBox — **no runtime dependency**.
- If the exact TTF can't be resolved, fall back to the nearest bundled display
  weight and note it in the module header. The script itself is committed under
  `tma-web/scripts/` for reproducibility but not run at build time.

## Reduced motion

- Wordmark rendered already-drawn (no per-glyph dash animation); no flight.
- The line rests at Design; hero-lead and lane render statically (full path),
  all wipe targets lit — matching the current reduced-motion behaviour.

## Components & files

- **Modify** `tma-web/components/portfolio-v19/V19Preloader.jsx` — wordmark
  stroke-draw replaces the "M" monogram; add the flight path + Design-handoff;
  keep panels, counter, seam, split, release logic.
- **New** `tma-web/components/portfolio-v19/wordmarkPath.js` — generated glyph
  path data + viewBox.
- **New** `tma-web/scripts/gen-wordmark.mjs` — offline generator (committed, not
  in the build).
- **Modify** `V19Filament.jsx` — add `variant="lead"` (hero segment + Design
  wipe) OR add a focused hero-lead component; mount it in the hero.
- **Modify** `V19Hero.jsx` — wrap "Design" in `.v19-line-word` (wipe target);
  mount the hero-lead segment.
- **Modify** `v19.css` — wordmark/flight styles, hero-lead positioning,
  `--v19-wipe` gradient on the Design word.
- **Modify** `playwright/tests/v19-filament.spec.js` (+ preloader spec) — see
  Testing.

## Testing (Playwright, local dev server)

1. **Wordmark draws:** during the intro the preloader contains stroke-drawable
   wordmark paths; after the draw beat they are fully drawn (dashoffset ≈ 0).
2. **Flight lands at Design:** after the intro, the flight path's end point
   equals the measured "Design" border (within tolerance).
3. **Handoff ignites the lead:** once the intro finishes, the hero-lead path
   exists and starts at Design's border.
4. **Design wipes on scroll:** scrolling past Design drives its `--v19-wipe`
   0→100 and reverts on scroll-back.
5. **Lane unchanged:** existing Featured/OUR/WORK wipe + draw tests still pass.
6. **Reduced motion:** wordmark static, no flight, segments full, words lit.
7. **Once per load / teardown:** intro guarded by `hasPlayedThisLoad`; no console
   errors; navigation away removes all filament SVGs.

## Risks & mitigations

- **Wordmark as many drawn outlines flickering** → sequence per-glyph dash with
  slight overlap so it reads as continuous writing; cap total draw to the
  counter beat.
- **Flight/handoff jump across contexts** → single measured Design coordinate
  shared by flight-end and hero-lead start; re-measured on resize; cross-dissolve.
- **Font TTF not resolvable for generation** → documented fallback weight; the
  generated module is committed so the build never depends on the script.
- **Intro replay edge cases (SPA return, refresh)** → reuse the proven
  `hasPlayedThisLoad` flag and release/fallback timers already in `V19Preloader`.

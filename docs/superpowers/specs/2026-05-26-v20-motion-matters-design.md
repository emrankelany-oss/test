# V20 — "MOTION MATTERS" filament reveal (between Featured Work and Our Work)

**Status:** approved (brainstorming → writing-plans)
**Date:** 2026-05-26
**Branch:** feat/obsidian-hero (the V20 active branch — see `[[v20-active-version]]`)
**Related:** `[[v19-filament-status]]`, `docs/superpowers/specs/2026-05-21-v19-scroll-filament-design.md`

## Problem

The V20 portfolio page has a scroll-drawn cool-tinted filament (`V20Filament`) that travels through both the Featured Work and Our Work sections, wipe-filling the section titles as the line crosses them. The line currently terminates at the bottom of the Our Work block.

We want the line to do one more "moment" of value: between Featured Work and Our Work, the line should **draw the words "MOTION MATTERS" as a single continuous stroke**, then continue down through Our Work exactly as today. The new beat should feel premium and intentional — not a separate animated text widget bolted on, but the same filament *being* the type for one section.

## Goals

- Insert a new section `V20MotionMatters` between `V20FeaturedWork` and `V20OurWork`, occupying one viewport.
- Section pins for one viewport of scroll distance. While pinned, the filament draws "MOTION MATTERS" at a deliberate cinematic pace.
- The drawn type matches the visual character of Space Grotesk (the V20 display font) — geometric, bold, single-line layout, centered.
- The filament is **the** type — not a separate writing animation; the line that crossed FEATURED and is heading toward OUR WORK is the same physical stroke that traces every letter.
- The line stays visually continuous (no apparent pen-lifts). Between letters it travels along a subtle baseline guide.
- After MATTERS is drawn, the line continues to Our Work and behaves exactly as today.
- Honour reduced-motion: static type, no pin, no scrub.

## Non-goals

- Not loading Space Grotesk webfont *as* the drawn type. The drawn letters are our own stroke approximations (see "Letter geometry" below). The webfont remains the visible type elsewhere on the page.
- No wipe-fill on MOTION MATTERS (the line *is* the letters, there is nothing to wipe).
- No interactivity (hover, click, parallax) on the MOTION MATTERS panel.
- No change to the existing FEATURED / OUR WORK wipe behaviour.

## Architecture

### Placement

`V20MotionMatters` is rendered inside the existing `.v20-worklane` wrapper, between `V20FeaturedWork` and `V20OurWork`:

```
<div className="v20-worklane">
  <V20Filament />            {/* unchanged location, now spans 3 children's height */}
  <V20FeaturedWork />
  <V20MotionMatters />       {/* NEW */}
  <V20OurWork />
</div>
```

Because `V20Filament` already mounts a single absolutely-positioned `<svg>` whose viewBox is computed from `lane.scrollHeight`, the SVG automatically grows to cover the new section. **One SVG continues to span all three sections; the path inside it is one continuous `d` attribute.**

### How the path is extended

`buildLanePath(w, h, fw, ourW, workE, fNarr, mm)` is extended to accept a `mm` bbox argument (the MOTION MATTERS panel's position in lane space). The path threads:

1. Sweep into FEATURED and cross it (unchanged).
2. Weave down through the featured cards (unchanged).
3. Arrive at the top-center of the MOTION MATTERS panel (new).
4. Drop to the MOTION MATTERS baseline; trace each letter stroke in order with subtle baseline travel between letters (new — see "Letter geometry").
5. Lift off the baseline at the trailing edge of S, sweep down toward Our Work (new).
6. Sweep into OUR and cross both OUR and WORK (unchanged).
7. Exit right and weave to the bottom of Our Work (unchanged).

The existing scrub ScrollTrigger on the lane (`start: "top 130%"`, `end: "bottom bottom"`, `scrub: true`) is unchanged. `progress 0→1` maps to `strokeDashoffset = len * (1 - p)` against the new, longer `getTotalLength()`. The lane's scroll distance grows by ~1 viewport (because the panel adds height), so the line naturally consumes that extra distance to draw the letters.

### Letter geometry

A new module `tma-web/components/portfolio-v20/mmGlyphs.js` exports baked, hand-tuned **single-stroke approximations of Space Grotesk Bold's proportions** (cap height, stroke weight, geometric character). Each glyph is a list of relative SVG path commands traced in pen-down order; Space Grotesk's geometric construction decomposes naturally into single strokes:

- **M** → up left stem, down-right diag, up-right diag, down right stem
- **O** → counter-clockwise oval (closed loop, returns to start)
- **T** → up center stem, then traverse the top bar (left-to-right starting from stem peak)
- **I** → straight up
- **N** → up left stem, down-right diag, up right stem
- **A** → up-right diag, down-right diag, then crossbar
- **E** → up left stem, then top bar right; back-trace to mid, mid bar right; back-trace to bottom, bottom bar right
- **R** → up left stem, bowl right then back to stem-mid, leg down-right
- **S** → top curve, mid s-curve, bottom curve

Between letters, the path stays at a constant baseline `y` (1–2px below the letters' baseline) and travels horizontally to the next letter's start point. This baseline travel is part of the same continuous stroke — there are no `M` commands inside the glyph section after the entry point. The result reads as "the line is writing", never "the line lifted and restarted".

Glyphs are emitted at unit-cap-height with relative coords. At measure time, the path generator:

1. Reads the panel bbox from `mm`.
2. Picks `capHeight = clamp(mm.h * 0.18, 80, 220)` and `targetWidth = mm.w * 0.7`.
3. Computes per-glyph horizontal advance, total word width, tracking, and inter-word space.
4. If total width > targetWidth, scales `capHeight` down proportionally.
5. Centers the assembled word horizontally inside `mm`.
6. Emits the assembled glyph block as one continuous chain (no `M` after the entry point).

### Pin mechanics

`V20MotionMatters` mounts its own ScrollTrigger:

```js
ScrollTrigger.create({
  trigger: panelRef.current,
  start: "top top",
  end: "+=100%",   // one viewport of scroll distance
  pin: true,
  pinSpacing: true,
  anticipatePin: 1,
  scrub: true,
});
```

`anticipatePin: 1` is the standard fix for visible jitter when pin engages under Lenis smooth scroll.

The pin is independent of the lane's filament scrub: both ScrollTriggers observe the same scroll position but answer different questions ("is the panel pinned?" vs. "what fraction of the lane path should be drawn?"). The lane progresses linearly while the panel is pinned, which is exactly what we want — the line draws letters during the pin window.

### Reduced motion

`usePrefersReducedMotion()` already gates the lane scrub; we mirror that for the panel:

- No pin (`ScrollTrigger.create({ ..., pin: false })` is just not registered).
- The lane path is set fully drawn (`strokeDashoffset: 0`) on mount, including letter strokes.
- The panel still occupies one viewport of static height (`min-height: 100vh`) so the layout is consistent; the letters appear pre-drawn.

### Pin vs lane scrub — the visible behaviour

These two ScrollTriggers coexist; understanding their interaction is load-bearing:

- The **panel pin** freezes the panel's pixels at viewport top for the pin duration.
- The **lane scrub** advances `strokeDashoffset` from `len*1 → len*0` against the lane's full scroll range.

While the panel is pinned, the user keeps scrolling — the scroll position advances even though the panel's pixels don't move. The lane scrub reads scroll position, so it keeps advancing. Visually the user sees: the panel sits still, and inside it the line draws letter after letter as they scroll. When the pin window ends, the panel unpins and the line is already at the trailing edge of S, the page resumes scrolling normally, and the line continues into OUR WORK.

### File map

| File | Change |
| --- | --- |
| `tma-web/components/portfolio-v20/V20MotionMatters.jsx` | NEW. Pinned section: dark background, viewport-tall, hosts a measurable anchor element `.v20-mm-text-box` that the filament uses to position the letters. |
| `tma-web/components/portfolio-v20/mmGlyphs.js` | NEW. Baked letter geometry + `buildMotionMattersPath(bbox)` helper. |
| `tma-web/components/portfolio-v20/V20Filament.jsx` | MODIFIED. `buildLanePath` accepts `mm` bbox + calls `buildMotionMattersPath`; `measure()` queries `.v20-mm-text-box`; component accepts new `mmSel` prop with sensible default. |
| `tma-web/components/portfolio-v20/v20.css` | NEW rules for `.v20-mm` (centered, min-height: 100vh, dark) and `.v20-mm-text-box` (visually invisible but layout-bearing — defines the centered width slot). |
| `tma-web/app/portfolio-v20/page.jsx` | Insert `<V20MotionMatters />` between FeaturedWork and OurWork inside `.v20-worklane`. |

## Edge cases & behaviour matrix

| Case | Behaviour |
| --- | --- |
| Reduced motion | No pin, letters pre-drawn, panel still occupies 1vh of static height. |
| Mobile (≤820px) | Same single-line layout; capHeight clamps lower; tracking tightens. If the word would overflow even at min size, it wraps onto two lines (`MOTION` / `MATTERS`) and the path generator emits two stacked rows joined by a vertical baseline-travel. |
| Resize | Existing ResizeObserver re-runs `measure()` and `ScrollTrigger.refresh()`. The pin ScrollTrigger also refreshes; `pinSpacing` is recomputed. |
| Very fast scroll (Lenis flick) | `scrub: true` keeps the tip exactly at the scroll position; letters may render with the tip already past the end — that's fine, the dashoffset just races to follow. |
| Very slow scroll | The line gently progresses through each letter; this is the intended cinematic feel. |
| Page enters mid-section (anchor link, refresh) | Lane filament's `start: "top 130%"` head-starts the draw; the pin ScrollTrigger initialises correctly because GSAP recalculates pin state on mount. |
| `getTotalLength()` cost after adding ~13 letter strokes | Negligible — called once per resize. The `N=520` sample count for arc-length windows remains; we only need accurate windows for FEATURED / OUR WORK, not for the letters (no wipes there). |

## Risks

- **Glyph authoring quality** — hand-tuned stroke approximations are subjective. We will iterate visually after a first working pass. If the result reads as too "stencil" and the user prefers Space Grotesk webfont rendered as solid type with the line wipe-filling it, we have a clear fallback (the same pattern used for FEATURED / OUR WORK today).
- **Pin + Lenis** — `anticipatePin: 1` is the documented fix; if jitter persists we add `ScrollTrigger.refresh(true)` on Lenis `scroll` events with debouncing. Both fixes are well-trodden.
- **Path length growth** — the path's `d` string will roughly double in length once letter geometry is spliced in. SVG path parsing is fast; this is not a real performance concern at our scale.

## Testing & verification

Manual:
- Scroll slowly through the V20 page; verify the line crosses FEATURED, weaves down, enters the MOTION MATTERS panel, draws each letter in order with visible baseline travel between letters, exits, weaves into OUR WORK, and continues to the bottom.
- Scroll fast; verify no broken state at high velocity.
- Resize the viewport in dev tools through three breakpoints (1440, 1024, 768) and confirm the letters re-fit and re-center, the pin still engages, and the existing FEATURED / OUR WORK wipes still align.
- Toggle "Reduce motion" in OS settings; reload; confirm static type, no pin.

Automated:
- Playwright e2e per the existing V19 filament test (`tma-web/tests/v19-filament.spec.ts` style):
  - Open `/portfolio-v20`, wait for hero idle.
  - Scroll to mid-Featured; assert dashoffset has decreased.
  - Scroll to mid-MOTION MATTERS panel; assert dashoffset is between the FEATURED arc-end and the OUR-WORK arc-start (i.e. the line is drawing letters).
  - Scroll past panel; assert OUR-WORK wipe fires at correct progress.
  - Reduced-motion: assert dashoffset = 0 immediately after mount.
- E2E must pass before this work is considered done.

## Open questions

None. Approved by user 2026-05-26.

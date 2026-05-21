# V19 Scroll-Drawn Filament — Design Spec

**Date:** 2026-05-21
**Page:** `/portfolio-v19`
**Style:** Editorial Filament (cool-tinted)

## Overview

A single hairline "thread of light" draws itself across the V19 Featured Work
section as the user scrolls. It begins where the hero ends and Featured Work
starts, weaves down through the gaps between the grid cards, and finishes with a
small terminal taper at the bottom of the section. The effect is quiet and
editorial — a background spine, not a foreground decoration. It must never
overlap a card's hover-video tile so it does not fight the existing interaction.

V19 is a black canvas with white type. The filament is therefore a thread of
light rather than ink, with a **cool tint**: a subtle blue/cyan core fading to
white along the stroke width, echoing the hero's prism color.

## Goals

- Scroll progress through the Featured section drives draw progress ~1:1.
- Reads as a soft 3D tube via a cross-stroke gradient highlight.
- Restrained — does not compete with the hover-video card grid.
- Fully responsive (12-col grid desktop → single-column mobile S-curve).
- Honors `prefers-reduced-motion`.

## Non-Goals

- No traveling "light packet" or pulsing glow (that was Style B, rejected).
- No orthogonal/blueprint routing (Style C, rejected).
- No paid GSAP plugins (DrawSVG). Native SVG dash technique only.
- Does not extend onto the hero or any future sections — scoped to Featured Work.

## Technique

GSAP + `gsap/ScrollTrigger` are already used in the repo (e.g.
`components/portfolio-v17/V17Journey.jsx`). No DrawSVG. The path is drawn with
the native dash technique:

1. One absolutely-positioned `<svg>` covers the full Featured Work section
   (`inset: 0`, `pointer-events: none`), layered **behind** the cards and
   **above** the black background.
2. A single `<path>` carries a `<linearGradient>` stroke for the cool tint and
   the cross-stroke highlight. An optional faint blurred duplicate path provides
   a whisper of glow, kept very subtle.
3. On mount: `const len = path.getTotalLength()`; set
   `strokeDasharray = len`, `strokeDashoffset = len`.
4. A `ScrollTrigger` with `scrub: 0.6` animates `strokeDashoffset` from `len → 0`
   so the draw maps to scroll position with a touch of liquid lag.
5. On resize, recompute `getTotalLength()`, reset dash values, and call
   `ScrollTrigger.refresh()`.

### Scroll range

- `start`: Featured section top hits ~80% of viewport height.
- `end`: Featured section bottom reaches the bottom of the viewport.
- `scrub: 0.6`.

### Routing & responsive

- Desktop: cubic-bézier path routed along the 12-col grid gaps, threading
  between cards, never over a card's media area.
- Mobile (single-column layout): collapses to a gentle central S-curve.
- The path geometry is defined in a normalized `viewBox` so it scales with the
  section; card-avoidance is achieved by anchoring control points to the grid
  gutters rather than pixel coordinates.

### Color (cool tint)

- `linearGradient` stops: blue/cyan core (e.g. `#6fd3ff`-ish) → white →
  translucent white at the outer edge, giving the soft tube highlight.
- Stroke width ~1.5px (scales subtly with viewport).
- Final values to be tuned during implementation against the live page.

## Reduced motion

When `prefers-reduced-motion: reduce`:

- Do not create the ScrollTrigger scrub.
- Render the full path statically at low opacity (`strokeDashoffset = 0`).
- Composition stays intact; nothing animates.

This matches the existing reduced-motion handling in the obsidian-hero and v16
components.

## Components & Files

- **New** `tma-web/components/portfolio-v19/V19Filament.jsx`
  - `"use client"` component. Renders the `<svg>`/`<path>`/`<linearGradient>`
    and owns the GSAP/ScrollTrigger lifecycle (create on mount, kill on unmount).
  - Self-contained: one clear purpose (draw the filament), depends only on
    `gsap`, `gsap/ScrollTrigger`, and the section ref it is mounted within.
- **Edit** `tma-web/components/portfolio-v19/V19FeaturedWork.jsx`
  - Ensure the section root is `position: relative`.
  - Mount `<V19Filament />` as the first child (background layer).
- **Edit** `tma-web/components/portfolio-v19/v19.css`
  - `.v19-filament` positioning, z-index (below `.v19fw-card`, above section bg),
    gradient stop colors, stroke width, reduced-motion rule.
- **New** Playwright e2e test (mirrors `playwright/tests/v16-*.spec.js` pattern).

## Layering (z-index)

```
section bg (#000)        z: base
.v19-filament  <svg>     z: 1   (above bg, below cards)
.v19fw-card    grid      z: 2+
floating hover <video>   z: top (unchanged)
```

## Testing

Playwright e2e (local dev server, relative nav via config baseURL — matching the
obsidian-hero spec convention):

1. **Mount** — `.v19-filament svg path` exists after the page loads.
2. **Draws on scroll** — `strokeDashoffset` decreases as the page is scrolled
   through the Featured section (sample at top vs. mid vs. bottom).
3. **Reduced motion** — with `emulateMedia({ reducedMotion: "reduce" })`, the
   path renders with `strokeDashoffset` ≈ 0 (static, full) and no ScrollTrigger
   is created.
4. **No console errors** during mount/scroll.
5. **Teardown** — navigating away kills the ScrollTrigger (no leaked instances /
   no errors on unmount).

## Risks & Mitigations

- **Path overlapping cards on some breakpoints** → anchor control points to grid
  gutters; verify visually at mobile/tablet/desktop widths.
- **ScrollTrigger length stale after layout shift (fonts, images)** → recompute
  `getTotalLength()` and `ScrollTrigger.refresh()` on resize and after load.
- **Glow making it "loud"** → glow duplicate is optional and low-opacity; cut it
  if it competes with the hover tiles.

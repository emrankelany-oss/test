# V20 "MOTION MATTERS" — Flow-Current Background

**Date:** 2026-05-31
**Branch:** feat/obsidian-hero
**Status:** Design approved, pending spec review

## Goal

Add an animated background **only** to the pinned "MOTION MATTERS" section that sits
between Featured Work and Our Work on `/portfolio-v20`. The background is a whisper-subtle,
scroll-reactive "flow current" (concept C from brainstorming) that suits V20's black-canvas,
cool-blue-filament aesthetic.

**Hard constraint:** The scroll-drawn filament must keep working exactly as it does today.
The background is a fully separate layer. No edits to `V20Filament.jsx`, `mmGlyphs.js`, the
pin logic, or the lane structure beyond mounting one child element.

## Context (current state)

- The filament (`.v20-filament`) is a lane-level layer at `z-index: 0`, absolutely positioned
  over the whole `.v20-worklane`. The work sections (`.v20fw`, `.v20-mm`, `.v20ow`) are
  `z-index: 1` and **transparent**, so the line shows *through* them.
- `.v20-mm` is pinned for `+=200%` via a `ScrollTrigger` in `V20MotionMatters.jsx`.
- Smooth scrolling is provided by Lenis in `components/portfolio/SmoothScroll.jsx`, which
  drives `ScrollTrigger.update()`. The Lenis instance is **not** exposed globally.
- Brand palette for the line: `#6fd3ff → #1f6fc0` (cool blue).
- `usePrefersReducedMotion` hook already exists in `components/portfolio-v20/`.

### Why an in-section transparent canvas with `screen` blend

Because the filament is *behind* the transparent `.v20-mm`, any opaque background dropped into
`.v20-mm` would occlude the line. The demo's flow-field used a dark per-frame trail fill — that
would dim the filament. The fix:

- Canvas clears to **full transparency** each frame (`clearRect`), never a dark fill.
- Canvas uses **`mix-blend-mode: screen`**, which can only *add* light. It is mathematically
  incapable of darkening the filament or the black canvas — the line is guaranteed untouched.
- Faint blue streaklines therefore only ever add a whisper of glow; where they cross the
  filament they add negligible light at whisper opacity.

## Architecture

### New component: `V20FlowField.jsx`

`tma-web/components/portfolio-v20/V20FlowField.jsx`

- Renders a single `<canvas class="v20-mm-flow">`.
- Self-contained: owns its own canvas sizing, rAF loop, and one dedicated `ScrollTrigger`.
- Accepts no props; reads reduced-motion via `usePrefersReducedMotion`.

### Mount point

In `V20MotionMatters.jsx`, add `<V20FlowField />` as the **first child** of the `.v20-mm`
`<section>`, before `.v20-mm-text-box`. Living inside the pinned element means it stays
full-viewport for the entire pin with no coupling to the filament.

### Rendering loop

- DPR capped at 2. `ResizeObserver` on the canvas refits width/height on viewport change.
- ~60 particles seeded at random positions. Each frame:
  1. `clearRect` the full canvas (full transparency — no dark fill).
  2. For each particle, sample a slow flow field
     `angle = sin(y*0.012 + t*kT) * 0.8 + cos(x*0.008 - t*kT2) * 0.5`.
  3. Advance the particle along the angle and draw a short fading streak (per-segment alpha,
     not a persistent overlay). Respawn when off-screen or after a life budget.
- Stroke colour: cool blue (`#5fb9ff` family). Base stroke alpha `0.05–0.10` (whisper).
- `t` advances each frame by a small constant scaled by `flowSpeed` (see below).

### Scroll-reactive intensity (independent trigger)

- A dedicated `ScrollTrigger` on `.v20-mm` with `start: "top bottom"`, `end: "bottom top"`,
  `onUpdate(self)` → store `self.progress` and `Math.abs(self.getVelocity())` into refs.
  No `scrub`; it never animates the filament; it shares no state with `V20Filament`'s trigger.
- The rAF loop computes targets from those refs and **lerps** toward them (no jumps):
  - `flowSpeedTarget = base + velocityFactor * normalizedVelocity` (current drifts faster
    while actively scrolling, calms to ambient when still).
  - `glowTarget = baseGlow + progressFactor * progress` (a touch brighter mid-pin).
- All clamped so the effect stays within "whisper" bounds regardless of scroll speed.

### Lifecycle & safety

- All GSAP work inside `gsap.context(() => {...}, sectionEl)`; reverted on unmount.
- The component creates **only its own** `ScrollTrigger`. It does not call
  `ScrollTrigger.refresh()` (the pin component already does), so pin/filament refresh
  behaviour is unchanged.
- rAF id tracked and cancelled on unmount. `ResizeObserver` disconnected on unmount.

### Reduced motion

- When `usePrefersReducedMotion` is true: skip the canvas/rAF entirely and render a single
  static, barely-there radial blue wash (CSS, very low opacity) — or nothing. No animation,
  consistent with `SmoothScroll` bailing on reduced motion.

### CSS (`v20.css`)

- `.v20-mm-flow { position:absolute; inset:0; width:100%; height:100%; z-index:0;
  pointer-events:none; mix-blend-mode:screen; }`
- Ensure `.v20-mm-text-box` remains above (`z-index:1` or DOM order after the canvas).

## Data flow

```
Lenis scroll → ScrollTrigger.update() (already running)
                       │
                       ▼
   V20FlowField's own ScrollTrigger.onUpdate
        → progressRef, velocityRef (refs only)
                       │
                       ▼
        rAF loop lerps flowSpeed / glow toward targets
                       │
                       ▼
        canvas draws faint blue streaklines (screen blend)
```

No arrow ever points at the filament. The filament keeps its own independent
`ScrollTrigger.onUpdate → draw()` path.

## Testing

Extend `tma-web/playwright/tests/v20-motion-matters.spec.js`:

- Assert a `canvas.v20-mm-flow` exists inside `.v20-mm` after the section scrolls into view.
- Re-run existing filament/letter assertions to confirm they still pass at the current
  viewports (the background must not regress any of them).
- Confirm no new console errors.
- Reduced-motion path: with `prefers-reduced-motion: reduce`, the rAF canvas loop does not run
  (static layer or none), and existing assertions still hold.

## Out of scope / explicitly NOT touched

- `V20Filament.jsx`, `mmGlyphs.js` — not opened.
- The pin `ScrollTrigger` in `V20MotionMatters.jsx` — unchanged except adding one child import.
- Lane structure, Featured Work, Our Work, Hero, Preloader.
- The other three brainstormed concepts (Aurora, Constellation, Spotlight) — not built.

# V21 — Continuous Atmosphere + Comet Head (Cohesion Pass 1)

**Date:** 2026-06-01
**Target:** `/portfolio-v21` only (V20 stays untouched as the stable fallback)
**Status:** Design approved; implementation plan pending

---

## Problem

V20/V21's sections are individually polished but feel like discrete *exhibits*, not chapters of one film. The diagnosis (from a full read of the docs + the V20 code):

- The portfolio already has the strongest possible unifying device — the **filament** ("one line of light"). The problem is that everything *around* it resets at every section boundary.
- The **prism glow is born in the preloader and dies at the bottom of the hero**; everything after is flat black. That death is the single biggest "soul break."
- Color **jumps** (warm prism → cyan → darker blue) with no blend; the filament's color shift is a CSS class swap (`.v20-filament.-ow`), not a continuous transition.
- The filament silently switches from **scroll-time to pin-time** mid-draw (head/tail are scroll-driven; the Motion Matters letters are pin-driven), creating a temporal discontinuity.
- The flow-field's visibility uses a naive rect-overlap check that can **desync from the pin** and flicker.

## Goal of this pass (scope)

This is **Cohesion Pass 1** — deliberately focused and low-risk. It delivers two of the four cohesion systems from the larger vision:

1. **System 1 — One continuous atmosphere.** A single, persistent, scroll-reactive cyan bloom behind the whole work-lane that the filament lives inside, so the page shares one breath instead of resetting per section.
2. **The comet head.** A glowing spark that rides the filament's draw tip from start to finish, giving the eye one unbroken focal point across every section.

**Explicitly out of scope** (future passes): unifying the scroll physics across all sections (System 2), unifying the reveal grammar (System 3), and the bridge-beat manifesto scenes (System 4).

## Approved creative decisions

| Decision | Choice |
|---|---|
| Target version | **V21** (divergence copy; V20 untouched) |
| Palette | **C — near-black + single cyan bloom** that swells to its brightest at Motion Matters, then recedes. Matte black elsewhere so project imagery dominates. |
| Comet head | **C — spark / lens-flare**: crisp white core + thin cross-flare + cyan glow. Velocity-reactive. |
| Render approach | **CSS bloom + reuse the existing flow-field.** No canvas rewrite, no WebGL. |

---

## Architecture — one writer, many readers

A narrow application of the lenis.dev "CSS-variable scroll driver" pattern.

**The writer:** a new `V21Atmosphere` component owns a single `requestAnimationFrame` loop. Each frame it computes two scalars from scroll and writes them as CSS custom properties on the document root (`document.documentElement`):

- **`--atmo-bloom`** (0→1) — proximity of the Motion Matters section to viewport center.
- **`--atmo-vel`** (0→1) — smoothed (lerped) scroll velocity.

Nothing else computes scroll independently for this feature.

**The readers:**

1. **Bloom layer** — a fixed fullscreen `div.v21-atmosphere`; reads both vars via `var()` (pure CSS, zero React re-renders).
2. **Flow-field** (`V21FlowField`, reused) — its intensity and fade now follow the shared signal instead of its own rect-check.
3. **Comet head** (inside `V21Filament`) — positions a spark at the line's current draw tip each frame; glow scaled by `--atmo-vel`.

### Data flow

```
scroll → V21Atmosphere RAF
            ├── compute --atmo-bloom (MM center vs viewport center)
            ├── compute --atmo-vel   (smoothed |Δscroll|)
            └── write both to document.documentElement.style
                     │
      ┌──────────────┼───────────────────────────┐
      ▼              ▼                             ▼
 .v21-atmosphere   V21FlowField              V21Filament comet
 (CSS var() reads)  (JS reads vars)          (JS reads --atmo-vel,
                                              positions spark at tip)
```

---

## Component behaviors & values

### Bloom layer — `.v21-atmosphere`
- Fixed, `inset: 0`, `pointer-events: none`, `mix-blend-mode: screen`. Mounted **first** inside `.v21-worklane` so the stacking order is: bloom (bottom) → flow-field current → filament + comet (top) → section content. It paints behind everything as the base atmosphere.
- Gradient: `radial-gradient(60% 50% at 50% 50%, #6fd3ff, transparent 70%)`.
- Opacity = `0.04` (floor — a whisper everywhere, never dead-black) `+ var(--atmo-bloom) × 0.14` (peak ≈ 0.18 at Motion Matters) `+ var(--atmo-vel) × 0.05` (velocity sparkle). Clamped to a sane max (≈ 0.22).
- Scale: `1.0 → 1.08` interpolated by `--atmo-bloom` — a slow "breathing" swell approaching Motion Matters.

### Bloom curve — `--atmo-bloom`
From the Motion Matters section's center relative to the viewport center:

```
bloom = clamp(1 − |mmCenter − viewportCenter| / (1.2 × vh), 0, 1)
```

Ramps up as MM approaches, holds at peak through the pin, falls off after. No hard edges. If the MM section element is absent (resize/SSR race), `bloom = 0`.

### Velocity — `--atmo-vel`
- **Attack** on `scroll` events: each event eases the value a fraction toward 1 (`vel += (1 − vel) × 0.4`). Lenis fires many scroll events per frame while moving, so it builds to ~1 quickly during active scrolling — a more reliable "user is scrolling" signal than per-frame `scrollY` deltas (which Lenis smooths away).
- **Decay** in the rAF loop: a smooth per-frame lerp toward 0 (`vel += (0 − vel) × 0.08`), floored to 0 below 0.001. This keeps the tail 60fps-smooth (important — the comet glow reads this), and `--atmo-vel` is written every frame so the decay is reflected continuously.

> Mechanism note: an earlier draft computed velocity purely from per-rAF `|Δscroll|`. That proved unreliable under Lenis smooth-scroll (deltas too small/variable), so the design uses scroll-event attack + rAF decay, which achieves the same intent — a smoothed, weighted velocity that rises with scrolling and eases back to rest.

### Flow-field — `V21FlowField` (reused)
- Particle glow target adds `--atmo-vel` (consistent with the comet).
- Visibility/fade now follows `--atmo-bloom` instead of the old `getBoundingClientRect` overlap check — **fixes the flicker / pin-desync bug**.
- Stays concentrated where the bloom peaks (Motion Matters); behavior there is visually unchanged but now synchronized with the rest of the atmosphere.

### Comet head — spark, inside `V21Filament`
- An SVG group rendered on top of the stroke: white core (`#eaf8ff`, r ≈ 3), a thin cross-flare (two 1px lines ≈ 18px long), and a cyan glow (`#6fd3ff`).
- Each frame: determine the actively-drawing path and its drawn length, then `pt = path.getPointAtLength(drawnLen)` and translate the spark to `pt`. It rides the **head tip → the letters during the MM pin → the tail tip** — one continuous focal point. Because it reads the *actual* drawn length (not a separate time base), the head→letters→tail handoff has no jump.
- Glow blur `6px → 16px` and cross-flare opacity `0.4 → 0.95`, both scaled by `--atmo-vel`.
- Hidden before the draw begins, when fully drawn, or when off-screen.
- Color core is white; glow is cyan (sampling the atmosphere, which is cyan in palette C).

---

## Reduced motion (`prefers-reduced-motion: reduce`)
- Bloom renders **static** at fixed opacity ≈ 0.06 — no velocity reaction, no breathing scale.
- Comet head **not rendered** (the filament is already static/fully-drawn in this mode).
- Flow-field stays disabled (unchanged). The page degrades to a calm still image.

## Edge cases
- **Missing Motion Matters element:** guard → bloom defaults to floor (0.04), comet hidden, no crash.
- **Resize:** the filament already recomputes geometry on `ResizeObserver`; the comet reads the new tip and self-corrects. Bloom math is viewport-relative and recomputed each frame.
- **Pin handoff:** comet rides the actual drawn length, so no discontinuity between scroll-driven and pin-driven segments.

## Performance
- **One** `requestAnimationFrame` loop. Bloom reads CSS vars (no React re-renders). Comet is a single `getPointAtLength` per frame.
- The atmosphere loop is **O(1) per frame** (one `getBoundingClientRect` + two `style.setProperty` writes), so it runs continuously. An `IntersectionObserver` pause was evaluated and deemed unnecessary — the per-frame cost is negligible and the gating added fragility for no measurable benefit.
- No competing tickers. Always cleaned up on unmount (cancel RAF, remove the scroll listener, remove the CSS props, zero the shared signal); the filament keeps its existing `gsap.context().revert()`.

---

## Files

| File | Change |
|---|---|
| `tma-web/components/portfolio-v21/V21Atmosphere.jsx` | **New** — RAF loop, computes `--atmo-bloom`/`--atmo-vel`, renders the bloom layer |
| `tma-web/components/portfolio-v21/V21Filament.jsx` | **Modified** — add comet group + per-frame tip positioning; read `--atmo-vel` |
| `tma-web/components/portfolio-v21/V21FlowField.jsx` | **Modified** — read the shared signal instead of its own rect-check |
| `tma-web/components/portfolio-v21/v21.css` | **Modified** — `.v21-atmosphere`, `.v21-comet`, reduced-motion rules |
| `tma-web/app/portfolio-v21/page.jsx` | **Modified** — mount `<V21Atmosphere />` as the **first** child of `.v21-worklane` (before `<V21FlowField />` and `<V21Filament />`) |

No V20 files are touched.

---

## Testing (Playwright e2e, mirroring the existing v20 suite, across the 6 viewports)

1. Bloom layer exists; its opacity **increases** as Motion Matters scrolls toward center, then **decreases** after.
2. `--atmo-vel` **rises** on a fast programmatic scroll and **decays toward 0** at rest.
3. Comet element exists and stays **within the filament's bounding box** through head → letters → tail.
4. Reduced-motion: **no comet**, bloom static, no console errors.
5. Console-error guard across a full scroll (no throws, no leaked ScrollTriggers on unmount/navigation).

## Success criteria
- Scrolling the page feels like one continuous, breathing space rather than four separate sections.
- The glow no longer "dies" after the hero — a whisper of atmosphere is present throughout, peaking at Motion Matters.
- The eye is carried by a single moving spark from the first stroke to the last.
- No regression to V20; reduced-motion remains calm and correct; no new console errors; 60fps maintained.

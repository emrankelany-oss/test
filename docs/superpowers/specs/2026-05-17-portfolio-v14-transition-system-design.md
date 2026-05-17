# Portfolio V14 — Cross-Scene Transition System (SP-2A) — Design

**Date:** 2026-05-17
**Status:** Approved (pending written-spec review)
**Branch context:** `feat/portfolio-v14` (continues from completed SP-0 kernel + SP-1 ProjectUniverse intro).

---

## 1. Context & decomposition

The user expanded SP-2 ("manifesto + Foodics/Zid featured chapters") to also build the
cross-scene transition system now (originally deferred to SP-4). That bundles two
distinct subsystems, so SP-2 was split into two independent spec→plan→build cycles:

| | Sub-project | Delivers | Depends on |
|---|---|---|---|
| **SP-2A** | **Cross-scene transition system** (this doc) | The `SceneController` transition overlay actively blending adjacent-scene boundaries via the existing `transitions.js` primitives + scroll-velocity, no hard cuts; verified against the *current* scenes. | SP-0 |
| SP-2B | Narrative content chapters | Manifesto (deck Slide 3) + Foodics & Zid full-narrative-act pinned chapters replacing the probes, plugged into SP-2A. | SP-2A |

Build order **SP-2A → SP-2B**: the transition engine is higher-risk infra with no
content dependency — prove it in isolation (the SP-0 rationale), then content drops onto
a verified transition layer. **This document specs SP-2A only.**

Resolved page order (decided in brainstorming, realized in SP-2B): IntroFilm →
Manifesto → Foodics → Zid. Chapter depth: full narrative acts. Both are SP-2B concerns;
SP-2A is content-agnostic.

## 2. Goal

Activate the dormant `[data-v14-transition-overlay]` element (shipped inert by SP-0)
into a real cross-scene match-cut layer: at every adjacent-scene boundary it blends the
outgoing scene into the incoming one using the existing pure `transitions.js` curves,
modulated by scroll velocity, with no visible hard cut. It must be verified against the
scenes that already exist (`IntroFilmScene` + `ProbeSceneA`/`ProbeSceneB`) with **zero
dependency on new content**.

## 3. Resolved decisions

- Driver architecture: **controller-owned shared-rAF driver; scenes report progress.**
  `useScene` adds one call — `controller.reportProgress(id, self.progress)` — alongside
  the existing `setVelocity`. `SceneController` runs ONE shared `requestAnimationFrame`
  loop that reads all scene progresses + velocity + `registry.adjacentPairs()`, computes
  the active boundary, and writes the overlay element. (Rejected: a master document-wide
  ScrollTrigger — brittle through pin-spacer-distorted layout; per-boundary interstitial
  elements — fights the continuous-veil + velocity-coupling requirement.)
- Overlay rendering: **DOM** (the existing fixed `<div data-v14-transition-overlay>`),
  styled via `backdrop-filter`, `background`, `transform`, `opacity`. The WebGL
  transition renderer remains SP-4; SP-2A pulls forward the *blend orchestration*, not a
  GL renderer. The SP-0 `FrameRenderer` stays Canvas2D, untouched.
- Seam model: a scene's **last `SEAM` fraction** of its own progress (default
  `SEAM = 0.18`) maps boundary `t: 0→1` toward the next scene. Outside any seam there is
  no active transition (overlay invisible).
- Scroll-handler discipline preserved: scroll/`onUpdate` only **stores** progress
  (O(1)); all overlay computation/writes happen in the single shared rAF (mirrors the
  SP-0 engine).

## 4. Pure cores (unit-tested with `node:test`)

### 4.1 `tma-web/components/portfolio-v14/engine/boundaryState.js`

`boundaryState(sceneProgresses, seam = 0.18)` where `sceneProgresses` is an
**order-sorted** array `[{ id, progress }]`.

- Finds the first scene whose `progress >= (1 - seam) - EPS` (with `EPS = 1e-9`) AND
  that has a successor in the array; returns `{ fromId, toId, t }` where
  `t = (progress - (1 - seam)) / seam`, then **snap to the exact boundaries within
  `EPS`** (`t >= 1-EPS → 1`, `t <= EPS → 0`) and finally `clamp(t, 0, 1)`. The `EPS`
  is required in two places because `1 - seam` is not exact in IEEE-754 (e.g.
  `1 - 0.18 === 0.8200000000000001`): (a) the boundary guard so a scene exactly at
  the nominal seam start is not missed, and (b) the `t` snap so `progress` exactly `1`
  yields exactly `1` (the raw division gives `0.9999999999999997`) and the seam start
  yields exactly `0`.
- Returns `null` when: array length < 2; no scene is within its seam; or the only
  in-seam scene is the last (no successor).
- Pure, deterministic. Unit tests: two scenes mid-seam → correct `t`; `progress`
  exactly `1-seam` (float-unsafe literal, e.g. `0.82` with `seam 0.18`) → `t=0`;
  `progress` 1 → `t=1`; before seam → `null`; last scene in seam → `null`; single
  scene → `null`; empty → `null`; `t` clamped to `[0,1]`.

### 4.2 `tma-web/components/portfolio-v14/engine/overlayStyle.js`

`overlayStyle(t, velocity, fromColor, toColor)` →
`{ blurPx, scale, bleedColor, bleedAlpha, opacity }`.

- Composes the existing `transitions.js`: `blurPx = blurAmount(t) * vMul`,
  `scale = zoomScale(t)` (zoom not velocity-scaled — avoids nausea),
  `bleedAlpha = colorBleedAlpha(t) * vMul`, `opacity` from a triangle on `t`
  (0 at the ends, peak mid) so the veil is invisible inside scenes.
- `vMul = 1 + min(|velocity| / VEL_REF, 1) * VEL_GAIN` (`VEL_REF = 3000`,
  `VEL_GAIN = 0.6`) — faster scroll → stronger blur/bleed, hard-clamped so it can never
  exceed `1 + VEL_GAIN`.
- `bleedColor` = per-channel linear interpolation of `fromColor`→`toColor` by `t`
  (parse `#rgb`/`#rrggbb`; fall back to `#000` on unparseable input).
- `t <= 0` or `t >= 1` → fully inert (`opacity 0`, `blurPx 0`, `scale 1`,
  `bleedAlpha 0`). Pure. Unit tests: midpoint peak; endpoint inert; velocity raises
  blur and is clamped at `1+VEL_GAIN`; color interpolation endpoints + midpoint;
  bad color → `#000`; `blurPx`/`bleedAlpha` are finite non-negative.

These two modules import nothing but `transitions.js`; `transitions.js` is unchanged.

## 5. SceneController extension

- Add `reportProgress(id, progress)` to the memoized API: writes into a
  `progressMapRef` (`Map<id, number>`), no re-render (ref, like `velocityRef`).
- Add a `useEffect` in `SceneControllerProvider` that starts one shared rAF
  (`prefers-reduced-motion` → do not start it; overlay stays inert). Each frame:
  1. Build `[{id,progress}]` from `registry.list()` (already order-sorted) joined with
     `progressMapRef` (missing → `0`).
  2. `const b = boundaryState(list, SEAM)`.
  3. If `b` null → set overlay `style.opacity = "0"` (and bail).
  4. Else read `getVelocity()` and the registry entries' `bleed` colors for
     `b.fromId`/`b.toId`; `const s = overlayStyle(b.t, velocity, fromBleed, toBleed)`;
     write to the overlay element exactly: `style.backdropFilter =
     "blur(" + s.blurPx + "px)"`; `style.background = s.bleedColor`;
     `style.opacity = String(s.opacity * s.bleedAlpha)` (a single composed veil
     strength — `opacity` is the visibility envelope, `bleedAlpha` the color-wash
     intensity; multiplying gives one number so the element has exactly one opacity
     and there is no double-source ambiguity); `style.transform =
     "scale(" + s.scale + ")"`; `style.willChange = "opacity, transform"`.
  - Overlay element looked up once via `document.querySelector('[data-v14-transition-overlay]')`
    (it is rendered by the provider itself); guarded for null.
  - Cleanup: `cancelAnimationFrame`.
- The overlay JSX stays as-is (fixed, `pointer-events:none`, `zIndex:50`); only its
  inline `opacity:0` initial remains the resting state.

## 6. useScene extension

- Signature gains an optional `bleed` (CSS color string; default `"#000"`).
- `controller.registry.register({ id, order, el, viewports, bleed })` — `bleed` is
  carried on the registry entry (additive; `sceneRegistry.js` already stores the whole
  object, no change needed there).
- In `onUpdate`, add `controller.reportProgress(id, self.progress)` next to the existing
  `controller.setVelocity(v)`.
- Reduced-motion branch: also call `controller.reportProgress(id, 1)` once (so a static
  document has a defined progress map); the driver isn't running under reduced motion so
  the overlay stays inert regardless.
- No change to the pinned ScrollTrigger config, deps, or cleanup.

## 7. Scene wiring

`IntroFilmScene`, `ProbeSceneA`, `ProbeSceneB` each pass a `bleed` color to `useScene`
matching their dominant background (`IntroFilm` `#000`, `ProbeSceneA` `#08070b`,
`ProbeSceneB` `#0b0708`). No other scene-internal changes. SP-2B's manifesto/Foodics/Zid
chapters will supply their own `bleed` when they replace the probes.

## 8. Reduced motion / errors

- Reduced motion: driver rAF never starts; overlay stays `opacity:0`; page remains a
  normal scroll document (SP-0 convention intact).
- Unparseable / missing `bleed`: `overlayStyle` falls back to `#000`.
- Fewer than two registered scenes, or no scene in a seam: `boundaryState` → `null` →
  overlay invisible.
- Overlay element not found (SSR / pre-mount): driver guards and no-ops.
- `pointer-events:none` retained — the overlay never intercepts input.

## 9. Verification

- **node:test:** `v14-boundaryState.test.mjs` and `v14-overlayStyle.test.mjs` covering
  the cases in §4. Existing 38 unit tests stay green (no change to pure SP-0/SP-1
  modules or `transitions.js`).
- **Playwright `tma-web/playwright/tests/v14-transition.spec.js`** on `/portfolio-v14`:
  1. Scrolling across a scene→scene seam drives the overlay to a non-zero opacity/blur
     mid-seam, and it returns to `opacity:0` well within a scene (proves active blend,
     no hard cut).
  2. A fast programmatic scroll across a seam produces a higher peak overlay blur than a
     slow scroll across the same seam (velocity coupling).
  3. `reducedMotion:"reduce"` run: overlay stays `opacity:0`, page fully scrollable,
     all scenes reachable.
- **Regression:** SP-0 `v14-kernel.spec.js` (via `?frames=procedural`) and
  `v14-reduced-motion.spec.js`, and SP-1 `v14-universe.spec.js` all still pass
  unchanged — the overlay is `pointer-events:none` and inert inside scenes, so it must
  not perturb frame advance, fps, or reduced-motion behavior.

## 10. Out of scope

Manifesto / Foodics / Zid content and the final page order (SP-2B); the WebGL
transition renderer and any per-pixel match-cut of scene *content* (SP-4); archive wall,
impact, closing (later sub-projects). SP-2A delivers only the orchestrated DOM overlay
blend layer + its two pure cores + the controller/useScene plumbing, proven against the
existing scenes.

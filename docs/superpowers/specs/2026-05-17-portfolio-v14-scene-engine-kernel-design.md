# Portfolio V14 — Scene-Engine Kernel (SP-0) — Design

**Date:** 2026-05-17
**Status:** Approved (pending written-spec review)
**Branch context:** new route `portfolio-v14`; existing `portfolio-v2…v13` left untouched as reference.

---

## 1. Context & Decomposition

The full brief ("a website that feels like a film the user controls via scroll") is too large
for a single spec. It decomposes into five sub-projects, each with its own spec → plan →
implementation cycle:

| # | Sub-project | Delivers | Depends on | Content risk |
|---|---|---|---|---|
| **SP-0** | **Scene-engine kernel** | Reusable backbone: `portfolio-v14` shell, `FrameSequenceEngine`, `SceneController`, transition primitives | — | None (procedural) |
| SP-1 | Cinematic intro | Extend Remotion to the 6-beat film, render chunked WebP, play scroll-bound, match-cut into HTML | SP-0 | Self-generated |
| SP-2 | Manifesto + featured chapters | Manifesto scene + Foodics & Zid pinned case studies | SP-0 | Real (deck) |
| SP-3 | Archive wall + impact + closing | ~40 placeholder drift grid, impact stats, closing scene | SP-0 | Placeholder |
| SP-4 | Transition & perf hardening | Cross-scene match-cuts, velocity modulation, 60fps audit | SP-0–3 | None |

Build order: **SP-0 → SP-1 → SP-2 → SP-3 → SP-4**. SP-0 first because every other
sub-project is inert without the engine, it carries the highest *technical* risk
(scroll-bound 60fps rendering + pinned orchestration), and it needs zero real content.

**This document specs SP-0 only.** SP-1–4 are out of scope here.

## 2. Goal

A content-free, reusable backbone that turns a new `portfolio-v14` route into a
scroll-driven film. It must prove the two hardest things end-to-end:

1. 60fps scroll-bound frame rendering with chunked lazy preload.
2. Modular pinned-scene orchestration with a no-hard-cut transition layer.

It proves these against a **procedural placeholder sequence** (canvas-generated), so
SP-0 ships with no real assets and the engine is measurable in isolation.

## 3. Architectural Decisions (resolved)

- **Renderer = A1 Canvas 2D `drawImage`**, hidden behind a swappable `FrameRenderer`
  interface so SP-4 can later drop in a WebGL renderer for shader transitions without
  touching scene code. (A2 WebGL-now rejected as premature risk; A3 DOM `<img>` rejected
  for decode/layout jank at 200+ frames.)
- **Orchestration = B3 hybrid**: per-scene ScrollTrigger isolation **plus** a thin
  `SceneController` "conductor" owning only the shared inter-scene transition overlay and
  global scroll-velocity signal. (B2 single master timeline rejected — couples all scene
  code into one growing file, the V5Stage monolith problem at 5× scale. B1 pure registry
  rejected — leaves the brief's transition system homeless until SP-4.)
- **Smooth scroll** reuses the existing `tma-web/components/portfolio/SmoothScroll.jsx`
  (Lenis + `gsap.ticker` + `ScrollTrigger`, fully disabled under
  `prefers-reduced-motion`). SP-0 does **not** introduce a parallel scroll system.

## 4. File Layout

New files only; nothing existing is modified except adding the new route.

```
tma-web/app/portfolio-v14/page.jsx                 # server shell (structural HTML, SEO metadata)
tma-web/components/portfolio-v14/
  V14Experience.jsx        # "use client" root: mounts SmoothScroll + SceneController provider + scenes
  engine/
    FrameRenderer.js       # FrameRenderer interface + Canvas2DRenderer impl (A1, swappable)
    FrameSequenceEngine.js # progress → frame index → renderer; chunked LRU preload; shared rAF
    useFrameSequence.js    # React hook binding the engine to a scene's ScrollTrigger
    SceneController.js     # B3 conductor: scene registry + velocity signal + transition overlay
    useScene.js            # hook: register a pinned scene, returns {progress, velocity}
    transitions.js         # transition primitives: blur, zoom, color-bleed, fade
  scenes/
    PlaceholderFilmScene.jsx   # SP-1 stand-in: drives FrameSequenceEngine with procedural frames
    ProbeSceneA.jsx            # trivial HTML scene before the film
    ProbeSceneB.jsx            # trivial HTML scene after the film (proves seamless handoff)
  dev/
    proceduralFrames.js        # canvas-generated test "film" (gradient + frame counter + motion)
```

## 5. Components

### 5.1 FrameSequenceEngine (`engine/FrameSequenceEngine.js`)

- **Input:** a `progress` value `0..1` (from a ScrollTrigger scrub) and a frame source
  descriptor `{ count, getUrl(i) }` **or** `{ count, drawProcedural(ctx, i) }`.
- **Index mapping:** `frameIndex = clamp(Math.round(progress * (count - 1)), 0, count-1)`.
- **Cache:** `Map<index, ImageBitmap>`, LRU-capped at **60** entries. On eviction,
  `ImageBitmap.close()` is called to free GPU/decoded memory.
- **Chunked lazy preload:** maintain a window of **+20 ahead / −5 behind** the current
  index. Decode via `createImageBitmap` off the scroll path. Never decode synchronously
  inside the scroll handler.
- **Render loop:** ScrollTrigger `onUpdate` only **stores** the latest target progress
  (O(1), no draw). A **single shared `requestAnimationFrame` loop** reads the latest
  target each frame, computes the index, and calls `renderer.draw()` **only if the index
  changed**. This is the brief's rAF-throttle rule and decouples scroll-event rate from
  draw rate (one draw per animation frame max).
- **Procedural mode:** when given `drawProcedural`, the engine renders directly to an
  offscreen canvas per index instead of fetching/decoding — used by SP-0's dev frames.
- **Cleanup:** cancel rAF, `close()` all cached ImageBitmaps, clear the cache on unmount.

### 5.2 FrameRenderer (`engine/FrameRenderer.js`)

Interface (so SP-4 can swap implementations without scene changes):

```
interface FrameRenderer {
  mount(canvasEl)                  // attach, acquire context
  resize(w, h, dpr)                // recompute cover-fit math
  draw(bitmap, { filter, tint })   // paint one frame; filter = blur px, tint = color-bleed
  destroy()                        // release context/resources
}
```

`Canvas2DRenderer` (the only SP-0 implementation): cover-fit `ctx.drawImage` (object-fit:
cover equivalent), optional `ctx.filter = "blur(Npx)"`, optional tint via
`globalCompositeOperation`. A future `WebGLRenderer` satisfies the same interface in SP-4.

### 5.3 SceneController (`engine/SceneController.js`) + React context

One instance per experience, provided via React context by `V14Experience`. Owns **only
the shared layer**:

- **Scene registry:** scenes call `register({ id, order, el, viewports })`; controller
  keeps them DOM-ordered and exposes the ordered list.
- **Scroll velocity:** subscribes to the existing Lenis/`ScrollTrigger` update path and
  exposes a normalized `velocity` signal scenes and transitions can read.
- **Transition overlay:** owns a single fixed full-viewport element/canvas. Across each
  adjacent-scene boundary it runs a chosen primitive from `transitions.js` (default:
  blur-to-sharp + slight zoom + color-bleed) driven by boundary progress, so there are no
  hard cuts. Scenes may declare `transitionOut` / `transitionIn` hints; the controller
  picks/blends.

It does **not** own scene internals or the frame engine.

### 5.4 useScene (`engine/useScene.js`)

Wraps the existing V5Stage pinned-trigger pattern: creates a pinned ScrollTrigger
(`pin: true`, `scrub`, `start`/`end` derived from a `viewports` prop), registers the
scene with the controller, returns a live `{ progress, velocity }`. Honors reduced
motion (see §7).

### 5.5 useFrameSequence (`engine/useFrameSequence.js`)

Binds a `FrameSequenceEngine` instance to a scene: takes the scene's live `progress`,
calls `engine.setProgress(p)`, owns engine lifecycle (create on mount, destroy on
unmount), mounts the renderer onto the scene's canvas.

### 5.6 Scenes & dev frames

- `PlaceholderFilmScene.jsx` — a pinned scene that uses `useScene` + `useFrameSequence`
  with the procedural source; stand-in for SP-1's real Remotion film.
- `ProbeSceneA.jsx` / `ProbeSceneB.jsx` — minimal HTML scenes (large type, transform/
  opacity off `progress`) placed before/after the film scene to prove a seamless,
  cut-free handoff in both directions.
- `dev/proceduralFrames.js` — generates a deterministic test "film": animated gradient +
  large frame-index counter + a moving element, so frame advance is visually unambiguous
  and the engine is testable without assets.

## 6. Data Flow

```
Lenis (SmoothScroll) → gsap.ticker → ScrollTrigger.update
  → per-scene ScrollTrigger scrub → scene.onProgress(p)
       → film scene:  engine.setProgress(p) → shared rAF → renderer.draw(frame)
       → html scene:  GSAP transform/opacity off p
  → SceneController: reads boundary progress + velocity
       → transition overlay primitive between adjacent scenes (no hard cut)
```

The scroll handler path is O(1) (store only). All painting happens in the single shared
rAF loop.

## 7. Reduced Motion / SSR / Error Handling

- **`prefers-reduced-motion: reduce`** — `SmoothScroll` already bails (no Lenis). SP-0
  matches the existing V5 convention: no pin, no scrub. Each scene renders its **static
  end state**; the film scene shows a single representative poster frame; the page remains
  a normal vertical-scroll document, fully readable and scrollable.
- **SSR** — `page.jsx` is a server component emitting structural HTML + SEO metadata;
  `V14Experience` is `"use client"`; the engine guards `typeof window`.
- **Frame fetch/decode failure** — engine keeps the last good frame, logs once, never
  throws into the scroll/rAF loop. Missing source → renderer paints a solid brand color.
- **Resize / orientation** — debounced; `renderer.resize()` recomputes cover math;
  `ScrollTrigger.refresh()` on orientation change.

## 8. Performance Strategy (satisfies brief §6)

- Transform / opacity / canvas only — zero layout thrashing in the scroll path.
- Scroll handler is O(1) store-only; all drawing in one shared rAF; redraw skipped when
  the frame index is unchanged.
- Preload window only (+20 / −5), LRU cache cap (60), GPU-decodable `ImageBitmap`,
  `close()` on evict/unmount.
- Procedural dev frames keep the engine measurable in isolation (no asset variable).

## 9. Verification

Playwright (already a devDependency). A scripted run drives `portfolio-v14` and asserts:

1. Scrolling 0 → max advances the rendered frame **monotonically** with scroll position
   (sample canvas pixels / exposed debug frame index).
2. No console errors across the full scroll.
3. Draw count tracks **frames painted, not scroll events** (rAF-throttle proof — compare
   an instrumented draw counter against scroll-event count).
4. A `prefers-reduced-motion` run yields a **static, fully scrollable** page (no pin
   lock, all probe content reachable).
5. FPS sampling stays **≥ ~55** during a fast programmatic scroll.
6. Manual: ProbeSceneA → film → ProbeSceneB shows a seamless, cut-free handoff in both
   directions with correct pin release alignment.

## 10. Out of Scope for SP-0

Real Remotion frames (SP-1), manifesto/case-study content (SP-2), the motion archive
wall / impact / closing scenes (SP-3), final shader-based transitions and full
performance hardening (SP-4). SP-0 delivers the engine, the controller, the transition
primitives, procedural frames, one placeholder film scene, and two probe scenes — nothing
content-bearing.

# Portfolio V16 — Cinematic Scroll-Controlled Frame-Sequence Hero — Design

Date: 2026-05-18
Status: Approved (pending written-spec review)
Route: `/portfolio-v16`

## 1. Goal

A premium, Awwwards-level cinematic hero where the user scrolls and controls an
asteroid/explosion image sequence frame-by-frame on a canvas. The hero is pinned
for 300vh; scroll progress drives the displayed frame. After the pinned hero, a
smooth transition leads into a `FeaturedProjectScaleGallery` placeholder section.

Visual language: cinematic, matte black, electric blue, premium sci-fi, elegant —
not cartoonish, not game-like, not a plain video background. The result must feel
like the user is controlling a cinematic explosion through scrolling.

## 2. Decisions (locked)

- **Language:** JavaScript / JSX. The codebase has no TypeScript tooling
  (`jsconfig.json`, all `.jsx`, `@/*` alias). V16 follows existing convention.
  The TypeScript request in the brief is satisfied behaviorally, not literally.
- **Engine:** Fully standalone V16 engine under `components/portfolio-v16/`. No
  dependency on the existing v14 scene-controller engine.
- **Frame assets:** Source `../frames/ezgif-frame-0NN.jpg` (192 frames, 1280×720
  JPEG, 6.6 MB) are converted once to optimized WebP at
  `tma-web/public/assets/v16/frames/frame-001.webp` … `frame-192.webp`.
- **Route:** `/portfolio-v16` (matches the existing portfolio-vN convention).
- **Particles:** Three.js GPU particle/debris field (the `three` +
  `@react-three/fiber` deps are already installed). Particles only — no 3D
  models, no post-processing stack. Isolation rule: the r3f `<Canvas>` is a
  sibling overlay with its own render loop; particle motion is driven by a
  shared `progressRef` read inside `useFrame` — **no React state and no
  reconciler work per scroll tick**, so scrub stays smooth. Reduced-motion
  unmounts the r3f canvas entirely.
- **Explosion band (0.62):** Implemented as a progress *band* centered on 0.62
  (configurable `EXPLOSION_RANGE = [0.58, 0.70]`), not a single instant, so the
  glow + screen-shake + particle burst ramp in and decay rather than snap.

## 3. Asset pipeline (build-time, one-time, committed)

Script: `tma-web/scripts/build-v16-frames.mjs` using the installed `sharp`
devDependency.

- Input: `<repoRoot>/frames/ezgif-frame-${NNN}.jpg`, NNN = 001..192.
- Output: `tma-web/public/assets/v16/frames/frame-${NNN}.webp`, quality 50,
  `effort: 6`, no resize (source is already 1280×720). Actual total ≈ 7.6 MB.
  NOTE: the original "~3–4 MB / smaller than source" estimate was wrong — the
  source JPGs are already aggressively ezgif-compressed (6.6 MB), so WebP
  re-encoding cannot beat them at acceptable cinematic quality. 7.6 MB is
  accepted: tiered preload makes only frame 1 + first ~30 (~1.2 MB) blocking,
  the rest stream in the background, and graceful-skip covers slow networks.
- Idempotent: skips frames whose output already exists; logs a summary.
- Output WebP files are committed so production/CI never need the raw `frames/`
  source directory. The script is run manually once during implementation.

## 4. Component / module architecture

All new, isolated under `components/portfolio-v16/`.

| Unit | Responsibility | Depends on |
|---|---|---|
| `app/portfolio-v16/page.jsx` | Route + Next metadata; renders `<V16Experience/>` | V16Experience |
| `components/portfolio-v16/V16Experience.jsx` | Composition root: Lenis + GSAP ticker wiring, ScrollTrigger registration/cleanup, mounts hero + featured | hero, featured, gsap, lenis |
| `components/portfolio-v16/engine/frameSequence.js` | Pure helpers: `progressToIndex`, `indexToUrl`, `clamp`, `lerp`, config constants | none |
| `components/portfolio-v16/engine/framePreloader.js` | Tiered preload (frame 1 → first 30 → remainder), concurrency cap, graceful skip, `getBitmap(i)`, ready/progress callbacks | frameSequence |
| `components/portfolio-v16/engine/canvasRenderer.js` | Canvas2D cover-fit `drawImage`, DPR-aware sizing, resize recompute | frameSequence (coverFit math) |
| `components/portfolio-v16/useV16FrameSequence.js` | Hook owning renderer + preloader + rAF loop; lerps displayed→target progress; zero React re-render per frame | the three engine modules |
| `components/portfolio-v16/V16Hero.jsx` | Pinned 300vh section: `<canvas>`, overlay stack, progress-driven text timeline, loading overlay | useV16FrameSequence, overlays |
| `components/portfolio-v16/overlays/GradientVignette.jsx` | Dark gradient + vignette (CSS, static) | none |
| `components/portfolio-v16/overlays/GrainLayer.jsx` | Tiling noise grain, `mix-blend`, subtle | none |
| `components/portfolio-v16/overlays/BlueGlow.jsx` | Soft electric-blue radial glow; optional mouse parallax | none |
| `components/portfolio-v16/overlays/ParticleField.jsx` | r3f `<Canvas>` overlay; GPU `THREE.Points` debris field; `useFrame` reads shared `progressRef`; burst response in the explosion band | three, @react-three/fiber, frameSequence progressRef |
| `components/portfolio-v16/V16FeaturedPlaceholder.jsx` | `FeaturedProjectScaleGallery` placeholder section | none |

Design principle: each engine module has one purpose, a small interface, and is
understandable/testable in isolation. The pure modules (`frameSequence`,
cover-fit math, preloader ordering) carry the unit-test surface; React/canvas
glue is covered by Playwright.

## 5. Configuration block (top of `frameSequence.js`, re-exported)

```js
export const TOTAL_FRAMES = 192;
export const FRAME_PATH = "/assets/v16/frames/frame-";
export const FRAME_EXT = "webp";
export const PAD = 3;                    // frame-001
export const PIN_VIEWPORTS = 3;          // 300vh
export const SCRUB_EASE = 0.12;          // displayed→target lerp per rAF
export const PRELOAD_PRIORITY = 30;      // gate hidden after first N decoded
export const PRELOAD_CONCURRENCY = 6;    // background fetch parallelism
export const EXPLOSION_RANGE = [0.58, 0.70];
export const TEXT_BEATS = {
  label:      0.08,  // THE MOTION AGENCY
  headline1:  0.20,  // WE DON'T BUILD BRANDS.
  headline2:  0.38,  // WE RELEASE MOMENTUM.
  explosion:  0.62,  // glow + screen shake
  fadeOut:    0.82,  // text fades, frames dominate
  archive:    0.92,  // ENTER THE ARCHIVE
};
```

## 6. Scroll → frame data flow

1. One `ScrollTrigger`: `{ trigger: heroRef, start: "top top",
   end: "+=300%", pin: true, scrub: true }`. `onUpdate(self)` writes
   `targetProgress = self.progress` into a ref — **no React state per frame**.
2. rAF loop (in `useV16FrameSequence`):
   `displayed += (target - displayed) * SCRUB_EASE`;
   `index = round(displayed * (TOTAL_FRAMES - 1))`;
   if index changed → `renderer.draw(preloader.getBitmap(index) ?? lastGood)`.
   The lerp produces the weighty, premium feel and absorbs scrub jitter.
3. Lenis + GSAP: reuse the established pattern (new Lenis instance; `lenis.raf`
   added to `gsap.ticker`; `ScrollTrigger.update()` on Lenis `scroll`;
   `gsap.ticker.lagSmoothing(0)`).
4. `ScrollTrigger.refresh()` is called once after the preloader signals the
   first-`PRELOAD_PRIORITY` frames decoded, so pin measurement happens after
   layout has settled (no layout shift, correct pin distance).
5. Cleanup on unmount: kill the ScrollTrigger, remove the Lenis ticker fn,
   `lenis.destroy()`, cancel rAF, close cached `ImageBitmap`s.

## 7. Preload strategy

1. Frame 1 is fetched + decoded + drawn immediately so first paint is the first
   frame (not a blank canvas).
2. A loading overlay (matte-black with a soft blue glow pulse) is shown until the
   first `PRELOAD_PRIORITY` (30) frames are decoded, then fades out.
3. Remaining frames (31→192) are fetched in the background,
   `PRELOAD_CONCURRENCY`-capped (~6 parallel), low priority.
4. Frames are stored as decoded `ImageBitmap` keyed by index (all 192 retained;
   1280×720 × 192 is acceptable memory).
5. A frame that fails to fetch/decode is skipped; the last successfully drawn
   frame is held; a single console warning is emitted (no error spam).

## 8. Cinematic timeline (progress-driven)

| Progress | Behavior |
|---|---|
| 0.08 | Label `THE MOTION AGENCY` fades + rises in |
| 0.20 | Headline line 1 `WE DON'T BUILD BRANDS.` reveals |
| 0.38 | Headline line 2 `WE RELEASE MOMENTUM.` reveals |
| 0.58–0.70 | Explosion band: text glow intensifies, subtle transform-only screen-shake (decaying), particle burst; peak at 0.62 |
| 0.82 | All text fades out; frames dominate |
| 0.92 | Transition line `ENTER THE ARCHIVE` reveals |

- Text is driven by progress thresholds via Framer Motion (opacity + `y`
  transform only — **no width/height/top/left**, zero layout shift).
- Screen-shake is a small `transform: translate3d()` on a wrapper, amplitude
  scaled by proximity to 0.62 within the band, fully decayed by band edges.
- Optional mouse parallax: small `translate3d` on blue-glow + text via a
  throttled rAF pointer handler. Disabled under reduced-motion.

## 9. Transition → Featured section

- As progress eases toward 1, the lerp naturally dwells on the final frames
  (last frame "holds briefly").
- On unpin, `V16FeaturedPlaceholder` enters: debris particles drift downward and
  a faint vertical light streak guides the eye into the next section.
- The placeholder: full black background, large `FEATURED PROJECTS` title, and
  an empty, clearly-marked placeholder area carrying a stable `data-` hook
  (`data-v16-featured-gallery`) so a real scroll-scale gallery can be wired in
  later without touching the hero.

## 10. Overlay stack (z-order, all `pointer-events:none` except where noted)

Frame canvas (base) → dark gradient → vignette → blue radial glow → grain
(`mix-blend`) → Three.js particle `<Canvas>` (transparent, `pointer-events:none`)
→ text layer (top). Tuning is restrained matte-black + electric-blue; never
game-like or cartoonish.

## 11. Accessibility / reduced motion

`(prefers-reduced-motion: reduce)`: no Lenis, no scrub, no shake, no parallax,
no particle animation. The hero renders a single representative frame statically
and reveals all hero text immediately; the featured section is plainly visible.

## 12. Performance constraints

- No layout shift; only `transform` and `opacity` animate.
- No per-frame React re-render (progress lives in refs; rAF drives canvas).
- Canvas `drawImage` cover-fit with DPR cap (≤2) to bound backing-store size.
- Background preload is concurrency-capped and low priority.
- Single ScrollTrigger; single rAF loop; resize handler debounced via rAF.

## 13. Testing strategy (matches v14: TDD-where-pure + Playwright e2e)

**Node unit tests** (`tma-web/test/v16-*.test.mjs`, `node --test`):
- `frameSequence`: `progressToIndex` boundaries/clamping (0→0,
  1→TOTAL_FRAMES-1), `indexToUrl` zero-padding, `lerp`/`clamp`.
- `canvasRenderer` cover-fit: returned draw rect preserves aspect and covers the
  viewport for landscape/portrait/equal cases (no stretch, no gaps).
- `framePreloader`: tier ordering (1, then 1..30, then remainder), concurrency
  cap respected, a rejected fetch is skipped without aborting the batch.

**Playwright e2e** (`tma-web/playwright`):
- `/portfolio-v16` renders; canvas present and non-blank at scroll 0.
- Scrubbing to mid and end changes the rendered frame (canvas pixel hash differs
  between progress 0 / 0.5 / 1).
- Text beats appear at their expected scroll depths; `ENTER THE ARCHIVE`
  appears near the end.
- Reduced-motion path: static frame + all hero text visible, no pin scrub,
  the r3f particle `<Canvas>` is not mounted.
- The r3f particle canvas mounts (non reduced-motion) without WebGL/console
  errors; featured placeholder reachable after the hero unpins.

## 14. Out of scope (YAGNI)

Real featured-gallery content/animation; audio; a WebGL renderer path;
interpolation between source frames; a separate lower-res mobile frame set
(720p source is light enough); reuse of or changes to the v14 engine.

## 15. Risks & mitigations

- **Pin distance measured before frames ready** → `ScrollTrigger.refresh()`
  after first-30 decoded; loading overlay covers the gap.
- **Scrub feels jittery** → displayed→target lerp (`SCRUB_EASE`) decouples
  render cadence from scroll event cadence.
- **Memory from 192 ImageBitmaps** → acceptable at 1280×720; bitmaps closed on
  unmount; revisit only if profiling shows pressure.
- **r3f reconciler stealing scrub frames** → particle `<Canvas>` is a separate
  sibling tree with no per-tick React state; motion read from `progressRef` in
  `useFrame`; particle count kept modest (single `THREE.Points`, ~1–3k points).
- **WebP build step forgotten** → script is idempotent and its output is
  committed; e2e fails fast if frames are missing (canvas blank assertion).

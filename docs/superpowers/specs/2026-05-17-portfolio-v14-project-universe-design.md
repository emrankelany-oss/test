# Portfolio V14 — ProjectUniverse Intro (SP-1, redirected) — Design

**Date:** 2026-05-17
**Status:** Approved (pending written-spec review)
**Branch context:** `feat/portfolio-v14` (continues directly from the completed SP-0 kernel).
**Supersedes:** the original SP-1 intent ("extend MMonument to a 6-beat film"). Per user
direction, the M-Monument logo formation is NOT used. SP-1 is now a single cinematic
scene: a **universe of real project work floating in 3D space, camera flying through,
settling on a hero case**.

---

## 1. Scope

One new Remotion composition + render script + wiring into the existing SP-0 engine:

- New composition `ProjectUniverse` (`remotion/src/ProjectUniverse.tsx`), registered in
  `remotion/src/Root.tsx`.
- New render script `remotion/render-universe.mjs` (+ `render-universe` npm script)
  producing a WebP frame sequence under `tma-web/public/assets/v14/intro/`.
- Re-wire the `/portfolio-v14` film scene to consume that sequence through SP-0's
  already-built `getUrl` frame-source path, replacing the procedural placeholder.

**Out of scope:** the other brief beats (void / chaos burst / etc.), manifesto & case
content (SP-2), archive wall (SP-3), transition shader system (SP-4). The existing
`MMonument` / `MMonumentPaper` / `MMonumentDark` compositions are **left in place,
unused — not deleted** (removing them is unrelated work). SP-0's `ProbeSceneA` /
`ProbeSceneB` remain as the harness around the film scene.

## 2. Resolved decisions

- Panels show **real brand work**: the 2 case key-visuals
  (`tma-web/public/assets/case-foodics-boundless.png`,
  `tma-web/public/assets/case-zid-ripple.png`) as large hero panels; the 24 client
  logos in `tma-web/public/assets/logos/*.png` as smaller panels.
- Camera arc: **fly-through that decelerates and settles on a hero case panel**
  (Foodics) — the brief's slow → fast → silence → clarity shape, giving a clean
  resolved final frame for a seamless handoff.
- Render technique: **`@remotion/three`** (Three.js perspective camera + textured
  planes), reusing the project's proven `MMonument` `ThreeCanvas` pattern. Offline
  one-time render, so render heaviness is irrelevant; 2.5D CSS and instancing
  optimizations were rejected (fake depth / premature).
- Composition format: **180 frames @ 30fps, 1600×1000** — matches the proven
  `render-frames.mjs` pipeline and is ample resolution for scroll-scrubbed playback.

## 3. The composition (`remotion/src/ProjectUniverse.tsx`)

A `ThreeCanvas` (via `@remotion/three`) following the structural conventions of
`remotion/src/MMonument.tsx` (frame-driven, no async CDN assets at frame 1, direct
lights only).

- **Camera:** Three.js `PerspectiveCamera`, flying along −Z. Position and look-at are
  pure functions of `useCurrentFrame()` via Remotion `interpolate` + `Easing`.
- **Panels:** `PlaneGeometry` meshes scattered through a deep Z-corridor at varied
  X/Y offsets and slight per-panel idle drift + rotation (deterministic — seeded from
  panel index, no `Math.random()` at render time so frames are reproducible).
  - 2 **hero panels**: the case key-visuals, large, placed as the camera's focal
    targets late in the arc.
  - 24 **logo panels**: smaller, the client logos, with a subtle emissive/brand-rim
    treatment so transparent-PNG logos read against the void.
- **Lighting / mood:** dark void background, subtle static particle field (points),
  TMA brand accent rim lights (pink + cyan) consistent with `MMonument`'s language.
- **Texture loading:** textures are loaded from the local `tma-web/public/assets`
  files at bundle time (Remotion serves them); follow `MMonument`'s "no envmap / no
  CDN HDR — assets must be ready by frame 1" lesson. Texture color space set to sRGB.

## 4. Camera arc (frame ranges, 0–179)

| Frames | Beat | Motion |
|---|---|---|
| 0–40 | drift / void | camera nearly still, panels far, faint particle motion |
| 40–130 | push-through | accelerating forward flight; panels stream past with parallax (near panels whip, far panels glide) |
| 130–160 | decelerate | easing out; the Foodics hero panel grows centered |
| 160–179 | settle / clarity | camera still, Foodics hero panel fills the frame, motion resolved |

Frame 179 is a clean, static, resolved hero composition (used as the reduced-motion
poster and the seamless-handoff endpoint).

## 5. Render pipeline (`remotion/render-universe.mjs`)

Cloned from `remotion/render-frames.mjs` with:

- `COMP_ID = "ProjectUniverse"`
- `TMP_DIR = remotion/out/universe-raw`
- `FINAL_DIR = tma-web/public/assets/v14/intro`
- Output naming `frame-001.webp … frame-180.webp` (1-based, zero-padded to 3)
- Same proven sharp settings: resize to 1280px wide `fit:inside`, `webp quality 78
  effort 4`; JPEG intermediate `jpegQuality 92`, `concurrency 4`.
- Cleans `FINAL_DIR` `frame-*` before writing.
- Added to `remotion/package.json` scripts as `"render-universe": "node
  render-universe.mjs"`.

The rendered sequence (~180 WebP, est. ~14 MB) is a build artifact committed under
`tma-web/public/assets/v14/intro/` so the route works without a render step in CI/deploy.

## 6. Engine wiring (`tma-web/components/portfolio-v14/`)

- Rename `scenes/PlaceholderFilmScene.jsx` → `scenes/IntroFilmScene.jsx`. It now builds
  a **URL frame source** instead of the procedural one:

  ```js
  const source = useMemo(() => ({
    count: 180,
    getUrl: (i) => `/assets/v14/intro/frame-${String(i + 1).padStart(3, "0")}.webp`,
  }), []);
  ```

  `useScene`/`useFrameSequence` are used exactly as before (unchanged). This exercises
  SP-0's `getUrl` → `fetch` → `createImageBitmap` → LRU path (the path hardened by the
  Task-8 crash-safe + in-flight-dedupe fix).
- Update `V14Experience.jsx` import/usage `PlaceholderFilmScene` → `IntroFilmScene`.
- Keep `dev/proceduralFrames.js` and expose it behind a dev-only opt-in
  (`?frames=procedural` query param read in `IntroFilmScene`) so SP-0's kernel
  Playwright spec (`v14-kernel.spec.js`, which relies on the deterministic procedural
  counter for the monotonic/throttle assertions) keeps a stable, network-free source
  and continues to pass unchanged.

## 7. Reduced motion / errors

- Reduced motion: unchanged from SP-0 — `useScene` skips pin/scrub, fires
  `onProgress(1,0)`; the engine resolves to frame 179 (the settled Foodics hero) as a
  static poster. A clean resolved final frame makes this a good still.
- Missing/failed frames: SP-0's engine already holds the last good frame, logs once,
  and solid-fills when nothing is available — so a not-yet-rendered sequence degrades
  gracefully rather than crashing. Rendering the sequence is a documented prerequisite.

## 8. Verification

- **Render script:** after `npm run render-universe`, assert exactly 180 files named
  `frame-001.webp`..`frame-180.webp` exist in `tma-web/public/assets/v14/intro/`, each
  non-zero size. (Script-level check / a node:test over the directory listing.)
- **Playwright (`tma-web/playwright/tests/v14-universe.spec.js`):** on `/portfolio-v14`
  (default real-frame source) — no console errors and no failed `/assets/v14/intro/`
  network requests; frame advances monotonically with scroll via `window.__v14Debug`;
  scrolling to the end leaves `frameIndex` at the last frame; a `reducedMotion:"reduce"`
  run shows a static page resting on the final frame.
- **Regression:** SP-0's `v14-kernel.spec.js` and `v14-reduced-motion.spec.js` must
  still pass. The kernel spec runs against the procedural source via
  `?frames=procedural`, keeping its deterministic monotonic/throttle assertions valid.
- **Unit:** existing 25 node:test cases remain green (no pure-core changes).

## 9. Out-of-scope (deferred)

Other intro beats, manifesto/featured chapters (SP-2), archive wall (SP-3), transition
& perf hardening (SP-4), deleting the unused `MMonument*` compositions.

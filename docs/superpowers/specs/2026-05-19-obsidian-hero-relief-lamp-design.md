# Design — Obsidian Hero (Relief-Lamp Signature Hero Module)

**Date:** 2026-05-19
**Status:** Approved (brainstorm complete) — ready for implementation planning
**Owner area:** `tma-web/components/obsidian-hero/`

## 1. Summary

A reusable, version-agnostic hero module for `tma-web` that recreates **Obsidian
Assembly's signature WebGL relief-lamp hero** at the same fidelity, using The Motion
Agency's own art direction. The centerpiece is a generated artifact: a polished black
**obsidian rocket booster engine with a shining blue gemstone core**. As the cursor
moves, the engine embosses and lights out of near-black like a lamp dragged across
carved obsidian; the headline scrambles in per-character; a caption parallaxes on an
inertial smooth-scroll.

The module is a self-contained component you `import` into any existing
`portfolio-vN` page (or the bundled demo route). It does not couple to any one version.

## 2. Reference (source of truth)

The technique, shaders, formulas and tuning constants are documented in:

- `docs/obsidian-assembly-study.md` — full teardown + verbatim GLSL (both passes) +
  the `DynamicReliefLampEffect` class internals + tuning defaults.
- `docs/obsidian-assembly-parallax-section2.md` — scroll engine, progress model, and
  the **verified** parallax formula `a = sign·factor·vh·(progress − 0.5)`.

Implementation must follow these documents; this spec does not restate the GLSL.

## 3. Goals / Non-goals

**Goals**

- Faithful, study-accurate port of OA's **raw-WebGL 2-pass relief-lamp pipeline**
  (ping-pong height sim + relief lighting). No R3F re-abstraction, no simplified
  displacement substitute.
- Full OA hero composition: relief canvas + per-character "decode" headline + parallax
  sub-caption + scroll cue + inertial smooth scroll.
- Drop-in reusable module + a demo route to view/verify it.
- OA-grade smoothness discipline (single scroll owner, measure/mutate split,
  IntersectionObserver pause, full GL teardown).
- Accessible: full `prefers-reduced-motion` fallback; no layout-thrash.

**Non-goals**

- No real 3D mesh / R3F scene (the "3D" is the documented flat relief shader on the
  artifact image — confirmed during brainstorm).
- Not a full portfolio page (no pinned case-study sequence, no other sections — that
  was explicitly de-scoped to "signature hero only").
- No CMS/data wiring; text is component props.
- Not modifying any existing `portfolio-vN`.

## 4. Decisions locked in brainstorm

| Topic | Decision |
|---|---|
| Scope | One reusable signature-hero module (+ demo route) |
| 3D technique | Faithful OA relief-lamp (flat image + 2-pass shader), **not** a real mesh |
| Build approach | "The Obsidian Assembly way" — verbatim raw-WebGL class port (not R3F, not simplified) |
| Centerpiece | Generated obsidian booster engine w/ shining **blue gem** core |
| Module contents | Full OA hero composition (relief + decode headline + parallax caption + scroll cue + Lenis) |
| Palette | TMA "Signal" — near-black obsidian, blue/cyan lamp & gem glow |
| Smooth scroll | Lenis (existing dep), single owner, OA-weight lerp (~0.1) |
| Headline anim | GSAP (existing dep), per-char scramble-in |

## 5. Architecture

```
tma-web/
  components/obsidian-hero/
    ObsidianHero.jsx          # 'use client' composition root
    relief/
      ReliefLampEngine.js     # framework-agnostic raw-WebGL class (port of DynamicReliefLampEffect)
      shaders.js              # 3 GLSL sources verbatim from the study (vertex, sim, lighting)
    useReliefLamp.js          # React lifecycle: create/destroy engine, RO/IO, reduced-motion
    useScrollProgress.js      # Lenis-fed progress + ported parallax transform
    DecodeHeadline.jsx        # GSAP per-char scramble-in headline
    obsidian-hero.css         # scoped layout/type/scroll-cue styles
  app/obsidian-hero/page.jsx  # demo / verification route
  public/assets/obsidian-engine.jpg        # locked source artifact (already placed, full-res)
  public/assets/obsidian-engine.webp       # web-optimized (build step, see §9)
  public/assets/obsidian-engine-lqip.webp  # tiny blurred placeholder / reduced-motion still
```

**Layering:** `ReliefLampEngine` is plain JS owning all GL state and the RAF loop. React
(`useReliefLamp`) only mounts the canvas, wires observers, and calls `destroy()` on
unmount. Lenis is the single scroll source; `useScrollProgress` distributes one scroll
value per frame to (a) `engine.setScroll()` and (b) the parallax caption transform.
GSAP is isolated to `DecodeHeadline`.

## 6. Components & interfaces

**`ReliefLampEngine` (class)** — verbatim port of the documented pipeline.

- `constructor(canvas, options)` — WebGL1 ctx `{alpha:false,depth:false,antialias:false,
  premultipliedAlpha:false}`; builds 3 programs, ping-pong height FBOs, fullscreen tri.
- `setImage(url)` — async-decoded texture upload; sets `hasImage`.
- `setScroll(y)` · `setMouse(x,y)` · `resize(w,h)` · `pause()` · `resume()` ·
  `destroy()` (deletes textures/FBOs/programs/buffers, removes listeners, cancels RAF).
- `options` seeded from the study defaults, **re-tuned for this artifact**:
  `repeatX/Y:1` (single image, not tiled), tight intense hotspot
  (`radius`, `mouseLightRadius`, `mouseLightHeight` lowered), `lowColor` near-black,
  `highColor` blue-leaning so glints/gem read cyan, `simScale ≈ 0.4`, `dpr` capped ≤2.
  Exact numbers tuned during implementation against the documented ranges.

**`ObsidianHero` (component)** — `'use client'`. Props (all optional, defaults shown):

- `headline = "Motion in every frame"`
- `caption = "The Motion Agency — Reel 2026"`
- `imageSrc = "/assets/obsidian-engine.webp"`
- `parallaxFactor = 0.1`
- `className` (host layout hook)

Renders: fixed full-viewport `<canvas>` background, `<DecodeHeadline>`, parallax
caption, scroll cue. Composes the two hooks.

**`useReliefLamp(canvasRef, { imageSrc, reducedMotion })`** — creates the engine on
mount, `ResizeObserver` (RAF-debounced) → `engine.resize`, `IntersectionObserver`
(threshold [0,0.01]) → `pause/resume`, passive `mousemove/touchmove` → `setMouse`,
`destroy()` on unmount. No-ops the engine entirely when `reducedMotion`.

**`useScrollProgress({ targetRef, factor, onScroll })`** — owns the Lenis instance (or
consumes a host-provided one if present — see §10 Risks), runs one RAF that reads
`lenis` position, computes element progress, returns the parallax transform string
`translate3d(0, ${sign*factor*vh*(progress-0.5)}px, 0)` (clamped, disabled ≤1024px),
and calls `onScroll(y)` so the engine gets the same value. Measure then mutate.

**`DecodeHeadline`** — splits `text` into per-char spans (kerning preserved), GSAP
timeline scrambles each glyph through random characters → resolves, randomized per-char
stagger. Respects reduced-motion (renders final text, no animation).

## 7. Data flow (per frame)

```
Lenis RAF ──> scroll.current ─┬─> engine.setScroll(y)            (sim+lighting passes use u_scrollY)
                              └─> caption.style.transform = translate3d(0, a, 0)
mousemove (passive) ─────────────> engine.setMouse(x,y)          (cursor lamp)
engine RAF ──> sim pass (ping-pong height) ──> lighting pass ──> canvas
IntersectionObserver off-screen ─> engine.pause()  (RAF cancelled, zero GPU)
```

One scroll value, one source, per frame. Reads (rects/positions) and writes
(transforms) are phase-separated.

## 8. Error handling & fallback

- **No WebGL / context lost:** `ReliefLampEngine` constructor throws → `useReliefLamp`
  catches, sets a `failed` flag → `ObsidianHero` renders the static
  `obsidian-engine.webp` with headline/caption in resolved state. Console-warn once.
- **`prefers-reduced-motion: reduce`:** engine never created; no GSAP scramble; no
  parallax; static image; Lenis disabled (native scroll).
- **Image load failure:** engine sets `hasImage=false` (renders cleared background);
  component still shows text.
- **Unmount mid-animation:** `destroy()` cancels RAF, deletes all GL resources, removes
  all listeners, disconnects observers, destroys Lenis.

## 9. Asset preparation

The locked source `public/assets/obsidian-engine.jpg` is full-res (~7.5 MB) — **must
not ship as-is**. Build/prep step (using `sharp`, already a devDependency):

- `obsidian-engine.webp` — max ~2560px wide, quality ~82, the shader source texture.
- `obsidian-engine-lqip.webp` — ~24px wide, heavily blurred; used as the
  reduced-motion / fallback still and as a decode placeholder.
- Keep the original `.jpg` in repo as the master (or move to a non-shipped assets
  folder — decide in plan).

## 10. Risks & mitigations

- **Lenis ownership conflict:** a host `portfolio-vN` may already run its own Lenis.
  *Mitigation:* `useScrollProgress` detects an existing instance (window/context) and
  consumes it instead of creating a second; demo route creates its own. Define the
  detection contract in the implementation plan.
- **Ping-pong FBO correctness in WebGL1** (float vs RGBA8 height precision): port the
  documented texture setup exactly (`RGBA`/`UNSIGNED_BYTE`, `LINEAR`,
  `CLAMP_TO_EDGE`); validate visually against the OA reference behavior.
- **Next 16 / React 19 client boundary:** the module is `'use client'`; verify dynamic
  import with `ssr:false` per the project's Next 16 conventions (`AGENTS.md` warns the
  Next version differs from training — read `node_modules/next/dist/docs/` before
  coding).
- **Large image jank on first paint:** LQIP + `decoding="async"` + cap DPR.

## 11. Testing

Playwright (project already uses it) on the demo route `app/obsidian-hero/page.jsx`:

1. Canvas mounts and a WebGL context is acquired.
2. Parallax: caption `translateY` matches `sign·factor·vh·(progress−0.5)` at sampled
   scroll offsets, clamps at the extremes (same numeric check used in the study).
3. Reduced-motion emulation: static image shown, no RAF scheduled, no scramble.
4. Unmount: no leaked RAF / listeners / GL warnings.
5. Manual visual pass: cursor wipes the engine + blue gem out of the dark; smooth
   inertial scroll; headline scrambles in.

## 12. Out of scope (future)

Pinned scroll-scrubbed case-study sequence, additional sections, full new
`portfolio-v18` page, CMS-driven content, real 3D mesh variant.

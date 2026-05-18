# Portfolio V16 Cinematic Frame-Sequence Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/portfolio-v16`: a 300vh-pinned, scroll-scrubbed cinematic image-sequence hero rendered on a canvas, with a progress-driven text timeline, a Three.js particle overlay, and a transition into a `FeaturedProjectScaleGallery` placeholder.

**Architecture:** A standalone engine under `tma-web/components/portfolio-v16/` (no dependency on the v14 scene engine). Pure modules (`frameSequence`, `framePreloader`) are TDD'd with `node:test`. A `useV16FrameSequence` hook owns a Canvas2D renderer + tiered preloader + an rAF lerp loop driven by a single GSAP ScrollTrigger pin; Lenis smoothing is reused via the existing shared `SmoothScroll` component. Real frames are converted JPG→WebP by a one-time sharp script; Playwright e2e uses a deterministic procedural source via `?frames=procedural` (mirroring v14).

**Tech Stack:** Next.js 16, React 19, JS/JSX, GSAP + ScrollTrigger, Lenis, Framer Motion, three + @react-three/fiber, sharp (build script), node:test, Playwright.

**Branch:** `feat/portfolio-v16` (already checked out).

**Spec:** `docs/superpowers/specs/2026-05-18-portfolio-v16-cinematic-hero-design.md`

> **All paths below are relative to `tma-web/`** unless they start with `docs/` or `scripts/` shown as `tma-web/scripts/`. All shell commands are run from `tma-web/` unless stated. On this Windows machine use the Bash tool with `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && <cmd>`.

---

## File Structure

**Create:**
- `tma-web/scripts/build-v16-frames.mjs` — one-time JPG→WebP converter (sharp).
- `tma-web/components/portfolio-v16/engine/frameSequence.js` — config constants + pure math (`progressToIndex`, `indexToUrl`, `clamp`, `lerp`, `coverFit`).
- `tma-web/components/portfolio-v16/engine/framePreloader.js` — tiered preloader with injectable loader, graceful skip.
- `tma-web/components/portfolio-v16/engine/canvasRenderer.js` — Canvas2D cover-fit renderer.
- `tma-web/components/portfolio-v16/dev/proceduralFrames.js` — deterministic procedural source for e2e.
- `tma-web/components/portfolio-v16/useV16FrameSequence.js` — hook: renderer + preloader + rAF lerp loop; exposes `window.__v16Debug`.
- `tma-web/components/portfolio-v16/usePrefersReducedMotion.js` — reduced-motion hook.
- `tma-web/components/portfolio-v16/overlays/GradientVignette.jsx`
- `tma-web/components/portfolio-v16/overlays/GrainLayer.jsx`
- `tma-web/components/portfolio-v16/overlays/BlueGlow.jsx`
- `tma-web/components/portfolio-v16/overlays/ParticleField.jsx` — r3f `<Canvas>`, `THREE.Points`, `useFrame` reads a shared progress ref.
- `tma-web/components/portfolio-v16/V16Hero.jsx` — pinned 300vh hero: canvas, overlays, text timeline, loading overlay, ScrollTrigger.
- `tma-web/components/portfolio-v16/V16FeaturedPlaceholder.jsx` — `FEATURED PROJECTS` placeholder.
- `tma-web/components/portfolio-v16/V16Experience.jsx` — composition root: SmoothScroll + hero + featured, css import.
- `tma-web/components/portfolio-v16/v16.css` — keyframes (grain, glow pulse, loader) + reduced-motion overrides.
- `tma-web/app/portfolio-v16/page.jsx` — route + metadata.
- `tma-web/test/v16-frameSequence.test.mjs` — unit tests.
- `tma-web/test/v16-preloader.test.mjs` — unit tests.
- `tma-web/playwright/tests/v16-hero.spec.js` — e2e.
- `tma-web/playwright/tests/v16-reduced-motion.spec.js` — e2e.

**Modify:** none (fully additive).

---

## Task 1: WebP frame build script + generate assets

**Files:**
- Create: `tma-web/scripts/build-v16-frames.mjs`
- Output (generated, committed): `tma-web/public/assets/v16/frames/frame-001.webp` … `frame-192.webp`

- [ ] **Step 1: Write the build script**

Create `tma-web/scripts/build-v16-frames.mjs`:

```js
#!/usr/bin/env node
/**
 * V16 — one-time JPG→WebP converter for the cinematic hero frame sequence.
 *
 * Reads  <repoRoot>/frames/ezgif-frame-001.jpg .. ezgif-frame-192.jpg (1280x720)
 * Writes tma-web/public/assets/v16/frames/frame-001.webp .. frame-192.webp
 *
 * Idempotent: skips a frame whose .webp output already exists. The generated
 * .webp files are committed so production/CI never need the raw frames/ dir.
 *
 * Run with:  node scripts/build-v16-frames.mjs
 */
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"),
  ".."
);
const SRC_DIR = path.join(ROOT, "..", "frames");
const OUT_DIR = path.join(ROOT, "public", "assets", "v16", "frames");
const TOTAL = 192;
const QUALITY = 82;

function pad3(n) {
  return String(n).padStart(3, "0");
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  let converted = 0;
  let skipped = 0;
  for (let i = 1; i <= TOTAL; i++) {
    const src = path.join(SRC_DIR, `ezgif-frame-${pad3(i)}.jpg`);
    const out = path.join(OUT_DIR, `frame-${pad3(i)}.webp`);
    try {
      await fs.access(out);
      skipped++;
      continue;
    } catch {
      /* not present — convert */
    }
    await sharp(src).webp({ quality: QUALITY }).toFile(out);
    converted++;
  }
  console.log(`[v16] frames: ${converted} converted, ${skipped} skipped, ${TOTAL} total → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[v16] frame build failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && node scripts/build-v16-frames.mjs`
Expected stdout: `[v16] frames: 192 converted, 0 skipped, 192 total → ...public/assets/v16/frames`

- [ ] **Step 3: Verify output**

Run: `ls public/assets/v16/frames/ | wc -l && ls public/assets/v16/frames/frame-001.webp public/assets/v16/frames/frame-192.webp && du -sh public/assets/v16/frames/`
Expected: `192`, both files listed, total size ≈ 3–4 MB.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add scripts/build-v16-frames.mjs public/assets/v16/frames
git commit -m "build(v16): JPG→WebP frame pipeline + 192 generated frames"
```

---

## Task 2: `frameSequence.js` pure module (TDD)

**Files:**
- Create: `tma-web/components/portfolio-v16/engine/frameSequence.js`
- Test: `tma-web/test/v16-frameSequence.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v16-frameSequence.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  lerp,
  progressToIndex,
  indexToUrl,
  coverFit,
  TOTAL_FRAMES,
  PAD,
} from "../components/portfolio-v16/engine/frameSequence.js";

test("clamp bounds a value", () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(0.5, 0, 1), 0.5);
});

test("lerp interpolates", () => {
  assert.equal(lerp(0, 10, 0), 0);
  assert.equal(lerp(0, 10, 1), 10);
  assert.equal(lerp(0, 10, 0.5), 5);
});

test("progressToIndex maps clamped progress to a rounded index", () => {
  assert.equal(progressToIndex(0, 192), 0);
  assert.equal(progressToIndex(1, 192), 191);
  assert.equal(progressToIndex(0.5, 101), 50);
  assert.equal(progressToIndex(-2, 192), 0);
  assert.equal(progressToIndex(9, 192), 191);
  assert.equal(progressToIndex(0.5, 0), 0);
});

test("indexToUrl zero-pads and uses the configured path/ext", () => {
  assert.equal(indexToUrl(0), "/assets/v16/frames/frame-001.webp");
  assert.equal(indexToUrl(191), "/assets/v16/frames/frame-192.webp");
  assert.equal(PAD, 3);
  assert.equal(TOTAL_FRAMES, 192);
});

test("coverFit centers and scales to cover the destination", () => {
  const r = coverFit(100, 100, 200, 100);
  assert.equal(r.dw, 200);
  assert.equal(r.dh, 200);
  assert.equal(r.dx, 0);
  assert.equal(r.dy, -50);
  const z = coverFit(0, 0, 200, 100);
  assert.deepEqual(z, { dx: 0, dy: 0, dw: 200, dh: 100 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && node --test test/v16-frameSequence.test.mjs`
Expected: FAIL — `Cannot find module .../engine/frameSequence.js`.

- [ ] **Step 3: Write the implementation**

Create `tma-web/components/portfolio-v16/engine/frameSequence.js`:

```js
// V16 frame-sequence configuration + pure helpers.
// Pure module: no DOM, no React — safe to unit-test under node:test.

export const TOTAL_FRAMES = 192;
export const FRAME_PATH = "/assets/v16/frames/frame-";
export const FRAME_EXT = "webp";
export const PAD = 3;

export const PIN_VIEWPORTS = 3; // 300vh pin
export const SCRUB_EASE = 0.12; // displayed → target lerp per rAF tick
export const PRELOAD_PRIORITY = 30; // loading gate clears after first N decoded
export const PRELOAD_CONCURRENCY = 6; // background fetch parallelism
export const EXPLOSION_RANGE = [0.58, 0.7]; // glow + screen-shake band

export const TEXT_BEATS = {
  label: 0.08, // THE MOTION AGENCY
  headline1: 0.2, // WE DON'T BUILD BRANDS.
  headline2: 0.38, // WE RELEASE MOMENTUM.
  explosion: 0.62, // glow + screen shake (band center)
  fadeOut: 0.82, // hero text fades, frames dominate
  archive: 0.92, // ENTER THE ARCHIVE
};

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function progressToIndex(progress, total = TOTAL_FRAMES) {
  if (total <= 0) return 0;
  const p = clamp(progress, 0, 1);
  return Math.round(p * (total - 1));
}

export function indexToUrl(
  index,
  { path = FRAME_PATH, ext = FRAME_EXT, pad = PAD } = {}
) {
  return `${path}${String(index + 1).padStart(pad, "0")}.${ext}`;
}

// object-fit: cover for canvas drawImage. Returns the dest rect.
export function coverFit(sw, sh, dw, dh) {
  if (!sw || !sh) return { dx: 0, dy: 0, dw, dh };
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  return { dx: (dw - w) / 2, dy: (dh - h) / 2, dw: w, dh: h };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && node --test test/v16-frameSequence.test.mjs`
Expected: PASS — all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/engine/frameSequence.js test/v16-frameSequence.test.mjs
git commit -m "feat(v16): frameSequence config + pure math (TDD)"
```

---

## Task 3: `framePreloader.js` (TDD)

**Files:**
- Create: `tma-web/components/portfolio-v16/engine/framePreloader.js`
- Test: `tma-web/test/v16-preloader.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v16-preloader.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createFramePreloader } from "../components/portfolio-v16/engine/framePreloader.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

test("priority frames resolve the gate, then background frames load", async () => {
  const loaded = [];
  const pre = createFramePreloader({
    total: 10,
    priority: 4,
    concurrency: 2,
    load: async (i) => {
      loaded.push(i);
      return { id: i, width: 1280, height: 720 };
    },
  });
  pre.start();
  await pre.whenPriorityReady();
  for (let i = 0; i < 4; i++) assert.equal(pre.has(i), true, `priority ${i} ready`);
  // drain background
  for (let k = 0; k < 20 && pre.stats().loaded < 10; k++) await tick();
  assert.equal(pre.stats().loaded, 10);
  assert.deepEqual(pre.getBitmap(7), { id: 7, width: 1280, height: 720 });
});

test("a failing frame is skipped, warns once, others still load", async () => {
  const origWarn = console.warn;
  let warnCount = 0;
  console.warn = () => {
    warnCount++;
  };
  try {
    const pre = createFramePreloader({
      total: 5,
      priority: 5,
      concurrency: 2,
      load: async (i) => {
        if (i === 2) throw new Error("boom");
        return { id: i, width: 10, height: 10 };
      },
    });
    pre.start();
    await pre.whenPriorityReady();
    for (let k = 0; k < 20 && pre.stats().loaded < 4; k++) await tick();
    assert.equal(pre.has(2), false);
    assert.equal(pre.has(3), true);
    assert.equal(pre.stats().failed, 1);
    assert.equal(pre.stats().loaded, 4);
    assert.equal(warnCount, 1);
  } finally {
    console.warn = origWarn;
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && node --test test/v16-preloader.test.mjs`
Expected: FAIL — `Cannot find module .../engine/framePreloader.js`.

- [ ] **Step 3: Write the implementation**

Create `tma-web/components/portfolio-v16/engine/framePreloader.js`:

```js
import {
  TOTAL_FRAMES,
  PRELOAD_PRIORITY,
  PRELOAD_CONCURRENCY,
  indexToUrl,
} from "./frameSequence.js";

// Default browser loader: fetch → decode to ImageBitmap.
async function defaultLoad(index) {
  const res = await fetch(indexToUrl(index));
  if (!res.ok) throw new Error(`HTTP ${res.status} for frame ${index}`);
  return createImageBitmap(await res.blob());
}

/**
 * Tiered frame preloader.
 *   - priority block (0..priority-1) loads first; whenPriorityReady() resolves
 *     once that block has settled (loaded or failed).
 *   - remaining frames load in the background, concurrency-capped.
 *   - a frame that throws is skipped (held, warned once), never aborts the run.
 *
 * `load` is injectable for tests; defaults to fetch+createImageBitmap.
 */
export function createFramePreloader(opts = {}) {
  const {
    total = TOTAL_FRAMES,
    priority = PRELOAD_PRIORITY,
    concurrency = PRELOAD_CONCURRENCY,
    load = defaultLoad,
  } = opts;

  const bitmaps = new Map();
  const failed = new Set();
  let warned = false;
  let resolvePriority;
  const priorityReady = new Promise((r) => {
    resolvePriority = r;
  });

  async function loadOne(i) {
    if (bitmaps.has(i) || failed.has(i)) return;
    try {
      bitmaps.set(i, await load(i));
    } catch (err) {
      failed.add(i);
      if (!warned) {
        console.warn("[v16] frame load failed; skipping", err);
        warned = true;
      }
    }
  }

  async function runQueue(indices) {
    let cursor = 0;
    const lanes = Math.max(1, Math.min(concurrency, indices.length || 1));
    await Promise.all(
      Array.from({ length: lanes }, async () => {
        while (cursor < indices.length) {
          await loadOne(indices[cursor++]);
        }
      })
    );
  }

  async function start() {
    const pri = Math.min(priority, total);
    await runQueue(Array.from({ length: pri }, (_, i) => i));
    resolvePriority();
    const rest = [];
    for (let i = pri; i < total; i++) rest.push(i);
    runQueue(rest); // background — intentionally not awaited
  }

  return {
    start,
    whenPriorityReady: () => priorityReady,
    getBitmap: (i) => bitmaps.get(i),
    has: (i) => bitmaps.has(i),
    stats: () => ({ loaded: bitmaps.size, failed: failed.size, total }),
    destroy() {
      for (const b of bitmaps.values()) {
        if (b && typeof b.close === "function") b.close();
      }
      bitmaps.clear();
      failed.clear();
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && node --test test/v16-preloader.test.mjs`
Expected: PASS — both tests pass.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/engine/framePreloader.js test/v16-preloader.test.mjs
git commit -m "feat(v16): tiered frame preloader with graceful skip (TDD)"
```

---

## Task 4: `canvasRenderer.js` + procedural source

**Files:**
- Create: `tma-web/components/portfolio-v16/engine/canvasRenderer.js`
- Create: `tma-web/components/portfolio-v16/dev/proceduralFrames.js`

No unit test: both are browser-canvas glue. The cover-fit math they rely on is already covered by Task 2; integrated behavior is covered by Playwright in Task 11.

- [ ] **Step 1: Write `canvasRenderer.js`**

Create `tma-web/components/portfolio-v16/engine/canvasRenderer.js`:

```js
import { coverFit } from "./frameSequence.js";

/**
 * Canvas2D renderer. mount() once, resize() on layout change, draw(source)
 * per frame. `source` is any CanvasImageSource with numeric width/height
 * (ImageBitmap or HTMLCanvasElement). Paints object-fit: cover, no stretch.
 */
export function createCanvasRenderer() {
  let canvas = null;
  let ctx = null;

  return {
    mount(el) {
      canvas = el;
      ctx = el.getContext("2d", { alpha: false });
    },
    resize(w, h, dpr = 1) {
      if (!canvas) return;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    },
    draw(source) {
      if (!ctx || !canvas || !source) return;
      const dw = canvas.width;
      const dh = canvas.height;
      const f = coverFit(source.width, source.height, dw, dh);
      ctx.clearRect(0, 0, dw, dh);
      ctx.drawImage(source, f.dx, f.dy, f.dw, f.dh);
    },
    destroy() {
      canvas = null;
      ctx = null;
    },
  };
}
```

- [ ] **Step 2: Write `proceduralFrames.js`**

Create `tma-web/components/portfolio-v16/dev/proceduralFrames.js`:

```js
// Deterministic offscreen "film" for e2e: a frame-index counter + a dot that
// travels left→right, so Playwright can assert that frames advance with scroll.
// Mirrors the v14 procedural-source pattern.
export function createV16ProceduralSource(count = 192) {
  const W = 1280;
  const H = 720;
  const cache = new Map();

  function drawProcedural(index) {
    if (cache.has(index)) return cache.get(index);
    const cv =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(W, H)
        : Object.assign(document.createElement("canvas"), { width: W, height: H });
    const ctx = cv.getContext("2d");
    const t = count > 1 ? index / (count - 1) : 0;
    const hue = Math.round(210 + t * 40); // electric-blue band
    ctx.fillStyle = `hsl(${hue}, 80%, ${8 + t * 10}%)`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(120,180,255,0.95)";
    ctx.font = "bold 220px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index), W / 2, H / 2);
    ctx.beginPath();
    ctx.arc(40 + t * (W - 80), H - 60, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#7db4ff";
    ctx.fill();
    cache.set(index, cv);
    return cv;
  }

  return { count, width: W, height: H, drawProcedural };
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/engine/canvasRenderer.js components/portfolio-v16/dev/proceduralFrames.js
git commit -m "feat(v16): canvas2D cover-fit renderer + procedural e2e source"
```

---

## Task 5: `usePrefersReducedMotion` + `useV16FrameSequence` hook

**Files:**
- Create: `tma-web/components/portfolio-v16/usePrefersReducedMotion.js`
- Create: `tma-web/components/portfolio-v16/useV16FrameSequence.js`

- [ ] **Step 1: Write `usePrefersReducedMotion.js`**

Create `tma-web/components/portfolio-v16/usePrefersReducedMotion.js`:

```js
"use client";
import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: Write `useV16FrameSequence.js`**

Create `tma-web/components/portfolio-v16/useV16FrameSequence.js`:

```js
"use client";
import { useEffect, useRef, useState } from "react";
import {
  TOTAL_FRAMES,
  SCRUB_EASE,
  progressToIndex,
  lerp,
  indexToUrl,
} from "./engine/frameSequence.js";
import { createCanvasRenderer } from "./engine/canvasRenderer.js";
import { createFramePreloader } from "./engine/framePreloader.js";
import { createV16ProceduralSource } from "./dev/proceduralFrames.js";

/**
 * Owns the canvas renderer + tiered preloader + the rAF lerp loop.
 *
 * Returns:
 *   canvasRef         attach to <canvas>
 *   setTargetProgress (p) — call from ScrollTrigger onUpdate (no React state)
 *   ready             boolean — true once the priority block is decoded
 *
 * Frame index is driven by an eased "displayed" progress for a weighty,
 * premium scrub. Exposes window.__v16Debug for e2e (mirrors v14).
 */
export function useV16FrameSequence({ onReady } = {}) {
  const canvasRef = useRef(null);
  const targetRef = useRef(0);
  const displayedRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const procedural =
      new URLSearchParams(window.location.search).get("frames") === "procedural";
    const proc = procedural ? createV16ProceduralSource(TOTAL_FRAMES) : null;

    const renderer = createCanvasRenderer();
    renderer.mount(canvas);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sizeToParent = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      renderer.resize(r.width, r.height, dpr);
    };
    sizeToParent();

    const preloader = createFramePreloader({
      total: TOTAL_FRAMES,
      load: proc
        ? async (i) => proc.drawProcedural(i)
        : undefined, // default fetch+ImageBitmap loader (real WebP frames)
    });

    const debug = { drawCount: 0, frameIndex: -1, count: TOTAL_FRAMES, ready: false };
    window.__v16Debug = debug;

    let lastDrawn = -1;
    let lastGood = null;
    let rafId = 0;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      displayedRef.current = lerp(displayedRef.current, targetRef.current, SCRUB_EASE);
      const index = progressToIndex(displayedRef.current, TOTAL_FRAMES);
      if (index !== lastDrawn) {
        const frame = preloader.getBitmap(index) || lastGood;
        if (frame) {
          renderer.draw(frame);
          lastGood = frame;
          lastDrawn = index;
          debug.drawCount += 1;
          debug.frameIndex = index;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    preloader.start();
    preloader.whenPriorityReady().then(() => {
      if (!alive) return;
      // paint the first frame immediately even before the loop catches it
      const first = preloader.getBitmap(0);
      if (first) {
        renderer.draw(first);
        lastGood = first;
      }
      debug.ready = true;
      setReady(true);
      onReady?.();
    });
    rafId = requestAnimationFrame(tick);

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        sizeToParent();
        if (lastGood) renderer.draw(lastGood);
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRaf);
      preloader.destroy();
      renderer.destroy();
      if (window.__v16Debug === debug) delete window.__v16Debug;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    canvasRef,
    ready,
    setTargetProgress: (p) => {
      targetRef.current = p;
    },
  };
}
```

> Note: `indexToUrl` is imported only to keep the module's public surface explicit alongside the engine; the default loader inside `framePreloader.js` already uses it. Leaving the import is harmless, but if a lint "no-unused-vars" error blocks the commit, remove `indexToUrl` from this file's import list.

- [ ] **Step 3: Sanity-check the dev build compiles**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && node --check components/portfolio-v16/useV16FrameSequence.js && node --check components/portfolio-v16/usePrefersReducedMotion.js`
Expected: no output (syntax OK).

- [ ] **Step 4: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/useV16FrameSequence.js components/portfolio-v16/usePrefersReducedMotion.js
git commit -m "feat(v16): frame-sequence hook (rAF lerp loop) + reduced-motion hook"
```

---

## Task 6: Static overlays + `v16.css`

**Files:**
- Create: `tma-web/components/portfolio-v16/overlays/GradientVignette.jsx`
- Create: `tma-web/components/portfolio-v16/overlays/GrainLayer.jsx`
- Create: `tma-web/components/portfolio-v16/overlays/BlueGlow.jsx`
- Create: `tma-web/components/portfolio-v16/v16.css`

- [ ] **Step 1: Write `v16.css`**

Create `tma-web/components/portfolio-v16/v16.css`:

```css
/* === Portfolio V16 — cinematic hero === */
.v16-root { background: #000; color: #fff; }

@keyframes v16-grain {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-6%, -6%, 0); }
}
@keyframes v16-glow-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.85; }
}
@keyframes v16-loader-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.96); }
  50% { opacity: 0.9; transform: scale(1.04); }
}

.v16-grain {
  position: absolute; inset: -50%;
  background-image: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>\
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/>\
<feColorMatrix type='saturate' values='0'/></filter>\
<rect width='120' height='120' filter='url(%23n)' opacity='0.4'/></svg>");
  mix-blend-mode: overlay;
  opacity: 0.12;
  animation: v16-grain 1.2s steps(3) infinite;
  pointer-events: none;
}
.v16-loader-glow { animation: v16-loader-pulse 2s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .v16-grain { animation: none; }
  .v16-loader-glow { animation: none; opacity: 0.6; }
}
```

- [ ] **Step 2: Write `GradientVignette.jsx`**

Create `tma-web/components/portfolio-v16/overlays/GradientVignette.jsx`:

```jsx
"use client";
export default function GradientVignette() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </>
  );
}
```

- [ ] **Step 3: Write `GrainLayer.jsx`**

Create `tma-web/components/portfolio-v16/overlays/GrainLayer.jsx`:

```jsx
"use client";
export default function GrainLayer() {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      <div className="v16-grain" />
    </div>
  );
}
```

- [ ] **Step 4: Write `BlueGlow.jsx`**

Create `tma-web/components/portfolio-v16/overlays/BlueGlow.jsx`:

```jsx
"use client";
import { forwardRef } from "react";

// Soft electric-blue glow. Parent applies mouse-parallax transform via ref.
const BlueGlow = forwardRef(function BlueGlow(_props, ref) {
  return (
    <div
      ref={ref}
      aria-hidden
      className="v16-loader-glow"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        willChange: "transform",
        background:
          "radial-gradient(40% 38% at 50% 46%, rgba(56,132,255,0.32) 0%, rgba(56,132,255,0.10) 45%, rgba(0,0,0,0) 72%)",
      }}
    />
  );
});

export default BlueGlow;
```

- [ ] **Step 5: Sanity-check syntax**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && node --check components/portfolio-v16/overlays/GradientVignette.jsx 2>/dev/null || echo "jsx (expected: node --check cannot parse JSX; that is OK — Next compiles it)"`
Expected: the echo line prints (JSX is not plain JS; real validation happens in Task 11's dev build).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/overlays components/portfolio-v16/v16.css
git commit -m "feat(v16): static overlays (gradient/vignette/grain/blue-glow) + css"
```

---

## Task 7: `ParticleField.jsx` (Three.js / r3f)

**Files:**
- Create: `tma-web/components/portfolio-v16/overlays/ParticleField.jsx`

- [ ] **Step 1: Write `ParticleField.jsx`**

Create `tma-web/components/portfolio-v16/overlays/ParticleField.jsx`:

```jsx
"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EXPLOSION_RANGE } from "../engine/frameSequence.js";

const COUNT = 1800;
const [BAND_LO, BAND_HI] = EXPLOSION_RANGE;

function Debris({ progressRef }) {
  const pointsRef = useRef(null);

  const { positions, radii } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const radii = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 1.2 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      radii[i] = r;
    }
    return { positions, radii };
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  useFrame((_state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const p = progressRef.current || 0;
    // explosion band → 0..1 push factor (ramps in, decays out)
    const band =
      p <= BAND_LO || p >= BAND_HI
        ? 0
        : 1 - Math.abs((p - (BAND_LO + BAND_HI) / 2) / ((BAND_HI - BAND_LO) / 2));
    const push = 1 + band * 0.9;
    const arr = pts.geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const baseR = radii[i];
      const k = (baseR * push) / baseR;
      arr[i * 3] = positions[i * 3] * k;
      arr[i * 3 + 1] = positions[i * 3 + 1] * k;
      arr[i * 3 + 2] = positions[i * 3 + 2] * k;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.rotation.y += delta * 0.04;
    const mat = pts.material;
    mat.opacity = 0.18 + p * 0.22 + band * 0.5;
    mat.size = 0.018 + band * 0.03;
  });

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial
        color={"#5aa6ff"}
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0.2}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Transparent r3f overlay. progressRef is the live scroll progress (0..1).
export default function ParticleField({ progressRef }) {
  return (
    <div
      aria-hidden
      data-v16-particles
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 9], fov: 55 }}
        style={{ background: "transparent" }}
      >
        <Debris progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/overlays/ParticleField.jsx
git commit -m "feat(v16): three.js r3f particle/debris overlay with explosion burst"
```

---

## Task 8: `V16Hero.jsx` — pinned hero + text timeline + ScrollTrigger

**Files:**
- Create: `tma-web/components/portfolio-v16/V16Hero.jsx`

- [ ] **Step 1: Write `V16Hero.jsx`**

Create `tma-web/components/portfolio-v16/V16Hero.jsx`:

```jsx
"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useV16FrameSequence } from "./useV16FrameSequence";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { TEXT_BEATS, EXPLOSION_RANGE, PIN_VIEWPORTS } from "./engine/frameSequence.js";
import GradientVignette from "./overlays/GradientVignette";
import GrainLayer from "./overlays/GrainLayer";
import BlueGlow from "./overlays/BlueGlow";
import ParticleField from "./overlays/ParticleField";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const B = TEXT_BEATS;
const [BAND_LO, BAND_HI] = EXPLOSION_RANGE;

export default function V16Hero() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const glowRef = useRef(null);
  const shakeRef = useRef(null);
  const progressRef = useRef(0); // live scroll progress for ParticleField
  const progress = useMotionValue(reduced ? 1 : 0);

  const { canvasRef, ready, setTargetProgress } = useV16FrameSequence({
    onReady: () => ScrollTrigger.refresh(),
  });

  // text beats: reveal in, hold, fade at fadeOut beat (archive stays)
  const labelOpacity = useTransform(progress, [B.label, B.label + 0.04, B.fadeOut, B.fadeOut + 0.05], [0, 1, 1, 0]);
  const labelY = useTransform(progress, [B.label, B.label + 0.04], [18, 0]);
  const h1Opacity = useTransform(progress, [B.headline1, B.headline1 + 0.05, B.fadeOut, B.fadeOut + 0.05], [0, 1, 1, 0]);
  const h1Y = useTransform(progress, [B.headline1, B.headline1 + 0.05], [40, 0]);
  const h2Opacity = useTransform(progress, [B.headline2, B.headline2 + 0.05, B.fadeOut, B.fadeOut + 0.05], [0, 1, 1, 0]);
  const h2Y = useTransform(progress, [B.headline2, B.headline2 + 0.05], [40, 0]);
  const archiveOpacity = useTransform(progress, [B.archive, B.archive + 0.04], [0, 1]);
  const archiveY = useTransform(progress, [B.archive, B.archive + 0.04], [16, 0]);
  const headlineGlow = useTransform(
    progress,
    [BAND_LO, (BAND_LO + BAND_HI) / 2, BAND_HI],
    ["0 0 0px rgba(90,166,255,0)", "0 0 26px rgba(90,166,255,0.85)", "0 0 0px rgba(90,166,255,0)"]
  );

  // ScrollTrigger pin + scrub. Reduced motion: no pin, static last frame.
  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${PIN_VIEWPORTS * 100}%`,
        pin: stickyRef.current,
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;
          progress.set(p);
          setTargetProgress(p);
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced, progress, setTargetProgress]);

  // reduced motion: pin off → drive frame engine to the last frame once
  useEffect(() => {
    if (reduced) {
      setTargetProgress(1);
      progressRef.current = 1;
    }
  }, [reduced, setTargetProgress]);

  // explosion-band screen shake (transform only, decays at band edges)
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const loop = () => {
      const p = progressRef.current;
      const el = shakeRef.current;
      if (el) {
        let amp = 0;
        if (p > BAND_LO && p < BAND_HI) {
          const mid = (BAND_LO + BAND_HI) / 2;
          amp = (1 - Math.abs((p - mid) / ((BAND_HI - BAND_LO) / 2))) * 7;
        }
        const t = performance.now() / 1000;
        el.style.transform = `translate3d(${Math.sin(t * 47) * amp}px, ${Math.cos(t * 53) * amp}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // subtle mouse parallax on the blue glow (disabled under reduced motion)
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 26;
        const y = (e.clientY / window.innerHeight - 0.5) * 26;
        if (glowRef.current) glowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const textBaseStyle = {
    margin: 0,
    fontFamily: "var(--display)",
    color: "#fff",
    textTransform: "uppercase",
  };

  return (
    <section
      ref={sectionRef}
      data-v16-hero
      style={{ position: "relative", height: `${(PIN_VIEWPORTS + 1) * 100}vh`, background: "#000" }}
    >
      <div
        ref={stickyRef}
        style={{
          position: "relative",
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <div ref={shakeRef} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
          <canvas
            ref={canvasRef}
            data-v16-canvas
            style={{ display: "block", width: "100%", height: "100%" }}
          />
          <GradientVignette />
          <BlueGlow ref={glowRef} />
          <GrainLayer />
          {!reduced && <ParticleField progressRef={progressRef} />}

          {/* loading overlay — matte black + soft blue glow until priority frames decode */}
          {!ready && (
            <div
              data-v16-loading
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "#000",
                zIndex: 5,
              }}
            >
              <div
                className="v16-loader-glow"
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(56,132,255,0.45) 0%, rgba(56,132,255,0) 70%)",
                }}
              />
            </div>
          )}

          {/* text layer */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 6vw",
              zIndex: 6,
              pointerEvents: "none",
            }}
          >
            <motion.p
              style={{
                ...textBaseStyle,
                opacity: reduced ? 1 : labelOpacity,
                y: reduced ? 0 : labelY,
                letterSpacing: "0.42em",
                fontSize: "clamp(11px, 1vw, 14px)",
                marginBottom: "clamp(18px, 3vh, 36px)",
                color: "#7db4ff",
              }}
            >
              THE MOTION AGENCY
            </motion.p>
            <motion.h2
              style={{
                ...textBaseStyle,
                opacity: reduced ? 1 : h1Opacity,
                y: reduced ? 0 : h1Y,
                textShadow: reduced ? "none" : headlineGlow,
                fontWeight: 800,
                lineHeight: 1.02,
                fontSize: "clamp(34px, 6.4vw, 104px)",
              }}
            >
              WE DON&rsquo;T BUILD BRANDS.
            </motion.h2>
            <motion.h2
              style={{
                ...textBaseStyle,
                opacity: reduced ? 1 : h2Opacity,
                y: reduced ? 0 : h2Y,
                textShadow: reduced ? "none" : headlineGlow,
                fontWeight: 800,
                lineHeight: 1.02,
                fontSize: "clamp(34px, 6.4vw, 104px)",
              }}
            >
              WE RELEASE MOMENTUM.
            </motion.h2>
            <motion.p
              data-v16-archive
              style={{
                ...textBaseStyle,
                opacity: reduced ? 1 : archiveOpacity,
                y: reduced ? 0 : archiveY,
                letterSpacing: "0.34em",
                fontSize: "clamp(12px, 1.1vw, 16px)",
                marginTop: "clamp(28px, 5vh, 60px)",
                color: "#7db4ff",
              }}
            >
              ENTER THE ARCHIVE
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/V16Hero.jsx
git commit -m "feat(v16): pinned hero — canvas, overlays, text timeline, scrub, shake"
```

---

## Task 9: `V16FeaturedPlaceholder.jsx`

**Files:**
- Create: `tma-web/components/portfolio-v16/V16FeaturedPlaceholder.jsx`

- [ ] **Step 1: Write `V16FeaturedPlaceholder.jsx`**

Create `tma-web/components/portfolio-v16/V16FeaturedPlaceholder.jsx`:

```jsx
"use client";
// FeaturedProjectScaleGallery placeholder. The data-v16-featured-gallery hook
// is the wiring point for a real scroll-scale gallery later — do not rename it.
export default function V16FeaturedPlaceholder() {
  return (
    <section
      data-v16-featured
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "clamp(64px, 12vh, 160px) 6vw",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(32px, 6vh, 80px)",
      }}
    >
      {/* energy guide: faint vertical streak echoing the hero debris */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: 2,
          height: "22vh",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to bottom, rgba(90,166,255,0) 0%, rgba(90,166,255,0.5) 60%, rgba(90,166,255,0) 100%)",
          pointerEvents: "none",
        }}
      />
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--display)",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          lineHeight: 0.98,
          fontSize: "clamp(40px, 9vw, 160px)",
        }}
      >
        Featured Projects
      </h2>
      <div
        data-v16-featured-gallery
        style={{
          flex: 1,
          minHeight: "48vh",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--mono)",
          fontSize: 13,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Scroll-scale gallery — coming soon
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/V16FeaturedPlaceholder.jsx
git commit -m "feat(v16): FeaturedProjectScaleGallery placeholder section"
```

---

## Task 10: `V16Experience.jsx` composition root + route

**Files:**
- Create: `tma-web/components/portfolio-v16/V16Experience.jsx`
- Create: `tma-web/app/portfolio-v16/page.jsx`

- [ ] **Step 1: Write `V16Experience.jsx`**

Create `tma-web/components/portfolio-v16/V16Experience.jsx`:

```jsx
"use client";
import "./v16.css";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import V16Hero from "./V16Hero";
import V16FeaturedPlaceholder from "./V16FeaturedPlaceholder";

// SmoothScroll wires Lenis ↔ GSAP ticker ↔ ScrollTrigger and early-returns
// under prefers-reduced-motion (no Lenis), which is exactly the V16 contract.
export default function V16Experience() {
  return (
    <div className="v16-root" data-v16-root>
      <SmoothScroll />
      <V16Hero />
      <V16FeaturedPlaceholder />
    </div>
  );
}
```

- [ ] **Step 2: Write the route**

Create `tma-web/app/portfolio-v16/page.jsx`:

```jsx
import V16Experience from "@/components/portfolio-v16/V16Experience";

export const metadata = {
  title: "Portfolio V16 — The Motion Agency",
  description:
    "A scroll-controlled cinematic frame sequence. Built with GSAP ScrollTrigger, Lenis, Framer Motion and a Three.js particle overlay.",
};

export default function PortfolioV16Page() {
  return (
    <main className="v16-page">
      <V16Experience />
    </main>
  );
}
```

- [ ] **Step 3: Verify dev build serves the route**

Run (background): `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && npm run dev`
Then: `sleep 8 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/portfolio-v16`
Expected: `200`. Stop the dev server after (it is restarted in Task 11).

- [ ] **Step 4: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add components/portfolio-v16/V16Experience.jsx app/portfolio-v16/page.jsx
git commit -m "feat(v16): experience composition root + /portfolio-v16 route"
```

---

## Task 11: Playwright e2e (hero + reduced-motion)

**Files:**
- Create: `tma-web/playwright/tests/v16-hero.spec.js`
- Create: `tma-web/playwright/tests/v16-reduced-motion.spec.js`

> e2e runs against a local dev server. Start `npm run dev` and point Playwright at it with `PLAYWRIGHT_BASE_URL=http://localhost:3000` (the config defaults to the live host otherwise).

- [ ] **Step 1: Write `v16-hero.spec.js`**

Create `tma-web/playwright/tests/v16-hero.spec.js`:

```js
import { test, expect } from "@playwright/test";

test("v16 route renders the experience root and a non-blank canvas", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v16?frames=procedural");
  await expect(page.locator("[data-v16-root]")).toBeVisible();
  await page.locator("[data-v16-canvas]").waitFor();
  // priority frames decode → debug.ready flips and loading overlay detaches
  await expect.poll(() => page.evaluate(() => window.__v16Debug?.ready === true)).toBe(true);
  await expect(page.locator("[data-v16-loading]")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("scrolling scrubs the frame index forward, throttled by rAF", async ({ page }) => {
  await page.goto("/portfolio-v16?frames=procedural");
  await page.locator("[data-v16-canvas]").waitFor();
  await expect.poll(() => page.evaluate(() => window.__v16Debug?.ready === true)).toBe(true);

  const samples = [];
  for (let y = 0; y <= 12000; y += 1500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(300);
    samples.push(await page.evaluate(() => ({ ...window.__v16Debug })));
  }
  const idx = samples.map((s) => s.frameIndex);
  for (let i = 1; i < idx.length; i++) {
    expect(idx[i]).toBeGreaterThanOrEqual(idx[i - 1]);
  }
  expect(idx[idx.length - 1]).toBeGreaterThan(idx[0]);
  const last = samples[samples.length - 1];
  expect(last.drawCount).toBeLessThanOrEqual(last.count + 8); // throttle proof
});

test("text beats reveal and the featured section is reachable", async ({ page }) => {
  await page.goto("/portfolio-v16?frames=procedural");
  await page.locator("[data-v16-canvas]").waitFor();
  await expect.poll(() => page.evaluate(() => window.__v16Debug?.ready === true)).toBe(true);

  // early scroll → label visible
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(400);
  await expect(page.getByText("THE MOTION AGENCY")).toBeVisible();

  // deep scroll → archive line opacity rises
  await page.evaluate(() => window.scrollTo(0, 11500));
  await page.waitForTimeout(500);
  const archiveOpacity = await page.evaluate(() => {
    const el = document.querySelector("[data-v16-archive]");
    return el ? parseFloat(getComputedStyle(el).opacity) : -1;
  });
  expect(archiveOpacity).toBeGreaterThan(0.3);

  // past the pin → featured placeholder
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator("[data-v16-featured]").scrollIntoViewIfNeeded();
  await expect(page.getByText("Featured Projects")).toBeVisible();
});
```

- [ ] **Step 2: Write `v16-reduced-motion.spec.js`**

Create `tma-web/playwright/tests/v16-reduced-motion.spec.js`:

```js
import { test, expect } from "@playwright/test";

test("reduced motion: static frame, all hero text visible, no r3f canvas, scrollable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v16?frames=procedural");

  await expect(page.locator("[data-v16-root]")).toBeVisible();
  // all hero text is shown immediately (no scrub gating)
  await expect(page.getByText("THE MOTION AGENCY")).toBeVisible();
  await expect(page.getByText("WE RELEASE MOMENTUM.")).toBeVisible();
  await expect(page.locator("[data-v16-archive]")).toBeVisible();

  // r3f particle canvas is not mounted under reduced motion
  await expect(page.locator("[data-v16-particles]")).toHaveCount(0);

  // no pin trap — document scrolls and the featured section is reachable
  await page.locator("[data-v16-featured]").scrollIntoViewIfNeeded();
  await expect(page.getByText("Featured Projects")).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 3: Start the dev server (background)**

Run (background): `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && npm run dev`
Wait, then verify: `sleep 8 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/portfolio-v16` → expect `200`.

- [ ] **Step 4: Run the v16 e2e specs against local**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v16-hero.spec.js playwright/tests/v16-reduced-motion.spec.js --project=desktop-1920`
Expected: all tests PASS. If a frame-advance assertion is flaky on a slow machine, increase the per-step `waitForTimeout` to 450ms and re-run — do not weaken the monotonic/`>` assertions.

- [ ] **Step 5: Stop the dev server**

Stop the background `npm run dev` process.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git add playwright/tests/v16-hero.spec.js playwright/tests/v16-reduced-motion.spec.js
git commit -m "test(v16): e2e — scrub, text beats, featured reachable, reduced motion"
```

---

## Task 12: Full verification + finalize

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && npm test`
Expected: all tests pass, including `v16-frameSequence` and `v16-preloader` (existing v12/v14 suites must remain green).

- [ ] **Step 2: Production build sanity**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && npm run build`
Expected: build succeeds; `/portfolio-v16` appears in the route output with no errors.

- [ ] **Step 3: Re-run v16 e2e once more for stability**

Start `npm run dev` (background), then:
Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v16-hero.spec.js playwright/tests/v16-reduced-motion.spec.js --project=desktop-1920`
Expected: all PASS. Stop the dev server.

- [ ] **Step 4: Final commit (only if anything changed)**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web
git status --porcelain
# if clean, nothing to do; otherwise:
git add -A && git commit -m "chore(v16): verification pass — unit + build + e2e green"
```

---

## Self-Review

**1. Spec coverage:**
- §3 asset pipeline → Task 1. ✅
- §4 architecture (every module in the table) → Tasks 2–10 (one module per step). ✅
- §5 config block constants → Task 2 `frameSequence.js` (TOTAL_FRAMES, FRAME_PATH, FRAME_EXT, PAD, PIN_VIEWPORTS, SCRUB_EASE, PRELOAD_PRIORITY, PRELOAD_CONCURRENCY, EXPLOSION_RANGE, TEXT_BEATS). ✅
- §6 scroll→frame flow (single ScrollTrigger, ref-only progress, lerp, Lenis reuse, refresh after priority, cleanup) → Task 8 + Task 5 + Task 10. ✅
- §7 preload tiers (frame 1 immediate, gate at 30, background, skip-on-fail) → Task 3 + Task 5 (`whenPriorityReady` paints frame 0). ✅
- §8 timeline beats (0.08/0.20/0.38/0.58–0.70/0.82/0.92, transform+opacity only, shake, parallax) → Task 8. ✅
- §9 transition → Task 9 (vertical streak guide + placeholder). ✅
- §10 overlay stack order → Task 8 render order (canvas → gradient/vignette → glow → grain → particles → text). ✅
- §11 reduced motion (no Lenis via SmoothScroll, no scrub/shake/parallax/particles, static frame, all text) → Task 8 + Task 10 + Task 11 reduced-motion spec. ✅
- §12 performance (no per-frame React state, transform/opacity only, DPR cap, single rAF, debounced resize) → Task 5 + Task 8. ✅
- §13 testing (unit math/preloader + Playwright e2e incl. r3f-canvas-absent under reduced motion) → Tasks 2,3,11. ✅
- §14 out of scope respected — no real gallery logic, no audio, Canvas2D frame renderer (not WebGL), no interpolation, no mobile frame set. ✅
- §15 risks mitigated — `ScrollTrigger.refresh()` on `onReady` (Task 8), lerp scrub (Task 5), bitmap close on destroy (Task 3), committed WebP + e2e blank/ready assertion (Tasks 1,11). ✅

**2. Placeholder scan:** No "TBD/TODO/handle edge cases/similar to Task N" — every step has complete code or an exact command + expected output. ✅

**3. Type/name consistency:** `createFramePreloader({total,priority,concurrency,load})` → `{start, whenPriorityReady, getBitmap, has, stats, destroy}` used identically in Task 3 tests, Task 5 hook. `createCanvasRenderer()` → `{mount,resize,draw,destroy}` consistent Task 4↔5. `useV16FrameSequence({onReady})` → `{canvasRef,ready,setTargetProgress}` consistent Task 5↔8. `progressRef` shape (`.current` number) consistent Task 7↔8. Data hooks (`data-v16-root/-hero/-canvas/-loading/-archive/-particles/-featured/-featured-gallery`) defined in Tasks 8/9/10 and asserted with the same names in Task 11. `window.__v16Debug` shape `{drawCount,frameIndex,count,ready}` defined Task 5, asserted Task 11. ✅

No issues found.

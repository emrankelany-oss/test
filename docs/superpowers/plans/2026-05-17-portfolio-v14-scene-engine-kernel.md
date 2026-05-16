# Portfolio V14 — Scene-Engine Kernel (SP-0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the content-free, reusable scroll-film backbone for a new `portfolio-v14` route — a Canvas2D frame-sequence engine plus a per-scene/conductor orchestration layer — proven against procedural frames and two probe scenes.

**Architecture:** Pure logic (frame-index math, cover-fit, LRU, transition curves, scene registry) lives in plain `.js` modules unit-tested with `node:test`. React/DOM glue (`FrameSequenceEngine`, `Canvas2DRenderer`, `SceneController`, hooks, scenes) wires the pure cores to GSAP ScrollTrigger + the existing Lenis `SmoothScroll`, verified end-to-end with Playwright. Renderer sits behind a swappable `FrameRenderer` interface (Canvas2D now, WebGL deferred to SP-4); orchestration is per-scene ScrollTriggers plus a thin `SceneController` conductor owning only velocity + a transition overlay.

**Tech Stack:** Next.js 16 (App Router) / React 19, GSAP 3.15 ScrollTrigger, Lenis 1.3 (via existing `components/portfolio/SmoothScroll.jsx`), Canvas 2D + `createImageBitmap`, `node:test` unit runner, Playwright e2e. Path alias `@/*` → `tma-web/*`.

**Spec:** `docs/superpowers/specs/2026-05-17-portfolio-v14-scene-engine-kernel-design.md`

---

## File Structure

Pure cores (unit-tested with `node:test`):

- `tma-web/components/portfolio-v14/engine/frameMath.js` — `frameIndexFor`, `preloadWindow`, `coverFit`
- `tma-web/components/portfolio-v14/engine/lruCache.js` — `createLruCache` with close-on-evict
- `tma-web/components/portfolio-v14/engine/transitions.js` — blur/zoom/color-bleed/crossfade curves
- `tma-web/components/portfolio-v14/engine/sceneRegistry.js` — ordered scene registry + adjacent pairs

React/DOM glue (verified with Playwright):

- `tma-web/components/portfolio-v14/engine/FrameRenderer.js` — interface doc + `Canvas2DRenderer`
- `tma-web/components/portfolio-v14/engine/FrameSequenceEngine.js` — math+cache+rAF+renderer orchestration, `window.__v14Debug`
- `tma-web/components/portfolio-v14/engine/SceneController.js` — context + registry + velocity + transition overlay
- `tma-web/components/portfolio-v14/engine/useScene.js` — pinned ScrollTrigger + registration hook
- `tma-web/components/portfolio-v14/engine/useFrameSequence.js` — engine lifecycle hook
- `tma-web/components/portfolio-v14/dev/proceduralFrames.js` — deterministic test-film generator
- `tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx`, `PlaceholderFilmScene.jsx`, `ProbeSceneB.jsx`
- `tma-web/components/portfolio-v14/V14Experience.jsx` — client root
- `tma-web/app/portfolio-v14/page.jsx` — server shell

Tests:

- `tma-web/test/v14-frameMath.test.mjs`, `v14-lruCache.test.mjs`, `v14-transitions.test.mjs`, `v14-sceneRegistry.test.mjs`
- `tma-web/playwright/tests/v14-kernel.spec.js`, `v14-reduced-motion.spec.js`

---

## Task 1: Route shell + client root scaffold

**Files:**
- Create: `tma-web/app/portfolio-v14/page.jsx`
- Create: `tma-web/components/portfolio-v14/V14Experience.jsx`
- Test: `tma-web/playwright/tests/v14-kernel.spec.js`

- [ ] **Step 1: Write the failing Playwright smoke test**

Create `tma-web/playwright/tests/v14-kernel.spec.js`:

```js
import { test, expect } from "@playwright/test";

test("portfolio-v14 route renders the experience root", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");
  await expect(page.locator('[data-v14-root]')).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd tma-web && npm run dev` (in another shell), then
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-kernel.spec.js --project=laptop-1440`
Expected: FAIL — route 404 / `[data-v14-root]` not found.

- [ ] **Step 3: Create the server shell**

Create `tma-web/app/portfolio-v14/page.jsx`:

```jsx
import V14Experience from "@/components/portfolio-v14/V14Experience";

export const metadata = {
  title: "Portfolio V14 — The Motion Agency",
  description:
    "A continuous cinematic journey controlled by scroll. Built with GSAP, Lenis and a frame-sequence engine.",
};

export default function PortfolioV14Page() {
  return (
    <main data-v14-root className="v14-page">
      <V14Experience />
    </main>
  );
}
```

- [ ] **Step 4: Create the client root (minimal)**

Create `tma-web/components/portfolio-v14/V14Experience.jsx`:

```jsx
"use client";
import SmoothScroll from "@/components/portfolio/SmoothScroll";

export default function V14Experience() {
  return (
    <>
      <SmoothScroll />
      <div data-v14-stage style={{ minHeight: "200vh" }} />
    </>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-kernel.spec.js --project=laptop-1440`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tma-web/app/portfolio-v14 tma-web/components/portfolio-v14/V14Experience.jsx tma-web/playwright/tests/v14-kernel.spec.js
git commit -m "feat(v14): portfolio-v14 route shell + client root scaffold"
```

---

## Task 2: frameMath.js — pure frame-index, preload-window, cover-fit

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/frameMath.js`
- Test: `tma-web/test/v14-frameMath.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-frameMath.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { frameIndexFor, preloadWindow, coverFit } from "../components/portfolio-v14/engine/frameMath.js";

test("frameIndexFor maps progress to clamped rounded index", () => {
  assert.equal(frameIndexFor(0, 100), 0);
  assert.equal(frameIndexFor(1, 100), 99);
  assert.equal(frameIndexFor(0.5, 101), 50);
  assert.equal(frameIndexFor(-2, 100), 0);
  assert.equal(frameIndexFor(9, 100), 99);
  assert.equal(frameIndexFor(0.5, 0), 0);
});

test("preloadWindow returns ahead/behind band clamped to bounds", () => {
  assert.deepEqual(preloadWindow(0, 100, 3, 2), [0, 1, 2, 3]);
  assert.deepEqual(preloadWindow(50, 100, 2, 2), [48, 49, 50, 51, 52]);
  assert.deepEqual(preloadWindow(99, 100, 3, 2), [97, 98, 99]);
  assert.deepEqual(preloadWindow(0, 0, 5, 5), []);
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

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement frameMath.js**

Create `tma-web/components/portfolio-v14/engine/frameMath.js`:

```js
export function frameIndexFor(progress, count) {
  if (count <= 0) return 0;
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))));
}

export function preloadWindow(index, count, ahead = 20, behind = 5) {
  if (count <= 0) return [];
  const start = Math.max(0, index - behind);
  const end = Math.min(count - 1, index + ahead);
  const out = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export function coverFit(srcW, srcH, dstW, dstH) {
  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
    return { dx: 0, dy: 0, dw: dstW, dh: dstH };
  }
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (dstW - dw) / 2, dy: (dstH - dh) / 2, dw, dh };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS (all `v14-frameMath` cases).

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/frameMath.js tma-web/test/v14-frameMath.test.mjs
git commit -m "feat(v14): pure frame-index, preload-window and cover-fit math"
```

---

## Task 3: lruCache.js — LRU with close-on-evict

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/lruCache.js`
- Test: `tma-web/test/v14-lruCache.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-lruCache.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createLruCache } from "../components/portfolio-v14/engine/lruCache.js";

test("evicts least-recently-used and reports evictions", () => {
  const evicted = [];
  const c = createLruCache(2, (k) => evicted.push(k));
  c.set("a", 1);
  c.set("b", 2);
  c.get("a");            // a now most-recent
  c.set("c", 3);         // evicts b
  assert.equal(c.has("b"), false);
  assert.equal(c.has("a"), true);
  assert.deepEqual(evicted, ["b"]);
  assert.equal(c.size, 2);
});

test("re-setting an existing key refreshes recency, not size", () => {
  const c = createLruCache(2);
  c.set("a", 1);
  c.set("b", 2);
  c.set("a", 11);
  c.set("c", 3);          // evicts b (a was refreshed)
  assert.equal(c.get("a"), 11);
  assert.equal(c.has("b"), false);
});

test("clear() calls onEvict for every entry", () => {
  const evicted = [];
  const c = createLruCache(5, (k) => evicted.push(k));
  c.set("x", 1);
  c.set("y", 2);
  c.clear();
  assert.deepEqual(evicted.sort(), ["x", "y"]);
  assert.equal(c.size, 0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement lruCache.js**

Create `tma-web/components/portfolio-v14/engine/lruCache.js`:

```js
export function createLruCache(capacity, onEvict) {
  const map = new Map(); // Map preserves insertion order

  return {
    get(key) {
      if (!map.has(key)) return undefined;
      const v = map.get(key);
      map.delete(key);
      map.set(key, v); // mark most-recent
      return v;
    },
    set(key, value) {
      if (map.has(key)) map.delete(key);
      map.set(key, value);
      while (map.size > capacity) {
        const oldestKey = map.keys().next().value;
        const oldestVal = map.get(oldestKey);
        map.delete(oldestKey);
        if (onEvict) onEvict(oldestKey, oldestVal);
      }
    },
    has(key) {
      return map.has(key);
    },
    get size() {
      return map.size;
    },
    clear() {
      if (onEvict) for (const [k, v] of map) onEvict(k, v);
      map.clear();
    },
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/lruCache.js tma-web/test/v14-lruCache.test.mjs
git commit -m "feat(v14): LRU frame cache with close-on-evict callback"
```

---

## Task 4: transitions.js — pure transition curves

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/transitions.js`
- Test: `tma-web/test/v14-transitions.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-transitions.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { blurAmount, zoomScale, colorBleedAlpha, crossfadeOpacity } from "../components/portfolio-v14/engine/transitions.js";

test("blur peaks at the boundary midpoint, sharp at both ends", () => {
  assert.equal(blurAmount(0, 16), 0);
  assert.equal(blurAmount(1, 16), 0);
  assert.equal(blurAmount(0.5, 16), 16);
});

test("zoom is 1 at the ends and > 1 mid", () => {
  assert.equal(zoomScale(0, 0.08), 1);
  assert.equal(zoomScale(1, 0.08), 1);
  assert.ok(zoomScale(0.5, 0.08) > 1);
});

test("color-bleed alpha peaks mid and clamps to maxAlpha", () => {
  assert.equal(colorBleedAlpha(0, 0.5), 0);
  assert.equal(colorBleedAlpha(0.5, 0.5), 0.5);
});

test("crossfade hands opacity from A to B", () => {
  assert.deepEqual(crossfadeOpacity(0), { a: 1, b: 0 });
  assert.deepEqual(crossfadeOpacity(1), { a: 0, b: 1 });
  const mid = crossfadeOpacity(0.5);
  assert.ok(mid.a > 0 && mid.b > 0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement transitions.js**

Create `tma-web/components/portfolio-v14/engine/transitions.js`:

```js
// t: 0 = fully scene A, 1 = fully scene B.
// `tri` is a triangle wave: 0 at the ends, 1 at the midpoint (blur-to-sharp shape).
function tri(t) {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.abs(2 * c - 1);
}

export function blurAmount(t, maxBlur = 16) {
  return Math.round(tri(t) * maxBlur);
}

export function zoomScale(t, maxZoom = 0.08) {
  return 1 + tri(t) * maxZoom;
}

export function colorBleedAlpha(t, maxAlpha = 0.5) {
  return +(tri(t) * maxAlpha).toFixed(4);
}

export function crossfadeOpacity(t) {
  const c = Math.min(1, Math.max(0, t));
  return { a: 1 - c, b: c };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/transitions.js tma-web/test/v14-transitions.test.mjs
git commit -m "feat(v14): pure transition curves (blur/zoom/color-bleed/crossfade)"
```

---

## Task 5: sceneRegistry.js — ordered registry + adjacent pairs

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/sceneRegistry.js`
- Test: `tma-web/test/v14-sceneRegistry.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-sceneRegistry.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSceneRegistry } from "../components/portfolio-v14/engine/sceneRegistry.js";

test("keeps scenes sorted by order and exposes adjacent pairs", () => {
  const r = createSceneRegistry();
  r.register({ id: "film", order: 20 });
  r.register({ id: "a", order: 10 });
  r.register({ id: "b", order: 30 });
  assert.deepEqual(r.list().map((s) => s.id), ["a", "film", "b"]);
  assert.deepEqual(r.adjacentPairs().map((p) => [p[0].id, p[1].id]), [["a", "film"], ["film", "b"]]);
});

test("unregister removes the scene", () => {
  const r = createSceneRegistry();
  const off = r.register({ id: "a", order: 1 });
  r.register({ id: "b", order: 2 });
  off();
  assert.deepEqual(r.list().map((s) => s.id), ["b"]);
});

test("duplicate id throws", () => {
  const r = createSceneRegistry();
  r.register({ id: "a", order: 1 });
  assert.throws(() => r.register({ id: "a", order: 2 }), /already registered/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement sceneRegistry.js**

Create `tma-web/components/portfolio-v14/engine/sceneRegistry.js`:

```js
export function createSceneRegistry() {
  let scenes = [];

  return {
    register(scene) {
      if (scenes.some((s) => s.id === scene.id)) {
        throw new Error(`Scene id "${scene.id}" already registered`);
      }
      scenes = [...scenes, scene].sort((a, b) => a.order - b.order);
      return () => {
        scenes = scenes.filter((s) => s.id !== scene.id);
      };
    },
    list() {
      return scenes.slice();
    },
    adjacentPairs() {
      const out = [];
      for (let i = 0; i < scenes.length - 1; i++) out.push([scenes[i], scenes[i + 1]]);
      return out;
    },
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/sceneRegistry.js tma-web/test/v14-sceneRegistry.test.mjs
git commit -m "feat(v14): ordered scene registry with adjacent-pair helper"
```

---

## Task 6: FrameRenderer.js — interface + Canvas2DRenderer

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/FrameRenderer.js`

(No new automated test here — `coverFit` is already unit-tested in Task 2 and the renderer
is exercised end-to-end by the Playwright spec in Task 12. This task is glue around tested math.)

- [ ] **Step 1: Implement FrameRenderer.js**

Create `tma-web/components/portfolio-v14/engine/FrameRenderer.js`:

```js
import { coverFit } from "./frameMath.js";

/**
 * FrameRenderer interface (SP-4 may add a WebGLRenderer satisfying the same shape):
 *   mount(canvasEl)               attach + acquire context
 *   resize(w, h, dpr)             size backing store, recompute on next draw
 *   draw(source, { filter, tint }) paint one frame (source: ImageBitmap | HTMLCanvasElement)
 *   destroy()                     release resources
 */
export class Canvas2DRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
  }

  mount(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d", { alpha: false });
  }

  resize(w, h, dpr = 1) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    if (this.canvas) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
    }
  }

  draw(source, opts = {}) {
    const { ctx } = this;
    if (!ctx || !source) return;
    const sw = source.width;
    const sh = source.height;
    const dw = this.canvas.width;
    const dh = this.canvas.height;
    ctx.save();
    ctx.filter = opts.filter ? `blur(${opts.filter}px)` : "none";
    ctx.clearRect(0, 0, dw, dh);
    const f = coverFit(sw, sh, dw, dh);
    ctx.drawImage(source, f.dx, f.dy, f.dw, f.dh);
    if (opts.tint && opts.tintAlpha > 0) {
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = opts.tintAlpha;
      ctx.fillStyle = opts.tint;
      ctx.fillRect(0, 0, dw, dh);
    }
    ctx.restore();
  }

  destroy() {
    this.canvas = null;
    this.ctx = null;
  }
}
```

- [ ] **Step 2: Sanity build check**

Run: `cd tma-web && npx next build --no-lint 2>&1 | tail -5` (or rely on the dev server already running without module-resolution errors).
Expected: no import/syntax error for the new module.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/FrameRenderer.js
git commit -m "feat(v14): FrameRenderer interface + Canvas2DRenderer (cover-fit, blur, tint)"
```

---

## Task 7: proceduralFrames.js — deterministic test film

**Files:**
- Create: `tma-web/components/portfolio-v14/dev/proceduralFrames.js`

- [ ] **Step 1: Implement proceduralFrames.js**

Create `tma-web/components/portfolio-v14/dev/proceduralFrames.js`:

```js
// Generates a deterministic offscreen-canvas "film": shifting hue gradient,
// a large frame-index counter, and a dot that travels left→right across frames.
// Frame advance is visually unambiguous, so Playwright can assert it.
export function createProceduralSource(count = 180) {
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
    const hue = Math.round(t * 320);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `hsl(${hue}, 70%, 18%)`);
    g.addColorStop(1, `hsl(${(hue + 80) % 360}, 70%, 42%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 220px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index), W / 2, H / 2);
    ctx.beginPath();
    ctx.arc(40 + t * (W - 80), H - 60, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    cache.set(index, cv);
    return cv;
  }

  return { count, width: W, height: H, drawProcedural };
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v14/dev/proceduralFrames.js
git commit -m "feat(v14): deterministic procedural test-film source"
```

---

## Task 8: FrameSequenceEngine.js — orchestration + debug surface

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/FrameSequenceEngine.js`

- [ ] **Step 1: Implement FrameSequenceEngine.js**

Create `tma-web/components/portfolio-v14/engine/FrameSequenceEngine.js`:

```js
import { frameIndexFor, preloadWindow } from "./frameMath.js";
import { createLruCache } from "./lruCache.js";

const CACHE_CAP = 60;
const AHEAD = 20;
const BEHIND = 5;

/**
 * source: { count, drawProcedural(i) -> canvas }  OR  { count, getUrl(i) -> string }
 * renderer: a FrameRenderer instance (already mounted + resized by the caller)
 */
export function createFrameSequenceEngine(source, renderer) {
  const cache = createLruCache(CACHE_CAP, (_k, v) => {
    if (v && typeof v.close === "function") v.close(); // ImageBitmap
  });
  let targetProgress = 0;
  let lastDrawnIndex = -1;
  let lastGood = null;
  let rafId = 0;
  let running = false;
  let loggedError = false;
  const debug = { drawCount: 0, frameIndex: 0, count: source.count };

  async function ensure(index) {
    if (cache.has(index)) return;
    try {
      if (source.drawProcedural) {
        cache.set(index, source.drawProcedural(index));
      } else {
        const res = await fetch(source.getUrl(index));
        const blob = await res.blob();
        cache.set(index, await createImageBitmap(blob));
      }
    } catch (err) {
      if (!loggedError) {
        console.warn("[v14] frame load failed; holding last frame", err);
        loggedError = true;
      }
    }
  }

  function preload(index) {
    for (const i of preloadWindow(index, source.count, AHEAD, BEHIND)) ensure(i);
  }

  function tick() {
    if (!running) return;
    const index = frameIndexFor(targetProgress, source.count);
    if (index !== lastDrawnIndex) {
      const frame = cache.get(index) || lastGood;
      if (frame) {
        renderer.draw(frame);
        lastGood = frame;
        lastDrawnIndex = index;
        debug.drawCount += 1;
        debug.frameIndex = index;
      }
      preload(index);
    }
    rafId = requestAnimationFrame(tick);
  }

  return {
    debug,
    setProgress(p) {
      targetProgress = p;
    },
    start() {
      if (running) return;
      running = true;
      preload(frameIndexFor(targetProgress, source.count));
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
    destroy() {
      this.stop();
      cache.clear();
      lastGood = null;
    },
  };
}
```

- [ ] **Step 2: Sanity build check**

Run: confirm the dev server recompiles with no module-resolution / syntax error for the new file.
Expected: clean compile.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/FrameSequenceEngine.js
git commit -m "feat(v14): FrameSequenceEngine — shared rAF, LRU preload, last-good fallback"
```

---

## Task 9: SceneController.js — context, registry, velocity, transition overlay

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/SceneController.js`

- [ ] **Step 1: Implement SceneController.js**

Create `tma-web/components/portfolio-v14/engine/SceneController.js`:

```js
"use client";
import { createContext, useContext, useMemo, useRef } from "react";
import { createSceneRegistry } from "./sceneRegistry.js";

const SceneControllerContext = createContext(null);

export function SceneControllerProvider({ children }) {
  const registryRef = useRef(null);
  if (!registryRef.current) registryRef.current = createSceneRegistry();
  const velocityRef = useRef(0);

  const api = useMemo(
    () => ({
      registry: registryRef.current,
      // Read by scenes/transitions; updated by useScene from ScrollTrigger.getVelocity().
      setVelocity(v) {
        velocityRef.current = v;
      },
      getVelocity() {
        return velocityRef.current;
      },
    }),
    []
  );

  return (
    <SceneControllerContext.Provider value={api}>
      {children}
      {/* Shared transition overlay: a single fixed layer scenes draw boundary
          effects into. SP-0 ships the mount point; primitives from
          transitions.js are blended here in SP-4. */}
      <div
        data-v14-transition-overlay
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
          opacity: 0,
        }}
      />
    </SceneControllerContext.Provider>
  );
}

export function useSceneController() {
  const ctx = useContext(SceneControllerContext);
  if (!ctx) throw new Error("useSceneController must be used within SceneControllerProvider");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/SceneController.js
git commit -m "feat(v14): SceneController provider — registry, velocity, transition overlay mount"
```

---

## Task 10: useScene.js — pinned ScrollTrigger + registration

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/useScene.js`

- [ ] **Step 1: Implement useScene.js**

Create `tma-web/components/portfolio-v14/engine/useScene.js`:

```js
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSceneController } from "./SceneController.js";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Registers a pinned scene. `viewports` = scroll length in viewport-heights.
 * onProgress(p, velocity) is called on every ScrollTrigger update.
 * Reduced motion: no pin/scrub; fires onProgress(1) once so the scene paints
 * its static end state and the page stays a normal scroll document.
 */
export function useScene({ id, order, viewports = 4, onProgress }) {
  const controller = useSceneController();
  const elRef = useRef(null);
  const cbRef = useRef(onProgress);
  cbRef.current = onProgress;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const unregister = controller.registry.register({ id, order, el, viewports });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      cbRef.current?.(1, 0);
      return () => unregister();
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: `+=${viewports * 100}%`,
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const v = self.getVelocity();
        controller.setVelocity(v);
        cbRef.current?.(self.progress, v);
      },
    });

    return () => {
      st.kill();
      unregister();
    };
  }, [id, order, viewports, controller]);

  return elRef;
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/useScene.js
git commit -m "feat(v14): useScene — pinned ScrollTrigger, registry + velocity, reduced-motion path"
```

---

## Task 11: useFrameSequence.js — engine lifecycle hook

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/useFrameSequence.js`

- [ ] **Step 1: Implement useFrameSequence.js**

Create `tma-web/components/portfolio-v14/engine/useFrameSequence.js`:

```js
"use client";
import { useEffect, useRef } from "react";
import { Canvas2DRenderer } from "./FrameRenderer.js";
import { createFrameSequenceEngine } from "./FrameSequenceEngine.js";

/**
 * Owns renderer + engine lifecycle for one film scene.
 * Returns { canvasRef, setProgress } — call setProgress from the scene's onProgress.
 */
export function useFrameSequence(source) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new Canvas2DRenderer();
    renderer.mount(canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sizeToParent = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      renderer.resize(r.width, r.height, dpr);
    };
    sizeToParent();

    const engine = createFrameSequenceEngine(source, renderer);
    engineRef.current = engine;
    engine.start();
    if (typeof window !== "undefined") window.__v14Debug = engine.debug;

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(sizeToParent);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(resizeRaf);
      engine.destroy();
      renderer.destroy();
      engineRef.current = null;
    };
  }, [source]);

  return {
    canvasRef,
    setProgress: (p) => engineRef.current?.setProgress(p),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/useFrameSequence.js
git commit -m "feat(v14): useFrameSequence — renderer+engine lifecycle, debug surface"
```

---

## Task 12: Scenes + wire into V14Experience

**Files:**
- Create: `tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx`
- Create: `tma-web/components/portfolio-v14/scenes/PlaceholderFilmScene.jsx`
- Create: `tma-web/components/portfolio-v14/scenes/ProbeSceneB.jsx`
- Modify: `tma-web/components/portfolio-v14/V14Experience.jsx` (replace placeholder body)

- [ ] **Step 1: Create ProbeSceneA.jsx**

```jsx
"use client";
import { useState } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";

export default function ProbeSceneA() {
  const [p, setP] = useState(0);
  const ref = useScene({ id: "probe-a", order: 10, viewports: 2, onProgress: setP });
  return (
    <section ref={ref} data-scene="probe-a" style={{ height: "100vh", background: "#08070b", color: "#fff", display: "grid", placeItems: "center" }}>
      <h1 style={{ fontSize: "10vw", margin: 0, transform: `translateY(${(1 - p) * 12}vh)`, opacity: 0.25 + p * 0.75 }}>
        MOTION MOVES CULTURE
      </h1>
    </section>
  );
}
```

- [ ] **Step 2: Create PlaceholderFilmScene.jsx**

```jsx
"use client";
import { useMemo } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";
import { useFrameSequence } from "@/components/portfolio-v14/engine/useFrameSequence";
import { createProceduralSource } from "@/components/portfolio-v14/dev/proceduralFrames";

export default function PlaceholderFilmScene() {
  const source = useMemo(() => createProceduralSource(180), []);
  const { canvasRef, setProgress } = useFrameSequence(source);
  const ref = useScene({
    id: "film",
    order: 20,
    viewports: 8,
    onProgress: (p) => setProgress(p),
  });
  return (
    <section ref={ref} data-scene="film" style={{ height: "100vh", background: "#000" }}>
      <canvas ref={canvasRef} data-v14-canvas style={{ display: "block", width: "100%", height: "100%" }} />
    </section>
  );
}
```

- [ ] **Step 3: Create ProbeSceneB.jsx**

```jsx
"use client";
import { useState } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";

export default function ProbeSceneB() {
  const [p, setP] = useState(0);
  const ref = useScene({ id: "probe-b", order: 30, viewports: 2, onProgress: setP });
  return (
    <section ref={ref} data-scene="probe-b" style={{ height: "100vh", background: "#0b0708", color: "#fff", display: "grid", placeItems: "center" }}>
      <h1 style={{ fontSize: "8vw", margin: 0, filter: `blur(${(1 - p) * 14}px)` }}>
        THE WORK BEGINS
      </h1>
    </section>
  );
}
```

- [ ] **Step 4: Rewrite V14Experience.jsx to wire everything**

```jsx
"use client";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import { SceneControllerProvider } from "@/components/portfolio-v14/engine/SceneController";
import ProbeSceneA from "@/components/portfolio-v14/scenes/ProbeSceneA";
import PlaceholderFilmScene from "@/components/portfolio-v14/scenes/PlaceholderFilmScene";
import ProbeSceneB from "@/components/portfolio-v14/scenes/ProbeSceneB";

export default function V14Experience() {
  return (
    <SceneControllerProvider>
      <SmoothScroll />
      <ProbeSceneA />
      <PlaceholderFilmScene />
      <ProbeSceneB />
    </SceneControllerProvider>
  );
}
```

- [ ] **Step 5: Manual smoke check**

Run dev server, open `http://localhost:3000/portfolio-v14`, scroll through. Expected:
ProbeSceneA pins and reveals → film canvas pins and the procedural counter advances with
scroll → ProbeSceneB pins and sharpens. No console errors.

- [ ] **Step 6: Commit**

```bash
git add tma-web/components/portfolio-v14/scenes tma-web/components/portfolio-v14/V14Experience.jsx
git commit -m "feat(v14): probe + placeholder-film scenes wired into the experience"
```

---

## Task 13: Playwright kernel verification (advance, throttle, FPS)

**Files:**
- Modify: `tma-web/playwright/tests/v14-kernel.spec.js` (append cases)

- [ ] **Step 1: Append the engine assertions**

Add to `tma-web/playwright/tests/v14-kernel.spec.js`:

```js
test("frame advances monotonically and rAF-throttles draws", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");
  await page.locator('[data-v14-canvas]').waitFor();

  const samples = [];
  for (let y = 0; y <= 12000; y += 1500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(250);
    samples.push(await page.evaluate(() => ({ ...window.__v14Debug })));
  }
  const indices = samples.map((s) => s.frameIndex);
  for (let i = 1; i < indices.length; i++) {
    expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
  }
  expect(indices[indices.length - 1]).toBeGreaterThan(indices[0]);

  const last = samples[samples.length - 1];
  // Draws must not exceed the number of distinct frames (throttle proof).
  expect(last.drawCount).toBeLessThanOrEqual(last.count + 5);
  expect(errors).toEqual([]);
});

test("sustains >=55fps during a fast programmatic scroll", async ({ page }) => {
  await page.goto("/portfolio-v14");
  await page.locator('[data-v14-canvas]').waitFor();
  const fps = await page.evaluate(async () => {
    let frames = 0;
    let raf;
    const loop = () => { frames++; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const t0 = performance.now();
    for (let y = 0; y <= 12000; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 16));
    }
    const dt = performance.now() - t0;
    cancelAnimationFrame(raf);
    return (frames / dt) * 1000;
  });
  expect(fps).toBeGreaterThanOrEqual(55);
});
```

- [ ] **Step 2: Run the kernel spec**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-kernel.spec.js --project=laptop-1440`
Expected: PASS (3 tests). If FPS is flaky in CI, re-run locally; the threshold targets the spec's ≥~55fps bar.

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v14-kernel.spec.js
git commit -m "test(v14): kernel e2e — monotonic advance, rAF-throttle proof, 55fps floor"
```

---

## Task 14: Playwright reduced-motion verification

**Files:**
- Create: `tma-web/playwright/tests/v14-reduced-motion.spec.js`

- [ ] **Step 1: Write the reduced-motion test**

Create `tma-web/playwright/tests/v14-reduced-motion.spec.js`:

```js
import { test, expect } from "@playwright/test";

test.use({ colorScheme: "dark" });

test("reduced motion: static, fully scrollable, all scenes reachable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");

  await expect(page.locator('[data-scene="probe-a"]')).toBeVisible();
  await page.locator('[data-scene="probe-b"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="probe-b"]')).toBeInViewport();

  // No pin lock: document scrolls past the film without trapping.
  const scrolled = await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    return window.scrollY;
  });
  expect(scrolled).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run it**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-reduced-motion.spec.js --project=laptop-1440`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v14-reduced-motion.spec.js
git commit -m "test(v14): reduced-motion e2e — static, scrollable, scenes reachable"
```

---

## Task 15: Full suite green + status memory

**Files:**
- (No code) — final verification + memory update.

- [ ] **Step 1: Run the full unit suite**

Run: `cd tma-web && npm test`
Expected: PASS — all `v14-*` node:test files plus pre-existing `phase` / `portfolio-v12-data` tests still green (no regressions).

- [ ] **Step 2: Run the full v14 e2e suite**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-kernel.spec.js playwright/tests/v14-reduced-motion.spec.js --project=laptop-1440`
Expected: all PASS.

- [ ] **Step 3: Update the status memory**

Edit `C:\Users\Pc\.claude\projects\c--Users-Pc-Downloads-the-motion-agency-web-main\memory\v14-scene-engine-status.md`: change the Status line to "SP-0 kernel **built and verified** (unit + e2e green); next is SP-1 (cinematic intro)." Keep the rest.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore(v14): SP-0 kernel complete — unit + e2e green"
```

---

## Self-Review

**Spec coverage:**
- Spec §4 file layout → Tasks 1–12 create every listed file (renamed pure cores `frameMath/lruCache/transitions/sceneRegistry` are an additive decomposition for testability, still under `engine/`).
- §5.1 FrameSequenceEngine (index map, LRU 60, +20/−5 window, shared rAF store-only, redraw-skip, last-good, close-on-evict) → Tasks 2,3,8.
- §5.2 swappable FrameRenderer + Canvas2DRenderer (cover-fit, blur, tint) → Tasks 2,6.
- §5.3 SceneController (registry, velocity, transition overlay mount) → Tasks 5,9.
- §5.4 useScene (pinned ST, registration, reduced-motion) → Task 10.
- §5.5 useFrameSequence (lifecycle, mount renderer) → Task 11.
- §5.6 scenes + procedural frames → Tasks 7,12.
- §6 data flow (O(1) scroll handler, rAF draw) → Tasks 8,10 + asserted Task 13.
- §7 reduced-motion/SSR/error/resize → Tasks 1 (server shell),8 (error/last-good),10/14 (reduced motion),11 (debounced resize).
- §8 performance → enforced by Task 8 design + asserted Task 13 (throttle + 55fps).
- §9 verification (all 6 items) → Tasks 13 (1,2,3,5), 14 (4), 12 step 5 (6 manual).
- §10 out-of-scope respected (no real frames/content; transition overlay is mount-only, primitives blended in SP-4).

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step contains complete code; every command has an expected result.

**Type consistency:** `createFrameSequenceEngine(source, renderer)` consumed identically in Task 11; `source` shape `{count, drawProcedural|getUrl, width, height}` matches Task 7 output; `renderer` API (`mount/resize/draw/destroy`) matches Task 6; `useScene({id,order,viewports,onProgress})` and `useFrameSequence(source)→{canvasRef,setProgress}` consumed consistently in Task 12; `window.__v14Debug` shape (`drawCount/frameIndex/count`) set in Task 8, read in Task 13.

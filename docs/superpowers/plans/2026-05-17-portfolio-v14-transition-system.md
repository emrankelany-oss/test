# Portfolio V14 — Cross-Scene Transition System (SP-2A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the dormant `[data-v14-transition-overlay]` into a real cross-scene match-cut layer: a `SceneController`-owned shared-rAF driver blends every adjacent-scene boundary using the existing `transitions.js` curves modulated by scroll velocity, with no hard cut — verified against the scenes that already exist.

**Architecture:** Two new pure modules (`boundaryState`, `overlayStyle`) computed-and-unit-tested with `node:test` (the SP-0/SP-1 pattern). `SceneController` gains `reportProgress` + one shared `requestAnimationFrame` driver that reads per-scene progress + velocity, calls the pure cores, and writes the DOM overlay each frame (scroll handlers stay O(1)). `useScene` gains one `reportProgress` call + an optional `bleed` color. No WebGL — the WebGL renderer stays SP-4.

**Tech Stack:** React 19 / Next 16, GSAP ScrollTrigger (existing `useScene`), `node:test`, Playwright. Pure ESM modules under `tma-web/components/portfolio-v14/engine/`.

**Spec:** `docs/superpowers/specs/2026-05-17-portfolio-v14-transition-system-design.md`
**Branch:** `feat/portfolio-v14` (continues from completed SP-0 + SP-1).

---

## File Structure

Pure cores (node:test, run from `tma-web`):
- `tma-web/components/portfolio-v14/engine/boundaryState.js` — active-seam detector
- `tma-web/components/portfolio-v14/engine/overlayStyle.js` — composes `transitions.js` + velocity + color-bleed → overlay style

Glue (Playwright-verified):
- `tma-web/components/portfolio-v14/engine/SceneController.js` — MODIFY: add `reportProgress` + shared-rAF driver
- `tma-web/components/portfolio-v14/engine/useScene.js` — MODIFY: `reportProgress` call + `bleed` param
- `tma-web/components/portfolio-v14/scenes/IntroFilmScene.jsx` — MODIFY: pass `bleed`
- `tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx` — MODIFY: pass `bleed`
- `tma-web/components/portfolio-v14/scenes/ProbeSceneB.jsx` — MODIFY: pass `bleed`

Tests:
- `tma-web/test/v14-boundaryState.test.mjs`, `v14-overlayStyle.test.mjs`
- `tma-web/playwright/tests/v14-transition.spec.js`

`transitions.js` and `sceneRegistry.js` are NOT modified (registry already stores the whole scene object, so `bleed` rides along for free). Tests run from `c:/Users/Pc/Downloads/the-motion-agency-web-main/tma-web`; git from repo root.

---

## Task 1: boundaryState.js — active-seam detector (pure)

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/boundaryState.js`
- Test: `tma-web/test/v14-boundaryState.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-boundaryState.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { boundaryState } from "../components/portfolio-v14/engine/boundaryState.js";

test("scene inside its seam yields a from/to/t toward the next scene", () => {
  const b = boundaryState([{ id: "a", progress: 0.9 }, { id: "b", progress: 0 }], 0.18);
  assert.equal(b.fromId, "a");
  assert.equal(b.toId, "b");
  // (0.9 - (1-0.18)) / 0.18 = 0.0800.../0.18 = 0.4444...
  assert.ok(Math.abs(b.t - 0.4444444) < 1e-4, `t was ${b.t}`);
});

test("progress exactly at the seam start → t=0; at 1 → t=1", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.82 }, { id: "b", progress: 0 }], 0.18).t, 0);
  assert.equal(boundaryState([{ id: "a", progress: 1 }, { id: "b", progress: 0 }], 0.18).t, 1);
});

test("t is clamped to [0,1] for out-of-range progress", () => {
  assert.equal(boundaryState([{ id: "a", progress: 1.5 }, { id: "b", progress: 0 }], 0.18).t, 1);
});

test("before any seam → null", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.5 }, { id: "b", progress: 0 }], 0.18), null);
});

test("only the LAST scene in its seam → null (no successor)", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.1 }, { id: "b", progress: 0.95 }], 0.18), null);
});

test("fewer than two scenes, empty, or non-positive seam → null", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.95 }], 0.18), null);
  assert.equal(boundaryState([], 0.18), null);
  assert.equal(boundaryState(null, 0.18), null);
  assert.equal(boundaryState([{ id: "a", progress: 0.95 }, { id: "b", progress: 0 }], 0), null);
});

test("first in-seam scene wins when several qualify", () => {
  const b = boundaryState(
    [{ id: "a", progress: 0.99 }, { id: "b", progress: 0.99 }, { id: "c", progress: 0 }],
    0.18
  );
  assert.equal(b.fromId, "a");
  assert.equal(b.toId, "b");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement boundaryState.js**

Create `tma-web/components/portfolio-v14/engine/boundaryState.js`:

```js
// Detects the active cross-scene seam. `sceneProgresses` is an ORDER-SORTED
// array of { id, progress }. A scene's last `seam` fraction of its progress
// maps t: 0→1 toward the next scene. Returns { fromId, toId, t } or null.
export function boundaryState(sceneProgresses, seam = 0.18) {
  if (!Array.isArray(sceneProgresses) || sceneProgresses.length < 2) return null;
  if (!(seam > 0)) return null;
  const start = 1 - seam;
  for (let i = 0; i < sceneProgresses.length - 1; i++) {
    const cur = sceneProgresses[i];
    const p = cur.progress;
    if (p >= start) {
      const next = sceneProgresses[i + 1];
      const t = Math.min(1, Math.max(0, (p - start) / seam));
      return { fromId: cur.id, toId: next.id, t };
    }
  }
  return null;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS — the 7 new `v14-boundaryState` tests; all pre-existing (38) still green.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/boundaryState.js tma-web/test/v14-boundaryState.test.mjs
git commit -m "feat(v14): pure active-seam boundary detector"
```

---

## Task 2: overlayStyle.js — compose transitions + velocity + color-bleed (pure)

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/overlayStyle.js`
- Test: `tma-web/test/v14-overlayStyle.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-overlayStyle.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { overlayStyle } from "../components/portfolio-v14/engine/overlayStyle.js";

test("endpoints are fully inert", () => {
  for (const t of [0, 1, -0.2, 1.4]) {
    const s = overlayStyle(t, 0, "#08070b", "#0b0708");
    assert.deepEqual(s, { blurPx: 0, scale: 1, bleedColor: "#000000", bleedAlpha: 0, opacity: 0 });
  }
});

test("midpoint peaks (zero velocity)", () => {
  const s = overlayStyle(0.5, 0, "#000000", "#ffffff");
  assert.equal(s.blurPx, 16);          // blurAmount(0.5)=16 * vMul(1)
  assert.ok(s.scale > 1);              // zoomScale(0.5) > 1
  assert.equal(s.opacity, 1);          // triangle(0.5)=1
  assert.ok(s.bleedAlpha > 0);
  assert.equal(s.bleedColor, "#808080"); // lerp #000→#fff at 0.5 → 128
});

test("velocity raises blur and is clamped at 1+VEL_GAIN (1.6x)", () => {
  const slow = overlayStyle(0.5, 0, "#000", "#fff").blurPx;
  const fast = overlayStyle(0.5, 6000, "#000", "#fff").blurPx;
  const huge = overlayStyle(0.5, 999999, "#000", "#fff").blurPx;
  assert.ok(fast > slow, `fast ${fast} > slow ${slow}`);
  assert.ok(Math.abs(huge - 16 * 1.6) < 1e-3, `huge ${huge} ≈ 25.6`);
});

test("color bleed interpolates from→to and tolerates 3-digit hex", () => {
  assert.equal(overlayStyle(0.25, 0, "#000", "#ffffff").bleedColor, "#404040"); // 255*0.25=63.75→64
  assert.equal(overlayStyle(0.5, 0, "#000", "#fff").bleedColor, "#808080");
});

test("unparseable colors fall back to #000 channels", () => {
  const s = overlayStyle(0.5, 0, "garbage", "#fff");
  assert.equal(s.bleedColor, "#808080"); // from→[0,0,0], to→[255,255,255]
});

test("all numeric outputs are finite and non-negative", () => {
  const s = overlayStyle(0.37, 4200, "#08070b", "#0b0708");
  for (const k of ["blurPx", "scale", "bleedAlpha", "opacity"]) {
    assert.ok(Number.isFinite(s[k]) && s[k] >= 0, `${k}=${s[k]}`);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement overlayStyle.js**

Create `tma-web/components/portfolio-v14/engine/overlayStyle.js`:

```js
import { blurAmount, zoomScale, colorBleedAlpha } from "./transitions.js";

const VEL_REF = 3000;
const VEL_GAIN = 0.6;

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
function triangle(t) {
  const c = clamp01(t);
  return 1 - Math.abs(2 * c - 1);
}
function parseHex(c) {
  if (typeof c !== "string") return null;
  let h = c.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function toHex(rgb) {
  return (
    "#" +
    rgb
      .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * t: boundary blend 0→1. velocity: ScrollTrigger.getVelocity() (px/s, signed).
 * Returns the overlay's per-frame style numbers. Inert at the endpoints so the
 * veil is invisible inside scenes (no hard cut, no lingering wash).
 */
export function overlayStyle(t, velocity, fromColor, toColor) {
  if (t <= 0 || t >= 1) {
    return { blurPx: 0, scale: 1, bleedColor: "#000000", bleedAlpha: 0, opacity: 0 };
  }
  const vMul = 1 + Math.min(Math.abs(velocity || 0) / VEL_REF, 1) * VEL_GAIN;
  const from = parseHex(fromColor) || [0, 0, 0];
  const to = parseHex(toColor) || [0, 0, 0];
  const k = clamp01(t);
  const bleed = [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * k);
  return {
    blurPx: +(blurAmount(t) * vMul).toFixed(3),
    scale: zoomScale(t),
    bleedColor: toHex(bleed),
    bleedAlpha: +(colorBleedAlpha(t) * vMul).toFixed(4),
    opacity: +triangle(t).toFixed(4),
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS — 6 new `v14-overlayStyle` tests; all prior green.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/overlayStyle.js tma-web/test/v14-overlayStyle.test.mjs
git commit -m "feat(v14): pure overlayStyle (transitions + velocity + color-bleed)"
```

---

## Task 3: SceneController — reportProgress + shared-rAF overlay driver

**Files:**
- Modify: `tma-web/components/portfolio-v14/engine/SceneController.js` (full rewrite below)

(No node:test — React/DOM/rAF; verified by the Playwright spec in Task 6 + the regression run in Task 7.)

- [ ] **Step 1: Rewrite `SceneController.js`**

Replace the entire contents of `tma-web/components/portfolio-v14/engine/SceneController.js` with:

```js
"use client";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { createSceneRegistry } from "./sceneRegistry.js";
import { boundaryState } from "./boundaryState.js";
import { overlayStyle } from "./overlayStyle.js";

const SEAM = 0.18;
const SceneControllerContext = createContext(null);

export function SceneControllerProvider({ children }) {
  const registryRef = useRef(null);
  if (!registryRef.current) registryRef.current = createSceneRegistry();
  const velocityRef = useRef(0);
  const progressRef = useRef(null);
  if (!progressRef.current) progressRef.current = new Map();

  const api = useMemo(
    () => ({
      registry: registryRef.current,
      // Read by the rAF driver below; written by useScene from ScrollTrigger.
      setVelocity(v) {
        velocityRef.current = v;
      },
      getVelocity() {
        return velocityRef.current;
      },
      reportProgress(id, progress) {
        progressRef.current.set(id, progress);
      },
    }),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const overlay = document.querySelector("[data-v14-transition-overlay]");
    if (!overlay) return;

    let raf = 0;
    const tick = () => {
      const entries = registryRef.current.list(); // order-sorted
      const list = entries.map((s) => ({
        id: s.id,
        progress: progressRef.current.get(s.id) ?? 0,
      }));
      const b = boundaryState(list, SEAM);
      if (!b) {
        overlay.style.opacity = "0";
        overlay.style.backdropFilter = "none";
        overlay.style.webkitBackdropFilter = "none";
      } else {
        const fromBleed = entries.find((s) => s.id === b.fromId)?.bleed || "#000";
        const toBleed = entries.find((s) => s.id === b.toId)?.bleed || "#000";
        const s = overlayStyle(b.t, velocityRef.current, fromBleed, toBleed);
        const blur = "blur(" + s.blurPx + "px)";
        overlay.style.backdropFilter = blur;
        overlay.style.webkitBackdropFilter = blur;
        overlay.style.background = s.bleedColor;
        overlay.style.opacity = String(s.opacity * s.bleedAlpha);
        overlay.style.transform = "scale(" + s.scale + ")";
        overlay.style.willChange = "opacity, transform";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <SceneControllerContext.Provider value={api}>
      {children}
      {/* Shared transition overlay — driven by the rAF loop above (SP-2A). */}
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

- [ ] **Step 2: Build sanity**

Run: `cd tma-web && npx next build 2>&1 | tail -6`
Expected: compiles; `/portfolio-v14` listed; no error referencing `SceneController`, `boundaryState`, or `overlayStyle`.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/SceneController.js
git commit -m "feat(v14): SceneController shared-rAF transition driver + reportProgress"
```

---

## Task 4: useScene — reportProgress + bleed param

**Files:**
- Modify: `tma-web/components/portfolio-v14/engine/useScene.js` (full rewrite below)

- [ ] **Step 1: Rewrite `useScene.js`**

Replace the entire contents of `tma-web/components/portfolio-v14/engine/useScene.js` with (changes vs SP-0: `bleed` param + carried on register; `reportProgress` in both the reduced-motion branch and `onUpdate`):

```js
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSceneController } from "./SceneController.js";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Registers a pinned scene. `viewports` = scroll length in viewport-heights.
 * `bleed` = the scene's dominant CSS color, used by the transition overlay to
 * color-bleed across the seam (default "#000").
 * onProgress(p, velocity) fires every ScrollTrigger update.
 * Reduced motion: no pin/scrub; fires onProgress(1) and reports progress 1 once.
 */
export function useScene({ id, order, viewports = 4, onProgress, bleed = "#000" }) {
  const controller = useSceneController();
  const elRef = useRef(null);
  const cbRef = useRef(onProgress);
  cbRef.current = onProgress;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const unregister = controller.registry.register({ id, order, el, viewports, bleed });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      cbRef.current?.(1, 0);
      controller.reportProgress(id, 1);
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
        controller.reportProgress(id, self.progress);
        cbRef.current?.(self.progress, v);
      },
    });

    return () => {
      st.kill();
      unregister();
    };
  }, [id, order, viewports, bleed, controller]);

  return elRef;
}
```

- [ ] **Step 2: Build sanity**

Run: `cd tma-web && npx next build 2>&1 | tail -6`
Expected: clean compile, no error referencing `useScene`.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/useScene.js
git commit -m "feat(v14): useScene reports progress + carries bleed color"
```

---

## Task 5: Scene wiring — pass bleed colors

**Files:**
- Modify: `tma-web/components/portfolio-v14/scenes/IntroFilmScene.jsx`
- Modify: `tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx`
- Modify: `tma-web/components/portfolio-v14/scenes/ProbeSceneB.jsx`

- [ ] **Step 1: IntroFilmScene — add `bleed: "#000"`**

In `tma-web/components/portfolio-v14/scenes/IntroFilmScene.jsx`, change the `useScene` call so it reads exactly:

```jsx
  const ref = useScene({
    id: "film",
    order: 20,
    viewports: 8,
    bleed: "#000",
    onProgress: (p) => setProgress(p),
  });
```

(Only the `bleed: "#000",` line is added; everything else in the call and file is unchanged.)

- [ ] **Step 2: ProbeSceneA — add `bleed`**

In `tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx`, change the `useScene` line to:

```jsx
  const ref = useScene({ id: "probe-a", order: 10, viewports: 2, bleed: "#08070b", onProgress: setP });
```

- [ ] **Step 3: ProbeSceneB — add `bleed`**

In `tma-web/components/portfolio-v14/scenes/ProbeSceneB.jsx`, change the `useScene` line to:

```jsx
  const ref = useScene({ id: "probe-b", order: 30, viewports: 2, bleed: "#0b0708", onProgress: setP });
```

- [ ] **Step 4: Build sanity**

Run: `cd tma-web && npx next build 2>&1 | tail -6`
Expected: clean compile, `/portfolio-v14` present.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/scenes/IntroFilmScene.jsx tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx tma-web/components/portfolio-v14/scenes/ProbeSceneB.jsx
git commit -m "feat(v14): scenes declare bleed colors for the transition overlay"
```

---

## Task 6: Playwright transition verification

**Files:**
- Create: `tma-web/playwright/tests/v14-transition.spec.js`

- [ ] **Step 1: Write the spec**

Create `tma-web/playwright/tests/v14-transition.spec.js`:

```js
import { test, expect } from "@playwright/test";

const OVERLAY = "[data-v14-transition-overlay]";

// Reads the overlay's live computed opacity + parsed backdrop blur px.
async function sampleOverlay(page) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const cs = getComputedStyle(el);
    const bf = cs.backdropFilter || cs.webkitBackdropFilter || "none";
    const m = bf.match(/blur\(([\d.]+)px\)/);
    return { opacity: parseFloat(cs.opacity) || 0, blur: m ? parseFloat(m[1]) : 0 };
  }, OVERLAY);
}

test("overlay activates at a scene seam and is inert inside scenes", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator(OVERLAY).waitFor({ state: "attached" });

  let maxOpacity = 0;
  let insideMax = 0; // overlay opacity sampled away from any seam
  for (let y = 0; y <= 14000; y += 500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(120);
    const s = await sampleOverlay(page);
    maxOpacity = Math.max(maxOpacity, s.opacity);
    // y=3000 sits deep inside the first pinned scene (probe-a, 2 viewports),
    // well before its 18% seam — overlay must be invisible there.
    if (y === 3000) insideMax = s.opacity;
  }
  expect(maxOpacity).toBeGreaterThan(0.05); // it genuinely blends somewhere
  expect(insideMax).toBeLessThan(0.02); // and is invisible mid-scene (no hard veil)
  expect(errors).toEqual([]);
});

test("faster scroll across a seam yields a higher peak blur than slower", async ({ page }) => {
  async function peakBlurAcrossFirstSeam(step, settle) {
    await page.goto("/portfolio-v14?frames=procedural");
    await page.locator(OVERLAY).waitFor({ state: "attached" });
    let peak = 0;
    for (let y = 1200; y <= 4200; y += step) {
      await page.evaluate((sy) => window.scrollTo(0, sy), y);
      await page.waitForTimeout(settle);
      peak = Math.max(peak, (await sampleOverlay(page)).blur);
    }
    return peak;
  }
  const slowPeak = await peakBlurAcrossFirstSeam(120, 90); // many small steps = low velocity
  const fastPeak = await peakBlurAcrossFirstSeam(1500, 30); // big jumps = high velocity
  expect(fastPeak).toBeGreaterThanOrEqual(slowPeak);
  expect(fastPeak).toBeGreaterThan(0);
});

test("reduced motion: overlay stays inert, page fully scrollable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator(OVERLAY).waitFor({ state: "attached" });
  let maxOpacity = 0;
  for (let y = 0; y <= 14000; y += 1000) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(80);
    maxOpacity = Math.max(maxOpacity, (await sampleOverlay(page)).opacity);
  }
  expect(maxOpacity).toBeLessThan(0.02);
  await page.locator('[data-scene="probe-b"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="probe-b"]')).toBeInViewport();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run it**

Run: from `tma-web`, start `npm run dev` (background), warm `curl -s -o /dev/null "http://localhost:3000/portfolio-v14?frames=procedural"`, then
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-transition.spec.js --project=laptop-1440`
Expected: 3/3 PASS. Stop the dev server.

If a test FAILS, diagnose with real evidence — do NOT weaken assertions:
- overlay never exceeds 0.05 opacity → the rAF driver isn't running or `reportProgress` isn't wired; print a scroll-vs-opacity table.
- `insideMax` not < 0.02 → the seam fraction is leaking outside seams (boundaryState/SEAM bug); print the value.
- velocity test: if `fastPeak < slowPeak`, the velocity coupling in `overlayStyle` is inverted/ineffective — print both peaks.
Report BLOCKED with the data + diagnosis rather than masking. Only non-escalating tweak: increasing `waitForTimeout` settle durations for flakiness (never lowering the 0.05 / 0.02 / inequality thresholds).

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v14-transition.spec.js
git commit -m "test(v14): e2e — transition overlay activates at seams, velocity-coupled, reduced-motion inert"
```

---

## Task 7: Full regression + status memory

- [ ] **Step 1: Full unit suite**

Run: `cd tma-web && npm test`
Expected: all green — SP-0/SP-1's 38 + `v14-boundaryState` (7) + `v14-overlayStyle` (6). Report totals (expect 51 pass / 0 fail).

- [ ] **Step 2: Full v14 e2e suite (regression-critical)**

Run: from `tma-web`, dev server running + both routes warmed (`/portfolio-v14` and `/portfolio-v14?frames=procedural`), then
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-kernel.spec.js playwright/tests/v14-reduced-motion.spec.js playwright/tests/v14-universe.spec.js playwright/tests/v14-transition.spec.js --project=laptop-1440`
Expected: ALL pass — kernel 3, reduced-motion 1, universe 2, transition 3.

**Regression watch (report BLOCKED if violated, do not mask):** the overlay adds a fixed `backdrop-filter` element. The SP-0 `v14-kernel.spec.js` "sustains >=55fps" test scrolls across the probe↔film seams where the overlay now activates with a real backdrop blur — if that test drops below 55fps, the overlay's blur cost is a genuine regression. Capture the actual fps. If it regressed, STOP and report BLOCKED with the number and the diagnosis (candidate mitigations for a follow-up: cap `blurPx`, or only apply `backdrop-filter` above an opacity threshold) — do NOT lower the 55 threshold.

- [ ] **Step 3: Update status memory**

Edit `C:\Users\Pc\.claude\projects\c--Users-Pc-Downloads-the-motion-agency-web-main\memory\v14-scene-engine-status.md`: note SP-2A (cross-scene transition system) **built & verified** — `SceneController` shared-rAF driver blends adjacent-scene seams via pure `boundaryState`+`overlayStyle`, velocity-coupled DOM overlay, reduced-motion inert, SP-0/SP-1 specs still green (record the measured kernel fps). SP-2B (manifesto + Foodics/Zid chapters) is next. Update the one-line MEMORY.md pointer.

- [ ] **Step 4: Final commit**

```bash
git add docs/superpowers/plans/2026-05-17-portfolio-v14-transition-system.md
git commit -m "chore(v14): SP-2A transition system complete — unit + e2e green" || echo "nothing extra to commit"
```

---

## Self-Review

**Spec coverage:**
- §3 driver architecture (controller shared-rAF, scenes report progress, scroll O(1)) → Tasks 3, 4.
- §3 DOM overlay, no WebGL → Task 3 (writes `backdrop-filter`/`background`/`transform`/`opacity`; no GL).
- §3 seam model `SEAM=0.18`, last-fraction→next → Task 1 + SEAM constant in Task 3.
- §4.1 `boundaryState` (all null/edge/clamp cases) → Task 1 (7 tests).
- §4.2 `overlayStyle` (transitions compose, `VEL_REF=3000`/`VEL_GAIN=0.6` clamp, color lerp, endpoint inert) → Task 2 (6 tests).
- §5 SceneController extension (`reportProgress`, shared rAF, null→opacity 0 + clear blur, reduced-motion no-start, overlay lookup guard) → Task 3.
- §6 useScene (`bleed` default `#000`, register carries it, `reportProgress` in onUpdate + reduced branch, deps add `bleed`) → Task 4.
- §7 scene wiring (IntroFilm `#000`, ProbeA `#08070b`, ProbeB `#0b0708`) → Task 5.
- §8 reduced motion / unparseable color / <2 scenes / overlay-missing guards → Tasks 1,2,3 + asserted Task 6.
- §9 verification (boundaryState+overlayStyle node:test; Playwright seam-activation, velocity, reduced-motion; SP-0/SP-1 regression incl. fps watch) → Tasks 1,2,6,7.
- §10 out-of-scope (no content, no WebGL, transitions.js/sceneRegistry.js untouched) — respected; Task 5 only adds a prop, no SP-2B content.

**Placeholder scan:** no TBD/TODO; every code step has complete code; every run step has an expected result and a concrete failure-diagnosis path.

**Type/name consistency:** `boundaryState(sceneProgresses, seam)→{fromId,toId,t}|null` (Task 1) consumed exactly in Task 3; `overlayStyle(t,velocity,fromColor,toColor)→{blurPx,scale,bleedColor,bleedAlpha,opacity}` (Task 2) consumed in Task 3 with `s.opacity * s.bleedAlpha` per spec §5; `reportProgress(id,progress)` defined in Task 3 API, called in Task 4; `bleed` param Task 4 ↔ registry entry read as `?.bleed` in Task 3 ↔ passed by scenes in Task 5; `SEAM=0.18` (Task 3) matches the seam default tested in Task 1; overlay selector `[data-v14-transition-overlay]` identical in Task 3 (write) and Task 6 (read).

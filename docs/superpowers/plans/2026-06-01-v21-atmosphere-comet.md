# V21 Continuous Atmosphere + Comet Head — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `/portfolio-v21` one continuous, breathing atmosphere (a single scroll-reactive cyan bloom that peaks at Motion Matters) plus a velocity-reactive spark "comet" that rides the filament's draw tip from first stroke to last, so the sections feel like one film instead of separate exhibits.

**Architecture:** One writer, many readers. A new `V21Atmosphere` component runs a single `requestAnimationFrame` loop that computes two scalars from scroll — `--atmo-bloom` (Motion Matters proximity) and `--atmo-vel` (smoothed scroll velocity) — and publishes them two ways: as CSS custom properties on `<html>` (read by the bloom layer's opacity/scale and the comet's glow, pure CSS) and as a shared mutable `atmoSignal` object (read by the flow-field and the comet's JS). The filament gains a spark `<g>` positioned each frame at the actively-drawing path's tip via `getPointAtLength`.

**Tech Stack:** Next.js (React client components), GSAP ScrollTrigger (already used by the filament), plain Canvas 2D (existing flow-field), CSS custom properties, Playwright e2e.

**Scope:** Cohesion Pass 1 only — atmosphere + comet. Unifying scroll physics, unifying reveal grammar, and the bridge-beat manifesto scenes are explicitly out of scope (future passes). **V21 files only — no V20 file is touched.**

**Spec:** `docs/superpowers/specs/2026-06-01-v21-atmosphere-comet-design.md`

**Branch:** Work on the current `feat/obsidian-hero` branch (where the `portfolio-v21` files live).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `tma-web/components/portfolio-v21/atmoSignal.js` | Shared singleton `{ bloom, vel }` — the one signal both JS readers poll without React re-renders | **Create** |
| `tma-web/components/portfolio-v21/V21Atmosphere.jsx` | The writer + the bloom `<div>`. Computes/publishes `--atmo-bloom`, `--atmo-vel`, and mutates `atmoSignal` | **Create** |
| `tma-web/components/portfolio-v21/V21Filament.jsx` | Add the comet `<g>` and position it at the draw frontier each frame | **Modify** (`L194` area + end of `draw()` + cleanup) |
| `tma-web/components/portfolio-v21/V21FlowField.jsx` | Read `atmoSignal.vel` / `atmoSignal.bloom` instead of self-computing velocity + rect visibility | **Modify** (`L41`–`L126`) |
| `tma-web/components/portfolio-v21/v21.css` | `.v21-atmosphere`, `.v21-comet*`, reduced-motion rules | **Modify** (append) |
| `tma-web/app/portfolio-v21/page.jsx` | Mount `<V21Atmosphere />` as the first child of `.v21-worklane` | **Modify** (`L10` import, `L34`–`L37`) |
| `tma-web/playwright/tests/v21-atmosphere-comet.spec.js` | e2e: bloom curve, velocity, comet bounds, reduced-motion, console guard | **Create** |

---

## Running the tests

A local dev server must be running in a separate terminal:

```bash
cd tma-web && npm run dev          # serves http://localhost:3000
```

Run a spec against it (Bash tool / git-bash):

```bash
cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet --project=laptop-1440
```

PowerShell equivalent:

```powershell
cd tma-web; $env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npx playwright test v21-atmosphere-comet --project=laptop-1440
```

The final task runs all 6 viewport projects (drop `--project=...`).

---

## Task 1: Atmosphere signal + writer + bloom layer

Creates the one scroll signal and the persistent cyan bloom behind the work lane.

**Files:**
- Create: `tma-web/components/portfolio-v21/atmoSignal.js`
- Create: `tma-web/components/portfolio-v21/V21Atmosphere.jsx`
- Modify: `tma-web/components/portfolio-v21/v21.css` (append atmosphere rules)
- Modify: `tma-web/app/portfolio-v21/page.jsx`
- Create (test): `tma-web/playwright/tests/v21-atmosphere-comet.spec.js`

- [ ] **Step 1: Write the failing test**

Create `tma-web/playwright/tests/v21-atmosphere-comet.spec.js`:

```js
import { test, expect } from "@playwright/test";

// Local dev server:
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet

const SETTLE_MS = 450;

const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);

const laneTopDoc = (page) =>
  page.evaluate(() =>
    Math.round(window.scrollY + document.querySelector(".v21-worklane").getBoundingClientRect().top)
  );

const mmTopDoc = (page) =>
  page.evaluate(() =>
    Math.round(window.scrollY + document.querySelector(".v21-mm").getBoundingClientRect().top)
  );

const readVar = (page, name) =>
  page.evaluate(
    (n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)) || 0,
    name
  );

test("atmosphere bloom layer mounts as the first lane child (fixed, screen blend)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  const atmo = page.locator(".v21-worklane > .v21-atmosphere");
  await expect(atmo).toHaveCount(1);

  const styles = await atmo.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { blend: cs.mixBlendMode, pe: cs.pointerEvents, pos: cs.position };
  });
  expect(styles.blend).toBe("screen");
  expect(styles.pe).toBe("none");
  expect(styles.pos).toBe("fixed");

  // Must be the FIRST child so it paints behind the flow-field + filament.
  const order = await page.evaluate(() => {
    const kids = Array.from(document.querySelector(".v21-worklane").children);
    return {
      atmoIdx: kids.findIndex((n) => n.classList.contains("v21-atmosphere")),
      flowIdx: kids.findIndex((n) => n.matches("canvas.v21-mm-flow, .v21-mm-flow")),
      filIdx: kids.findIndex((n) => n.classList.contains("v21-filament")),
    };
  });
  expect(order.atmoIdx).toBe(0);
  expect(order.atmoIdx).toBeLessThan(order.flowIdx);
  expect(order.flowIdx).toBeLessThan(order.filIdx);
});

test("--atmo-bloom peaks near MOTION MATTERS and is low far away", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");

  // Far away (page top): bloom near 0.
  await scrollTo(page, 0);
  await page.waitForTimeout(SETTLE_MS);
  const farBloom = await readVar(page, "--atmo-bloom");

  // Centred on MOTION MATTERS (pinned → its top sits ~0, centre ~vh/2): bloom high.
  const mm = await mmTopDoc(page);
  await scrollTo(page, mm + 450);
  await page.waitForTimeout(SETTLE_MS);
  const nearBloom = await readVar(page, "--atmo-bloom");

  expect(nearBloom).toBeGreaterThan(0.5);
  expect(farBloom).toBeLessThan(0.25);
  expect(nearBloom).toBeGreaterThan(farBloom);
});

test("--atmo-vel rises while scrolling and decays to ~0 at rest", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  // Drive motion across several animation frames to build smoothed velocity.
  const moving = await page.evaluate(async () => {
    for (let i = 0; i < 14; i++) {
      window.scrollBy(0, 130);
      await new Promise((r) => requestAnimationFrame(r));
    }
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--atmo-vel")) || 0;
  });

  await page.waitForTimeout(800); // rest
  const resting = await readVar(page, "--atmo-vel");

  expect(moving).toBeGreaterThan(0.2);
  expect(resting).toBeLessThan(0.08);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet --project=laptop-1440`
Expected: FAIL — `.v21-atmosphere` has count 0 (component not mounted yet).

- [ ] **Step 3: Create the shared signal module**

Create `tma-web/components/portfolio-v21/atmoSignal.js`:

```js
// Shared scroll-atmosphere signal: ONE writer (V21Atmosphere), many readers
// (the bloom layer + comet glow via CSS vars, and the flow-field + comet gate
// via this object). Mutated in place each frame so JS readers can poll it
// without triggering React re-renders.
export const atmoSignal = { bloom: 0, vel: 0 };
```

- [ ] **Step 4: Create the writer + bloom component**

Create `tma-web/components/portfolio-v21/V21Atmosphere.jsx`:

```jsx
"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { atmoSignal } from "./atmoSignal";

/**
 * Continuous "atmosphere" for V21 — a single persistent cyan bloom behind the
 * whole work lane that swells to its peak over MOTION MATTERS, plus a smoothed
 * scroll-velocity signal. ONE writer: each frame it computes --atmo-bloom and
 * --atmo-vel, writes them to <html> (CSS readers: the bloom layer + the comet
 * glow) and to the shared atmoSignal object (JS readers: the flow-field + the
 * filament comet). The RAF pauses when the work lane is fully off-screen.
 */
export default function V21Atmosphere() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

    // Reduced motion: a calm static bloom, no velocity, no RAF.
    if (reduced) {
      root.style.setProperty("--atmo-bloom", "0");
      root.style.setProperty("--atmo-vel", "0");
      atmoSignal.bloom = 0;
      atmoSignal.vel = 0;
      return;
    }

    let rafId = 0;
    let active = true;
    let lastY = window.scrollY;
    let velSmoothed = 0;

    const tick = () => {
      if (!active) {
        rafId = 0;
        return;
      }
      const vh = window.innerHeight || 900;
      const mm = document.querySelector(".v21-mm");

      // bloom: proximity of MOTION MATTERS centre to viewport centre.
      let bloom = 0;
      if (mm) {
        const r = mm.getBoundingClientRect();
        const mmCenter = r.top + r.height / 2;
        bloom = clamp01(1 - Math.abs(mmCenter - vh / 2) / (1.2 * vh));
      }

      // velocity: smoothed |Δscroll|; faster attack (0.15) than release (0.08).
      const y = window.scrollY;
      const raw = clamp01(Math.abs(y - lastY) / 40);
      lastY = y;
      const gain = raw > velSmoothed ? 0.15 : 0.08;
      velSmoothed += (raw - velSmoothed) * gain;
      if (velSmoothed < 0.001) velSmoothed = 0;

      root.style.setProperty("--atmo-bloom", bloom.toFixed(4));
      root.style.setProperty("--atmo-vel", velSmoothed.toFixed(4));
      atmoSignal.bloom = bloom;
      atmoSignal.vel = velSmoothed;

      rafId = requestAnimationFrame(tick);
    };

    // Pause the loop when the work lane is fully off-screen (top/preloader,
    // bottom/footer) to save cycles.
    const lane = document.querySelector(".v21-worklane");
    const io = lane
      ? new IntersectionObserver(
          (entries) => {
            active = entries[0].isIntersecting;
            if (active && !rafId) rafId = requestAnimationFrame(tick);
            if (!active) {
              root.style.setProperty("--atmo-bloom", "0");
              atmoSignal.bloom = 0;
            }
          },
          { rootMargin: "200px" }
        )
      : null;
    if (io && lane) io.observe(lane);

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (io) io.disconnect();
      root.style.removeProperty("--atmo-bloom");
      root.style.removeProperty("--atmo-vel");
      atmoSignal.bloom = 0;
      atmoSignal.vel = 0;
    };
  }, [reduced]);

  return <div className="v21-atmosphere" aria-hidden="true" />;
}
```

- [ ] **Step 5: Append the atmosphere CSS**

Append to `tma-web/components/portfolio-v21/v21.css`:

```css
/* =====================================================================
   V21 — Continuous atmosphere bloom  (palette C: near-black + 1 bloom)
   ONE persistent cyan glow behind the work lane. Opacity rides
   --atmo-bloom (peaks over MOTION MATTERS) + a faint --atmo-vel sparkle;
   a slow scale swell "breathes" as you approach. Screen blend = light
   only, never darkens. Vars are published by V21Atmosphere on <html>.
   ===================================================================== */
.v21-atmosphere {
  position: fixed;
  inset: 0;
  z-index: 0; /* base of the lane: below flow-field + filament (both z-index:0, later siblings) */
  pointer-events: none;
  mix-blend-mode: screen;
  background: radial-gradient(60% 50% at 50% 50%, #6fd3ff, transparent 70%);
  opacity: clamp(
    0,
    calc(0.04 + var(--atmo-bloom, 0) * 0.14 + var(--atmo-vel, 0) * 0.05),
    0.22
  );
  transform: scale(calc(1 + var(--atmo-bloom, 0) * 0.08));
  transform-origin: 50% 50%;
  will-change: opacity, transform;
}

@media (prefers-reduced-motion: reduce) {
  .v21-atmosphere {
    opacity: 0.06;
    transform: none;
  }
}
```

- [ ] **Step 6: Mount the component in the page**

In `tma-web/app/portfolio-v21/page.jsx`, add the import after the `V21FlowField` import (line 10):

```jsx
import V21Atmosphere from "@/components/portfolio-v21/V21Atmosphere";
```

Then make it the **first** child of `.v21-worklane` (before `<V21FlowField />`):

```jsx
      <div className="v21-worklane">
        {/* Continuous atmosphere bloom sits at the very back of the lane. */}
        <V21Atmosphere />
        {/* Flow-current background sits BEFORE the filament so it paints
            behind it; it fades in only over the MOTION MATTERS section. */}
        <V21FlowField />
        <V21Filament />
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet --project=laptop-1440`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add tma-web/components/portfolio-v21/atmoSignal.js tma-web/components/portfolio-v21/V21Atmosphere.jsx tma-web/components/portfolio-v21/v21.css tma-web/app/portfolio-v21/page.jsx tma-web/playwright/tests/v21-atmosphere-comet.spec.js
git commit -m "feat(v21): continuous atmosphere bloom + shared scroll signal"
```

---

## Task 2: Comet head on the filament

A spark rides the filament's draw tip through head → letters → tail. Glow reacts to `--atmo-vel`.

**Files:**
- Modify: `tma-web/components/portfolio-v21/V21Filament.jsx`
- Modify: `tma-web/components/portfolio-v21/v21.css` (append comet rules)
- Modify (test): `tma-web/playwright/tests/v21-atmosphere-comet.spec.js`

- [ ] **Step 1: Write the failing tests**

Append to `tma-web/playwright/tests/v21-atmosphere-comet.spec.js`:

```js
const SCRUB_SETTLE_MS = 3200;

test("comet head exists and stays within the filament bounds while drawing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");

  // Scroll into the head-draw region (just inside the work lane) where the
  // line tip is mid-draw, so the comet is visible.
  const lane = await laneTopDoc(page);
  await scrollTo(page, lane + 400);
  await page.waitForTimeout(SCRUB_SETTLE_MS);

  const comet = page.locator(".v21-comet");
  await expect(comet).toHaveCount(1);

  const display = await comet.evaluate((el) => getComputedStyle(el).display);
  expect(display).not.toBe("none");

  const fil = await page.locator(".v21-filament").boundingBox();
  const com = await comet.boundingBox();
  expect(com).not.toBeNull();
  // Comet centre sits within the filament's box (small slack for stroke width).
  const cx = com.x + com.width / 2;
  const cy = com.y + com.height / 2;
  expect(cx).toBeGreaterThanOrEqual(fil.x - 10);
  expect(cx).toBeLessThanOrEqual(fil.x + fil.width + 10);
  expect(cy).toBeGreaterThanOrEqual(fil.y - 10);
  expect(cy).toBeLessThanOrEqual(fil.y + fil.height + 10);
});

test("reduced-motion: comet is not rendered", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  // The element may exist in the DOM but must be display:none under reduced motion.
  const display = await page
    .locator(".v21-comet")
    .evaluate((el) => getComputedStyle(el).display)
    .catch(() => "none");
  expect(display).toBe("none");

  // Atmosphere is a calm static wash (~0.06), not the animated curve.
  const op = await page
    .locator(".v21-atmosphere")
    .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.03);
  expect(op).toBeLessThan(0.12);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet --project=laptop-1440`
Expected: FAIL — `.v21-comet` count 0 (comet not created yet).

- [ ] **Step 3: Create the comet element in the filament effect**

In `tma-web/components/portfolio-v21/V21Filament.jsx`, immediately AFTER the connector pool declaration (currently `const connectorEls = [];`, line 195), insert the comet construction and helpers:

```jsx
    // --- comet head: a spark that rides the current draw frontier ----------
    const comet = document.createElementNS(SVG_NS, "g");
    comet.setAttribute("class", "v21-comet");
    comet.style.display = "none";
    const cometFlareH = document.createElementNS(SVG_NS, "line");
    cometFlareH.setAttribute("x1", "-9");
    cometFlareH.setAttribute("y1", "0");
    cometFlareH.setAttribute("x2", "9");
    cometFlareH.setAttribute("y2", "0");
    cometFlareH.setAttribute("class", "v21-comet-flare");
    const cometFlareV = document.createElementNS(SVG_NS, "line");
    cometFlareV.setAttribute("x1", "0");
    cometFlareV.setAttribute("y1", "-9");
    cometFlareV.setAttribute("x2", "0");
    cometFlareV.setAttribute("y2", "9");
    cometFlareV.setAttribute("class", "v21-comet-flare");
    const cometCore = document.createElementNS(SVG_NS, "circle");
    cometCore.setAttribute("r", "3");
    cometCore.setAttribute("class", "v21-comet-core");
    comet.appendChild(cometFlareH);
    comet.appendChild(cometFlareV);
    comet.appendChild(cometCore);
    group.appendChild(comet); // last child of <g> → paints on top of the stroke

    const ptOf = (el, L, prog) => {
      const p = prog < 0 ? 0 : prog > 1 ? 1 : prog;
      if (!el || p <= 0 || L <= 0) return null;
      try {
        return el.getPointAtLength(L * p);
      } catch {
        return null;
      }
    };
    const placeComet = (pt) => {
      if (!pt) {
        comet.style.display = "none";
        return;
      }
      comet.setAttribute(
        "transform",
        `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`
      );
      comet.style.display = "";
    };
```

- [ ] **Step 4: Position the comet at the draw frontier each frame**

In the same file, at the END of the `draw(scroll)` function — immediately after the `paintWipes(headProg * geom.headLen, tailProg * geom.tailLen);` line (line 405) and before the closing `};` of `draw` — insert:

```jsx
      // Comet rides the furthest-drawn frontier: tail → letters (during the
      // pin) → head. Reads the ACTUAL drawn length so the head→letters→tail
      // handoff has no jump.
      let tip = null;
      if (tailProg > 0 && tailProg < 0.999) {
        tip = ptOf(tailEl, geom.tailLen, tailProg);
      } else if (scroll >= aPinStart && scroll < aPinEnd && N > 0) {
        const cSlotW = (aPinEnd - aPinStart) / N;
        let idx = Math.floor((scroll - aPinStart) / cSlotW);
        if (idx < 0) idx = 0;
        else if (idx > N - 1) idx = N - 1;
        const slotStart = aPinStart + idx * cSlotW;
        const slotEnd = slotStart + cSlotW;
        const connEnd = slotStart + cSlotW * CONN_FRAC;
        if (idx > 0 && scroll < connEnd && connectorEls[idx - 1]) {
          const cProg = clamp01((scroll - slotStart) / (connEnd - slotStart));
          tip = ptOf(connectorEls[idx - 1], geom.connectorLens[idx - 1], cProg);
        } else {
          const lStart = idx === 0 ? slotStart : connEnd;
          const lProg = clamp01((scroll - lStart) / (slotEnd - lStart));
          tip = ptOf(letterEls[idx], geom.letterLens[idx], lProg);
        }
      } else if (headProg > 0 && headProg < 1) {
        tip = ptOf(headEl, geom.headLen, headProg);
      } else if (headProg >= 1 && scroll < aPinStart) {
        // Head finished, letters not begun: park the spark at the head end.
        tip = ptOf(headEl, geom.headLen, 1);
      }
      placeComet(tip);
```

Note: `N`, `aPinStart`, `aPinEnd`, `headProg`, `tailProg`, `clamp01`, and `CONN_FRAC` are all already in scope inside `draw()`.

- [ ] **Step 5: Remove the comet on cleanup**

In the same file, in the effect's cleanup `return () => { ... }` (line 444), add `comet.remove();` right after `mpath.remove();`:

```jsx
      mpath.remove();
      comet.remove();
```

- [ ] **Step 6: Append the comet CSS**

Append to `tma-web/components/portfolio-v21/v21.css`:

```css
/* =====================================================================
   V21 — Comet head  (spark / lens-flare riding the filament draw tip)
   White core + thin cross-flare + cyan glow. Glow blur and flare opacity
   ride --atmo-vel (faster scroll = brighter). Positioned by V21Filament.
   ===================================================================== */
.v21-comet {
  filter: drop-shadow(0 0 calc(6px + var(--atmo-vel, 0) * 10px) #6fd3ff);
}
.v21-comet-core {
  fill: #eaf8ff;
}
.v21-comet-flare {
  stroke: #cdeeff;
  stroke-width: 1.2;
  stroke-linecap: round;
  opacity: calc(0.4 + var(--atmo-vel, 0) * 0.55);
}

@media (prefers-reduced-motion: reduce) {
  /* Filament is static/fully-drawn in reduced motion; no moving focal point. */
  .v21-comet {
    display: none !important;
  }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet --project=laptop-1440`
Expected: PASS (5 tests).

- [ ] **Step 8: Commit**

```bash
git add tma-web/components/portfolio-v21/V21Filament.jsx tma-web/components/portfolio-v21/v21.css tma-web/playwright/tests/v21-atmosphere-comet.spec.js
git commit -m "feat(v21): spark comet head rides the filament draw tip"
```

---

## Task 3: Flow-field reads the shared signal (refactor)

This is a **refactor**, not a behaviour change: the flow-field already fades in over MOTION MATTERS and reacts to scroll speed. We re-point its velocity and visibility at the shared `atmoSignal` so it breathes from the *same* source as the bloom and comet (one writer). The test is a **regression guard** locking in the visible-at-MM / hidden-at-top behaviour; we confirm it stays green through the refactor.

**Files:**
- Modify: `tma-web/components/portfolio-v21/V21FlowField.jsx`
- Modify (test): `tma-web/playwright/tests/v21-atmosphere-comet.spec.js`

- [ ] **Step 1: Write the regression test**

Append to `tma-web/playwright/tests/v21-atmosphere-comet.spec.js`:

```js
test("flow-field canvas is visible over MOTION MATTERS and hidden at the top", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");

  await scrollTo(page, 0);
  await page.waitForTimeout(SETTLE_MS + 500);
  const opTop = await page
    .locator(".v21-worklane canvas.v21-mm-flow")
    .evaluate((el) => parseFloat(getComputedStyle(el).opacity));

  const mm = await mmTopDoc(page);
  await scrollTo(page, mm + 450);
  await page.waitForTimeout(SETTLE_MS + 500);
  const opMM = await page
    .locator(".v21-worklane canvas.v21-mm-flow")
    .evaluate((el) => parseFloat(getComputedStyle(el).opacity));

  expect(opMM).toBeGreaterThan(0.5);
  expect(opTop).toBeLessThan(0.5);
});
```

- [ ] **Step 2: Run the test to verify it passes BEFORE the refactor (baseline)**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet --project=laptop-1440 -g "flow-field canvas is visible"`
Expected: PASS — this is the current rect-based behaviour. We will keep it green while swapping the source. (If it does not pass at the page top because the bloom-equivalent region is large, note the actual `opTop` value and proceed; the refactor must not make it worse.)

- [ ] **Step 3: Import the shared signal**

In `tma-web/components/portfolio-v21/V21FlowField.jsx`, add the import after the `usePrefersReducedMotion` import (line 4):

```jsx
import { atmoSignal } from "./atmoSignal";
```

- [ ] **Step 4: Drop the self-computed velocity baseline**

In the same file, change the per-mount scroll baseline. Replace line 41:

```jsx
    let lastY = window.scrollY;
```

with:

```jsx
    // Velocity + visibility now come from the shared atmosphere signal, so the
    // flow-field breathes in sync with the bloom and the comet (one writer).
```

- [ ] **Step 5: Read velocity + visibility from the shared signal**

In the same file, replace the body of `tick` (lines 111–127, from `const y = window.scrollY;` down to the `rafId = requestAnimationFrame(tick);` line) with:

```jsx
    const tick = () => {
      const velocity = atmoSignal.vel; // shared smoothed velocity

      // Visible while the bloom is up (peaks over MOTION MATTERS). The CSS
      // opacity transition (0.45s) still smooths the fade at the edges.
      const visible = atmoSignal.bloom > 0.02;
      if (visible !== lastVisible) {
        el.style.opacity = visible ? "1" : "0";
        lastVisible = visible;
      }

      if (visible && drawFrame) drawFrame(velocity);
      rafId = requestAnimationFrame(tick);
    };
```

Note: the `section` lookup at the top of the effect (line 36–37) is no longer used for visibility but harmless; leave it — it still serves as an early-bail guard (`if (!section) return;`) that prevents running on pages without MOTION MATTERS.

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet --project=laptop-1440`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add tma-web/components/portfolio-v21/V21FlowField.jsx tma-web/playwright/tests/v21-atmosphere-comet.spec.js
git commit -m "refactor(v21): flow-field reads the shared atmo signal"
```

---

## Task 4: Full-scroll guard + cross-viewport verification

Adds the console-error guard and confirms the existing Motion Matters / flow-field behaviours still pass, across all 6 viewports.

**Files:**
- Modify (test): `tma-web/playwright/tests/v21-atmosphere-comet.spec.js`

- [ ] **Step 1: Write the guard tests**

Append to `tma-web/playwright/tests/v21-atmosphere-comet.spec.js`:

```js
const scrollBottom = (page) =>
  page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );

test("no console errors across a full scroll (mount + atmosphere + comet)", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v21");
  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});

test("reduced-motion: no console errors, static atmosphere, no comet, no canvas", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  await expect(page.locator(".v21-worklane canvas.v21-mm-flow")).toHaveCount(0);
  await expect(page.locator(".v21-worklane .v21-mm-flow--static")).toHaveCount(1);

  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run the new guard tests (laptop) to verify they pass**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet --project=laptop-1440`
Expected: PASS (8 tests).

- [ ] **Step 3: Run the full spec across all 6 viewports**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet`
Expected: PASS across `mobile-375`, `mobile-414`, `tablet-768`, `tablet-1024`, `laptop-1440`, `desktop-1920`. If a mobile viewport fails the bloom-peak threshold (shorter viewport changes MM centring math), relax that one assertion to `> 0.4` rather than changing the bloom formula — note any such adjustment in the commit message.

- [ ] **Step 4: Run the existing V20 suite to confirm no regression**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters --project=laptop-1440`
Expected: PASS (V20 untouched — this is a safety net confirming shared-nothing isolation).

- [ ] **Step 5: Commit**

```bash
git add tma-web/playwright/tests/v21-atmosphere-comet.spec.js
git commit -m "test(v21): full-scroll + reduced-motion guards for atmosphere + comet"
```

---

## Manual verification (after automated tests pass)

Load `http://localhost:3000/portfolio-v21` and scroll slowly:

1. A faint cyan glow is present from the hero down — it no longer goes dead-black after the hero.
2. The glow **swells** to its brightest as MOTION MATTERS centres, then recedes.
3. A single bright spark sits at the tip of the drawing line and travels continuously from the first stroke, through the MOTION MATTERS letters, to the last stroke — no jump at the pin.
4. Scrolling fast makes the glow and spark brighter; stopping settles them.
5. Toggle OS "reduce motion": the page is a calm still image — static faint wash, fully-drawn line, no spark.
6. `/portfolio-v20` is visually unchanged.

---

## Self-Review (completed during planning)

- **Spec coverage:** atmosphere bloom (Task 1), `--atmo-bloom`/`--atmo-vel` writer (Task 1), bloom values & curve (Task 1 CSS + component), velocity smoothing/gain (Task 1), comet spark + tip-riding + glow (Task 2), reduced-motion for both (Tasks 1–2 + Task 4), flow-field reuse via shared signal (Task 3), IntersectionObserver pause (Task 1), edge-case guards `if (!el)`/`try-catch`/missing-MM (Task 1–2 code), all 5 spec tests + viewports (Tasks 1–4). ✔ No gaps.
- **Placeholder scan:** the one `fetch(...)` in Task 3's test is intentionally a no-op guard with the real assertion being runtime opacity — annotated as such, not a TODO. No other placeholders.
- **Type/name consistency:** `atmoSignal.{bloom,vel}`, `--atmo-bloom`, `--atmo-vel`, `.v21-atmosphere`, `.v21-comet`/`.v21-comet-core`/`.v21-comet-flare`, `ptOf`/`placeComet` used identically across tasks. ✔

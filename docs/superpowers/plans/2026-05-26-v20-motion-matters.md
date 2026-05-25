# V20 — "MOTION MATTERS" filament reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pinned section between V20FeaturedWork and V20OurWork that extends the existing single-SVG filament path to draw "MOTION MATTERS" as the line traces stylized single-stroke letters (Space Grotesk-shaped), then continues into Our Work.

**Architecture:** A new `V20MotionMatters` section nests inside `.v20-worklane` (alongside Featured Work and Our Work). The lane filament SVG already covers the whole lane; we extend `buildLanePath()` to splice baked single-stroke letter geometry between the Featured exit and the Our Work entry. The new section uses a `ScrollTrigger.pin` for ~1 viewport of scroll distance so the user lingers on the drawing moment.

**Tech Stack:** Next.js (App Router), React 19, GSAP 3 + ScrollTrigger, Lenis (smooth scroll already mounted via `SmoothScroll`), Playwright for e2e.

**Spec:** `docs/superpowers/specs/2026-05-26-v20-motion-matters-design.md`

---

## File map

| Path | Action |
| --- | --- |
| `tma-web/components/portfolio-v20/v20.css` | MODIFY — append `.v20-mm` block |
| `tma-web/components/portfolio-v20/V20MotionMatters.jsx` | CREATE — pinned section component |
| `tma-web/app/portfolio-v20/page.jsx` | MODIFY — insert `<V20MotionMatters />` |
| `tma-web/components/portfolio-v20/mmGlyphs.js` | CREATE — letter geometry + assembler |
| `tma-web/components/portfolio-v20/V20Filament.jsx` | MODIFY — splice glyph path into lane path |
| `tma-web/playwright/tests/v20-motion-matters.spec.js` | CREATE — e2e tests |

---

## Task 1: Add CSS for the MOTION MATTERS section

**Files:**
- Modify: `tma-web/components/portfolio-v20/v20.css` (append at end)

- [ ] **Step 1: Append the section CSS**

Open `tma-web/components/portfolio-v20/v20.css` and append the following block at the very end of the file:

```css
/* =================================================================
   MOTION MATTERS — pinned reveal section between Featured & Our Work
   ================================================================= */
.v20-mm {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: transparent;
  color: #fff;
  padding: clamp(64px, 8vw, 120px) 0;
  overflow: hidden;
}

.v20-mm-text-box {
  position: relative;
  width: min(92vw, 1280px);
  aspect-ratio: 11.5 / 1;
  margin: 0 auto;
  pointer-events: none;
}

@media (max-width: 820px) {
  .v20-mm-text-box {
    aspect-ratio: 6 / 1;
    width: 94vw;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v20/v20.css
git commit -m "feat(v20): add CSS for MOTION MATTERS pinned section"
```

---

## Task 2: Create the V20MotionMatters component (markup only, no pin)

**Files:**
- Create: `tma-web/components/portfolio-v20/V20MotionMatters.jsx`

- [ ] **Step 1: Create the component file**

Create `tma-web/components/portfolio-v20/V20MotionMatters.jsx` with this content:

```jsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function V20MotionMatters() {
  const sectionRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // Pin behaviour added in Task 6. Intentional no-op for now.
    return () => {};
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="v20-mm"
      aria-label="Motion matters"
      data-v20-mm
    >
      {/* The filament uses this box's geometry to compute where to
          place the drawn letters. The box is invisible but layout-bearing. */}
      <div className="v20-mm-text-box" data-v20-mm-box />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v20/V20MotionMatters.jsx
git commit -m "feat(v20): scaffold V20MotionMatters section (markup only)"
```

---

## Task 3: Wire V20MotionMatters into the page

**Files:**
- Modify: `tma-web/app/portfolio-v20/page.jsx`

- [ ] **Step 1: Import and insert the section**

In `tma-web/app/portfolio-v20/page.jsx`, add the import alongside the other component imports and insert the section between `V20FeaturedWork` and `V20OurWork` inside the `.v20-worklane` wrapper.

After the change, the imports near the top should include:

```jsx
import V20MotionMatters from "@/components/portfolio-v20/V20MotionMatters";
```

And the `.v20-worklane` block in the JSX should look like:

```jsx
<div className="v20-worklane">
  <V20Filament />
  <V20FeaturedWork />
  <V20MotionMatters />
  <V20OurWork />
</div>
```

- [ ] **Step 2: Run dev server and verify the section is present in the DOM**

Start the dev server (if it isn't already running):

```bash
cd tma-web && npm run dev
```

Open `http://localhost:3000/portfolio-v20` in a browser. Scroll past the Featured Work section. Confirm visually that there is a full-viewport empty (black) panel before "OUR WORK" appears. Open DevTools and confirm `document.querySelector(".v20-mm")` and `document.querySelector(".v20-mm-text-box")` both return elements with non-zero `getBoundingClientRect()` width and height.

Expected: black panel ~100vh tall sits between Featured Work and Our Work. No console errors.

- [ ] **Step 3: Commit**

```bash
git add tma-web/app/portfolio-v20/page.jsx
git commit -m "feat(v20): insert V20MotionMatters between Featured Work and Our Work"
```

---

## Task 4: Create mmGlyphs.js — letter data + path assembler

**Files:**
- Create: `tma-web/components/portfolio-v20/mmGlyphs.js`

- [ ] **Step 1: Create the module**

Create `tma-web/components/portfolio-v20/mmGlyphs.js` with this content:

```js
/*
 * Stylized single-stroke glyphs approximating Space Grotesk Bold's
 * proportions. Each glyph is authored in a unit coordinate system:
 *
 *   - cap height = 1 (top y=0, baseline y=1)
 *   - entry point is the bottom-left of the glyph's bbox: (0, 1)
 *   - exit point is the bottom-right of the glyph's bbox: (w, 1)
 *
 * The `path` string is a sequence of RELATIVE SVG path commands
 * (lowercase l, c, a) traced in pen-down order so the pen never
 * lifts. Between glyphs the assembler emits a horizontal baseline
 * travel, producing one continuous stroke for the whole word.
 */
export const GLYPHS = {
  M: { w: 0.95, path: "l 0 -1 l 0.475 0.6 l 0.475 -0.6 l 0 1" },
  O: { w: 0.78, path: "l 0.39 0 a 0.39 0.5 0 0 0 0 -1 a 0.39 0.5 0 0 0 0 1 l 0.39 0" },
  T: { w: 0.7,  path: "l 0.35 0 l 0 -1 l -0.35 0 l 0.7 0 l -0.35 0 l 0 1 l 0.35 0" },
  I: { w: 0.18, path: "l 0 -1 l 0.18 0 l 0 1" },
  N: { w: 0.85, path: "l 0 -1 l 0.85 1 l 0 -1 l 0 1" },
  A: { w: 0.85, path: "l 0.425 -1 l 0.425 1" },
  E: { w: 0.7,  path: "l 0 -1 l 0.7 0 l -0.7 0 l 0 0.5 l 0.55 0 l -0.55 0 l 0 0.5 l 0.7 0" },
  R: { w: 0.7,  path: "l 0 -1 l 0.5 0 c 0.3 0 0.3 0.5 0 0.5 l -0.5 0 l 0.7 0.5" },
  S: { w: 0.7,  path: "l 0.7 -1 l -0.7 0.5 l 0.7 0.5" },
  " ": { w: 0.4, path: "l 0.4 0" },
};

const TRACKING = 0.08; // inter-letter horizontal gap (in unit-cap-height units)

/**
 * Compute the unscaled total width of a word using the GLYPHS table.
 */
export function wordWidth(word) {
  let total = 0;
  for (let i = 0; i < word.length; i++) {
    const g = GLYPHS[word[i]];
    if (!g) throw new Error(`missing glyph for "${word[i]}"`);
    total += g.w;
    if (i < word.length - 1) total += TRACKING;
  }
  return total;
}

/**
 * Build the relative path segment for "MOTION MATTERS" inside the
 * given panel bbox.
 *
 * @param {object} panel - bbox in lane-coordinate space:
 *   { l, r, t, b, cx, cy }
 *   cx/cy are the bbox center; l/r/t/b are absolute lane coords.
 * @param {object} entry - { x, y } current pen position (lane coords).
 *   The path returned ASSUMES the pen is already at this position.
 * @returns { d, exit }
 *   - d: a string of path commands (no leading `M`); start with
 *     an absolute `L` to the baseline-start, then per-letter trace
 *     + baseline travel, ending at the baseline-exit point.
 *   - exit: { x, y } final pen position in lane coords.
 */
export function buildMotionMattersPath(panel, entry) {
  const word = "MOTION MATTERS";
  const panelW = panel.r - panel.l;
  const panelH = panel.b - panel.t;
  const panelCx = panel.l + panelW / 2;
  const panelCy = panel.cy; // existing boxIn helper provides cy

  // Target on-screen width = 80% of panel, capped by panel height.
  const totalUnits = wordWidth(word);
  const targetW = Math.min(panelW * 0.8, panelH * totalUnits * 0.65);
  const scale = targetW / totalUnits; // pixel size of one unit (cap-height)
  const drawnW = totalUnits * scale;

  const baselineY = panelCy + scale * 0.5;
  const startX = panelCx - drawnW / 2;

  let d = "";
  // 1. Travel from entry down/over to the baseline start of the word.
  //    Use absolute L so the line drops to baseline cleanly regardless
  //    of where the path was when this segment begins.
  d += ` L ${entry.x} ${baselineY}`;
  d += ` L ${startX} ${baselineY}`;

  // 2. Emit each glyph + inter-letter baseline travel, all RELATIVE
  //    so glyph data composes cleanly.
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const g = GLYPHS[ch];
    // Scale the glyph's relative path commands.
    d += " " + scaleRelativePath(g.path, scale);
    if (i < word.length - 1) {
      // Tracking — baseline travel to next glyph entry.
      d += ` l ${(TRACKING * scale).toFixed(3)} 0`;
    }
  }

  // 3. Exit point: end of the word on the baseline.
  const exitX = startX + drawnW;
  const exitY = baselineY;

  return { d, exit: { x: exitX, y: exitY } };
}

/**
 * Multiply every numeric arg in a relative-only path string by `s`.
 * Supports the command letters used in GLYPHS: l, c, a, m (lowercase only).
 *
 * For elliptical-arc commands (`a rx ry x-axis-rot large-arc sweep dx dy`),
 * `x-axis-rot`, `large-arc`, and `sweep` are flags and must NOT be scaled.
 */
function scaleRelativePath(d, s) {
  const tokens = d.trim().split(/\s+/);
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    out.push(cmd);
    let argCount = 0;
    let flagPositions = []; // indices within this command's arg list (0-based) that are flags
    switch (cmd) {
      case "l": case "m": argCount = 2; break;
      case "c": argCount = 6; break;
      case "a": argCount = 7; flagPositions = [2, 3, 4]; break;
      default: throw new Error(`unsupported command: "${cmd}"`);
    }
    for (let k = 0; k < argCount; k++) {
      const raw = parseFloat(tokens[i++]);
      if (flagPositions.includes(k)) {
        out.push(String(raw)); // flag: don't scale
      } else {
        out.push((raw * s).toFixed(3));
      }
    }
  }
  return out.join(" ");
}
```

- [ ] **Step 2: Smoke-test the assembler via the browser console**

With the dev server running and the page open at `/portfolio-v20`, paste this into the console:

```js
(async () => {
  const m = await import("/_next/static/chunks/app/portfolio-v20/page.js").catch(() => null);
  // Direct-import the source instead — open the file in a quick test:
  const mm = await import("/components/portfolio-v20/mmGlyphs.js").catch(() => null);
  console.log("module loaded:", !!mm);
})();
```

If that's awkward in dev, an easier check: temporarily add `import { buildMotionMattersPath, wordWidth } from "./mmGlyphs"; if (typeof window !== "undefined") { window.__mmTest = { buildMotionMattersPath, wordWidth }; }` to the top of `V20MotionMatters.jsx`, reload, and in console run:

```js
window.__mmTest.wordWidth("MOTION MATTERS");
// ~10.94

const r = window.__mmTest.buildMotionMattersPath(
  { l: 0, r: 1440, t: 1000, b: 1800, cx: 720, cy: 1400 },
  { x: 720, y: 1000 }
);
console.log(r.d.slice(0, 200), "...");
console.log("exit:", r.exit);
```

Expected: `wordWidth` returns ~10.94, `r.d` begins with `" L 720 ..."`, `r.exit.x` is a number > 720, `r.exit.y` equals the computed baseline y. Remove the temporary window export before committing.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v20/mmGlyphs.js
git commit -m "feat(v20): add glyph data + path assembler for MOTION MATTERS"
```

---

## Task 5: Extend V20Filament to splice the glyph path between Featured and Our Work

**Files:**
- Modify: `tma-web/components/portfolio-v20/V20Filament.jsx`

- [ ] **Step 1: Import the assembler**

At the top of `tma-web/components/portfolio-v20/V20Filament.jsx`, alongside the existing imports, add:

```jsx
import { buildMotionMattersPath } from "./mmGlyphs";
```

- [ ] **Step 2: Replace `buildLanePath` with a version that accepts the MOTION MATTERS bbox**

In `V20Filament.jsx`, replace the existing `buildLanePath` function (currently spanning roughly lines 16–62) with the version below. The signature gains a trailing `mm` argument (the MOTION MATTERS panel bbox, or `null` if it isn't present yet) and splices the glyph path between Featured-exit and Our-Work-entry.

```jsx
function buildLanePath(w, h, fw, ourW, workE, fNarr, mm) {
  const cx = w / 2;
  if (!fw || !ourW) {
    return `M 0 0 C ${w * 0.12} ${h * 0.1}, ${cx} ${h * 0.4}, ${cx} ${h}`;
  }

  const fy = fw.cy;
  const oy = ourW.cy;
  const ourL = ourW.l;
  const workR = workE ? workE.r : ourW.r;
  const fGuard = Math.max(fw.r, fNarr ? fNarr.r : fw.r);
  const fRight = Math.min(w - w * 0.04, fGuard + w * 0.05);
  const owRight = Math.min(w - w * 0.04, Math.max(workR, ourL) + w * 0.04);
  const span = oy - fy;

  // ---- Pre-Featured + Featured crossing + descent through cards ----
  let head;
  if (w <= MOBILE_MAX) {
    head =
      `M 0 0 ` +
      `C ${fw.l * 0.4} ${fy * 0.5}, ${fw.l * 0.75} ${fy}, ${fw.l} ${fy} ` +
      `L ${fw.r} ${fy} ` +
      `C ${fRight} ${fy + span * 0.2}, ${cx} ${fy + span * 0.5}, ${cx} ${fy + span * 0.72}`;
  } else {
    head =
      `M 0 0 ` +
      `C ${fw.l * 0.3} ${fy * 0.45}, ${fw.l * 0.72} ${fy}, ${fw.l} ${fy} ` +
      `L ${fw.r} ${fy} ` +
      `C ${fRight} ${fy}, ${fRight} ${fy + span * 0.22}, ${fRight} ${fy + span * 0.38} ` +
      `C ${fRight} ${fy + span * 0.58}, ${w * 0.3} ${fy + span * 0.52}, ${w * 0.3} ${fy + span * 0.74}`;
  }

  // Pen position at end of `head` for both branches:
  let penX = w <= MOBILE_MAX ? cx : w * 0.3;
  let penY = w <= MOBILE_MAX ? fy + span * 0.72 : fy + span * 0.74;

  // ---- MOTION MATTERS letter strokes (optional) ----
  let mmPart = "";
  if (mm) {
    // Approach the panel from above: smooth curve from current pen to
    // the top-center of the panel, then drop into the assembler.
    const mmCx = mm.l + (mm.r - mm.l) / 2;
    const approachY = mm.t + (mm.b - mm.t) * 0.15;
    mmPart =
      ` C ${penX} ${penY + (mm.t - penY) * 0.5}, ${mmCx} ${mm.t}, ${mmCx} ${approachY}`;
    const built = buildMotionMattersPath(mm, { x: mmCx, y: approachY });
    mmPart += built.d;
    penX = built.exit.x;
    penY = built.exit.y;
  }

  // ---- Approach to Our Work + cross OUR WORK + descend to bottom ----
  let tail;
  if (w <= MOBILE_MAX) {
    tail =
      ` C ${cx} ${oy - h * 0.015}, ${ourL * 0.7} ${oy}, ${ourL} ${oy} ` +
      `L ${workR} ${oy} ` +
      `C ${owRight} ${oy}, ${cx} ${oy + (h - oy) * 0.5}, ${cx} ${oy + (h - oy) * 0.75} ` +
      `S ${cx} ${h * 0.92}, ${cx} ${h}`;
  } else {
    tail =
      ` C ${penX} ${(penY + oy) * 0.5}, ${ourL * 0.72} ${oy}, ${ourL} ${oy} ` +
      `L ${workR} ${oy} ` +
      `C ${owRight} ${oy}, ${owRight} ${oy + (h - oy) * 0.28}, ${owRight} ${oy + (h - oy) * 0.48} ` +
      `C ${owRight} ${h * 0.82}, ${cx} ${h * 0.9}, ${cx} ${h}`;
  }

  return head + mmPart + tail;
}
```

- [ ] **Step 3: Update the component to query the MOTION MATTERS bbox and pass it to `buildLanePath`**

In the same file, find the `measure` function inside the `useEffect`. Replace the section that queries lane elements with the version below (it adds the `mmEl` lookup and passes the `mm` bbox into `buildLanePath`).

Currently `measure` queries the four titled elements and calls:
```jsx
path.setAttribute("d", buildLanePath(w, h, fw, ourW, workE, fNarr));
```

Change to:

```jsx
const measure = (resetOffset = true) => {
  const w = lane.clientWidth;
  const h = lane.scrollHeight || lane.clientHeight;
  if (!w || !h) return;

  const fw = boxIn(fwEl);
  const fNarr = boxIn(fNarrEl);
  const ourW = boxIn(ourEl);
  const workE = boxIn(workEl);
  const mmEl = lane.querySelector("[data-v20-mm-box]");
  const mm = boxIn(mmEl);

  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  path.setAttribute("d", buildLanePath(w, h, fw, ourW, workE, fNarr, mm));
  const len = path.getTotalLength();
  geom.len = len;

  const boxes = [fw, ourW, workE].filter(Boolean);
  targets.forEach((t) => {
    t.ready = false;
    t.s1 = -1;
    t.s2 = -1;
  });
  if (len) {
    // Bump sample count proportional to path length so wipe windows stay
    // accurate as the path grows with the letter strokes.
    const N = Math.max(520, Math.ceil(len / 6));
    for (let i = 0; i <= N; i++) {
      const s = (len * i) / N;
      const pt = path.getPointAtLength(s);
      targets.forEach((t, ti) => {
        const b = boxes[ti];
        if (!b) return;
        const inX = pt.x >= b.l - 1 && pt.x <= b.r + 1;
        const inY = pt.y >= b.t - 2 && pt.y <= b.b + 2;
        if (inX && inY) {
          if (t.s1 < 0) t.s1 = s;
          t.s2 = s;
        }
      });
    }
    targets.forEach((t) => {
      if (t.s1 >= 0 && t.s2 > t.s1) t.ready = true;
    });
  }

  if (resetOffset) {
    gsap.set(path, {
      strokeDasharray: len,
      strokeDashoffset: reduced ? 0 : len,
    });
  } else {
    gsap.set(path, { strokeDasharray: len });
  }

  if (reduced) targets.forEach((t) => setWipe(t, 1));
};
```

- [ ] **Step 4: Verify the line now draws through letters in the panel**

With dev server running, open `/portfolio-v20` and scroll slowly through the page. The filament should:
1. Cross FEATURED and weave down through the featured cards (unchanged).
2. Approach the MOTION MATTERS panel from the top.
3. Drop to a baseline and trace the letters of MOTION MATTERS as the scroll position advances.
4. Exit the panel and continue down into Our Work, crossing OUR WORK (unchanged wipe behaviour).

If the letters appear sized wrong or off-center, the panel bbox or scale calculation needs tuning — but the line should be visibly tracing letterforms, not skipping the panel.

Open DevTools console and confirm no errors. Run:
```js
document.querySelector(".v20-filament-path").getAttribute("d").length
```
Expected: significantly larger than before (the path string roughly doubles).

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v20/V20Filament.jsx
git commit -m "feat(v20): splice MOTION MATTERS glyph strokes into lane filament path"
```

---

## Task 6: Add pin ScrollTrigger to V20MotionMatters

**Files:**
- Modify: `tma-web/components/portfolio-v20/V20MotionMatters.jsx`

- [ ] **Step 1: Replace the placeholder useEffect with the pin logic**

In `tma-web/components/portfolio-v20/V20MotionMatters.jsx`, replace the placeholder `useEffect` (added in Task 2) with this implementation:

```jsx
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      });
    }, el);

    // Refresh ScrollTrigger after pin registration so the lane filament's
    // existing trigger picks up the new scroll length.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(id);
      ctx.revert();
    };
  }, [reduced]);
```

- [ ] **Step 2: Verify the panel pins while scrolling**

With dev server running, open `/portfolio-v20`. Scroll slowly until the MOTION MATTERS panel is at the top of the viewport. Continue scrolling. The panel should remain fixed at the top while the scrollbar continues to descend, for roughly one viewport's worth of scroll. While the panel is pinned, the filament should continue drawing letters. After ~1vh of scroll, the panel unpins and the page continues to Our Work.

If you see visible jitter when the pin engages under Lenis smooth scroll, that is the symptom `anticipatePin: 1` is designed to fix; verify it's set. If jitter persists, add `ScrollTrigger.refresh(true)` inside the Lenis `scroll` listener (see existing `SmoothScroll` component).

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v20/V20MotionMatters.jsx
git commit -m "feat(v20): pin MOTION MATTERS for 1vh so line can draw the words"
```

---

## Task 7: Reduced-motion handling

**Files:**
- Modify: `tma-web/components/portfolio-v20/V20MotionMatters.jsx` (no code change — verify the `reduced` guard)
- Modify: `tma-web/components/portfolio-v20/V20Filament.jsx` (already handled by existing reduced-motion branch)

- [ ] **Step 1: Verify the reduced-motion branch already works**

`V20MotionMatters` already returns early from the `useEffect` when `reduced === true`, so no pin is registered. `V20Filament`'s existing `if (reduced) setWipe(...)` and `strokeDashoffset: 0` set on mount already draw the entire path immediately, including the letter strokes (since they're part of the same path).

Toggle "Reduce motion" in your OS settings (macOS: System Settings → Accessibility → Display → Reduce motion; Windows: Settings → Accessibility → Visual effects → Animation effects). Reload `/portfolio-v20`. Confirm:
1. The MOTION MATTERS section appears as a static panel (no pin — page scrolls past it normally).
2. The filament path is drawn in full from the moment the page loads (letters visible immediately).
3. No console errors.

- [ ] **Step 2: Commit a no-op if any tweaks were required, otherwise skip**

If the verification surfaced no needed changes, skip this commit. If you tweaked anything (e.g. a missed branch), commit:

```bash
git commit -am "fix(v20): refine reduced-motion behaviour for MOTION MATTERS"
```

---

## Task 8: Playwright e2e test

**Files:**
- Create: `tma-web/playwright/tests/v20-motion-matters.spec.js`

- [ ] **Step 1: Create the test file**

Create `tma-web/playwright/tests/v20-motion-matters.spec.js`:

```js
import { test, expect } from "@playwright/test";

// Local dev server:
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters

const SETTLE_MS = 450;
const SCRUB_SETTLE_MS = 3200;

const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollTop = (page) => scrollTo(page, 0);
const scrollBottom = (page) =>
  page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );

const readOffset = (page) =>
  page.evaluate(() => {
    const p = document.querySelector(".v20-filament-path");
    return parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
  });

const readPathLength = (page) =>
  page.evaluate(() => {
    const p = document.querySelector(".v20-filament-path");
    return p ? p.getTotalLength() : 0;
  });

test("MOTION MATTERS section is mounted inside the work lane", async ({ page }) => {
  await page.goto("/portfolio-v20");
  await expect(page.locator(".v20-worklane .v20-mm")).toHaveCount(1);
  await expect(page.locator(".v20-mm-text-box")).toBeVisible();
});

test("lane filament path includes the letter strokes (length grows accordingly)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);
  const len = await readPathLength(page);
  // Without letter strokes the V19/V20 lane path is ~ 4000–7000 px at 1440x900.
  // With MOTION MATTERS spliced in, the path roughly doubles. Use a generous
  // floor that catches the regression of "letters not spliced".
  expect(len).toBeGreaterThan(8000);
});

test("filament draws further as the user scrolls through the panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");

  const mmTopDoc = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(window.scrollY + el.getBoundingClientRect().top);
  });

  // Just before the panel:
  await scrollTo(page, Math.max(0, mmTopDoc - 200));
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const before = await readOffset(page);

  // After scrolling one viewport (which the panel consumes due to pin):
  await scrollTo(page, mmTopDoc + 900);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const after = await readOffset(page);

  expect(after).toBeLessThan(before);
});

test("panel pins for ~one viewport of scroll distance", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");

  const mmTopDoc = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(window.scrollY + el.getBoundingClientRect().top);
  });

  await scrollTo(page, mmTopDoc);
  await page.waitForTimeout(SETTLE_MS);
  const topAtPinStart = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(el.getBoundingClientRect().top);
  });

  await scrollTo(page, mmTopDoc + 500);
  await page.waitForTimeout(SETTLE_MS);
  const topMidPin = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(el.getBoundingClientRect().top);
  });

  // While pinned, the panel's top should remain at ~0 (give it 30px of slack
  // for sub-pixel rounding under Lenis).
  expect(Math.abs(topAtPinStart)).toBeLessThan(30);
  expect(Math.abs(topMidPin)).toBeLessThan(30);
});

test("reduced-motion: no pin, full path drawn statically", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);

  const initialOffset = await readOffset(page);
  expect(initialOffset).toBeLessThan(1);

  // Scroll through the panel; panel position relative to viewport should
  // change linearly (no pin).
  const mmTopDoc = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(window.scrollY + el.getBoundingClientRect().top);
  });
  await scrollTo(page, mmTopDoc);
  await page.waitForTimeout(SETTLE_MS);
  const topAtStart = await page.evaluate(
    () => document.querySelector(".v20-mm").getBoundingClientRect().top
  );

  await scrollTo(page, mmTopDoc + 500);
  await page.waitForTimeout(SETTLE_MS);
  const topAfter = await page.evaluate(
    () => document.querySelector(".v20-mm").getBoundingClientRect().top
  );

  // Without pin, the panel moves up by ~500px as the user scrolls 500px.
  expect(topAtStart - topAfter).toBeGreaterThan(400);
});

test("no console errors during mount + scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v20");
  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run the suite**

```bash
cd tma-web
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters
```

Expected: all 6 tests pass. If a test fails:
- "letter strokes (length grows)" failing → the splice didn't happen — verify the `mm` query in `V20Filament.measure()`.
- "pin for ~one viewport" failing → pin not registering — verify `anticipatePin: 1` and that `ScrollTrigger` is registered.
- "reduced-motion" failing → the `reduced` guard in `V20MotionMatters` is firing too late or too early.

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v20-motion-matters.spec.js
git commit -m "test(v20): e2e coverage for MOTION MATTERS panel + letter splice"
```

---

## Task 9: Visual tuning pass

**Files:**
- Modify (as needed): `tma-web/components/portfolio-v20/mmGlyphs.js` (letter shapes / tracking)
- Modify (as needed): `tma-web/components/portfolio-v20/V20Filament.jsx` (approach curve into panel)

- [ ] **Step 1: Take a Playwright screenshot at the mid-pin scroll position**

Add a temporary screenshot in the spec file (or run it inline):

```bash
cd tma-web
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --headed v20-motion-matters
```

Or scroll manually to the middle of the pin in the browser and take a screenshot.

- [ ] **Step 2: Iterate on letter shapes**

Inspect the screenshot. Compare against the V20 page's existing FEATURED / OUR WORK type. Likely tuning passes:
- If letters appear too short / squat: increase the `panelH * totalUnits * 0.65` factor in `buildMotionMattersPath` (`mmGlyphs.js`) toward 0.8.
- If letters bleed off the edges: lower the `panelW * 0.8` factor to 0.7.
- If S / A read poorly: revise their `path` strings. Single-stroke S is the hardest letter — a hand-tuned cubic Bezier may read better than the current zigzag.
- If tracking feels too tight or too loose: adjust the `TRACKING` constant (currently 0.08).

After each tweak, hot-reload and re-screenshot. Stop when the result reads as "MOTION MATTERS" at a glance.

- [ ] **Step 3: Final test run**

```bash
cd tma-web
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters v19-filament
```

Both V20 (this work) AND V19 filament suites must pass. V19 isn't changed by this work but is the closest sibling — running it confirms no shared regression slipped in.

- [ ] **Step 4: Commit final tuning**

```bash
git add -p tma-web/components/portfolio-v20/mmGlyphs.js tma-web/components/portfolio-v20/V20Filament.jsx
git commit -m "polish(v20): tune MOTION MATTERS letter shapes + scale for legibility"
```

---

## Self-review notes

- Spec coverage: every spec section maps to a task. Architecture/placement → Tasks 1–3. Letter geometry + path extension → Tasks 4–5. Pin mechanics → Task 6. Reduced motion → Task 7. Testing → Task 8. Visual quality (acknowledged risk in spec) → Task 9.
- The spec calls for one SVG spanning all three sections; Task 5 preserves the existing single-SVG-per-lane invariant — we only extend the `d` attribute.
- Naming consistency: `mm` (panel bbox), `buildMotionMattersPath`, `[data-v20-mm-box]` selector are used identically across `mmGlyphs.js`, `V20Filament.jsx`, and `V20MotionMatters.jsx`.
- The `scaleRelativePath` helper handles only `l`, `c`, `a`, `m` commands — the GLYPHS table uses no other letters. If a future glyph needs `h`, `v`, `q`, etc., add support there.
- The `data-v20-mm-box` selector is used by `V20Filament` to find the panel — make sure the attribute on the `.v20-mm-text-box` div in Task 2 matches the selector in Task 5.

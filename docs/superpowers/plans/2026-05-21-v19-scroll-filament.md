# V19 Scroll-Drawn Filament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cool-tinted hairline "thread of light" that draws itself with scroll across the V19 Featured Work section.

**Architecture:** A self-contained `"use client"` component (`V19Filament`) renders one absolutely-positioned SVG inside the `.v19fw` section, behind the cards. It measures the section, builds a responsive cubic-bezier path through the grid gutters, and animates `strokeDashoffset` from full length to 0 via a GSAP ScrollTrigger (`scrub: 0.6`). Under `prefers-reduced-motion` it renders the full path statically with no ScrollTrigger.

**Tech Stack:** Next.js (App Router), React, GSAP + `gsap/ScrollTrigger` (free; native SVG dash technique, no DrawSVG), Playwright for e2e.

---

## File Structure

- **Create** `tma-web/components/portfolio-v19/V19Filament.jsx` — the SVG + GSAP lifecycle. One responsibility: draw the filament. Depends only on `gsap`, `gsap/ScrollTrigger`, and the existing `usePrefersReducedMotion` hook.
- **Create** `tma-web/components/portfolio-v19/usePrefersReducedMotion.js` — copy of the existing hook (the v19 folder has none of its own; mirrors `portfolio-v16` / `obsidian-hero` which each keep a local copy).
- **Modify** `tma-web/components/portfolio-v19/V19FeaturedWork.jsx` — mount `<V19Filament />` as the first child of the `.v19fw` section.
- **Modify** `tma-web/components/portfolio-v19/v19.css` — `.v19-filament` positioning / z-index / reduced-motion rule.
- **Create** `tma-web/playwright/tests/v19-filament.spec.js` — e2e mirroring `obsidian-hero.spec.js`.

### Layering reference (already in v19.css)

```
.v19fw           position: relative; overflow: hidden;   (section bg #000)
.v19fw::before   absolute glow overlay (pointer-events:none)
.v19-filament    NEW — absolute inset:0, z-index: 1       (above bg, below cards)
.v19fw-header    z-index: 2
.v19fw-grid      z-index: 2  → cards, hover tiles above
```

---

## Task 1: Local reduced-motion hook

**Files:**
- Create: `tma-web/components/portfolio-v19/usePrefersReducedMotion.js`

- [ ] **Step 1: Create the hook (exact copy of the existing obsidian-hero hook)**

`tma-web/components/portfolio-v19/usePrefersReducedMotion.js`:

```jsx
"use client";
import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
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

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v19/usePrefersReducedMotion.js
git commit -m "feat(v19): add local prefers-reduced-motion hook for filament"
```

---

## Task 2: V19Filament component

**Files:**
- Create: `tma-web/components/portfolio-v19/V19Filament.jsx`

This component owns the whole effect. The path builder anchors control points to
fractions of the measured section size (`w`, `h`) so it stays responsive and
threads the two grid gutters on desktop / a central S-curve on mobile (≤820px,
matching the `.v19fw-grid` breakpoint).

- [ ] **Step 1: Create the component**

`tma-web/components/portfolio-v19/V19Filament.jsx`:

```jsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const MOBILE_MAX = 820; // matches the .v19fw-grid single-column breakpoint

/* Build a cubic-bezier path string for the measured section size.
   Control points are fractions of w/h so the curve scales responsively
   and threads BETWEEN the 3-column grid (gutters ≈ 0.34w and 0.66w). */
function buildPath(w, h) {
  const cx = w / 2;

  if (w <= MOBILE_MAX) {
    const amp = w * 0.18;
    return (
      `M ${cx} 0 ` +
      `C ${cx + amp} ${h * 0.2}, ${cx - amp} ${h * 0.36}, ${cx} ${h * 0.5} ` +
      `S ${cx + amp} ${h * 0.82}, ${cx} ${h}`
    );
  }

  const g1 = w * 0.34;
  const g2 = w * 0.66;
  return (
    `M ${cx} 0 ` +
    `C ${cx} ${h * 0.08}, ${g1} ${h * 0.1}, ${g1} ${h * 0.2} ` +
    `C ${g1} ${h * 0.34}, ${g2} ${h * 0.38}, ${g2} ${h * 0.52} ` +
    `C ${g2} ${h * 0.66}, ${g1} ${h * 0.7}, ${g1} ${h * 0.82} ` +
    `C ${g1} ${h * 0.92}, ${cx} ${h * 0.94}, ${cx} ${h}`
  );
}

export default function V19Filament() {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!root || !svg || !path) return;

    const section = root.closest(".v19fw") || root.parentElement;
    if (!section) return;

    let st = null;

    const measure = () => {
      const w = section.clientWidth;
      const h = section.clientHeight;
      if (!w || !h) return;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      path.setAttribute("d", buildPath(w, h));
      const len = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: len,
        strokeDashoffset: reduced ? 0 : len,
      });
      return len;
    };

    const ctx = gsap.context(() => {
      measure();
      if (!reduced) {
        const tween = gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });
        st = tween.scrollTrigger;
      }
    }, root);

    const ro = new ResizeObserver(() => {
      measure();
      // re-pin the draw to current scroll after a layout change
      if (st) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len });
      }
      ScrollTrigger.refresh();
    });
    ro.observe(section);

    return () => {
      ro.disconnect();
      ctx.revert();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="v19-filament" aria-hidden="true">
      <svg
        ref={svgRef}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="v19-filament-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6fd3ff" stopOpacity="0.0" />
            <stop offset="12%" stopColor="#6fd3ff" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#bfe9ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          className="v19-filament-path"
          fill="none"
          stroke="url(#v19-filament-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v19/V19Filament.jsx
git commit -m "feat(v19): scroll-drawn filament component (GSAP dash technique)"
```

---

## Task 3: Mount the filament in Featured Work

**Files:**
- Modify: `tma-web/components/portfolio-v19/V19FeaturedWork.jsx`

The `.v19fw` section is already `position: relative; overflow: hidden`, so no
positioning change is needed — only the import and the mount as the section's
first child.

- [ ] **Step 1: Add the import (top of file, after the React import on line 3)**

Change the import block at the top of `V19FeaturedWork.jsx` from:

```jsx
"use client";

import { useEffect, useRef, useState } from "react";
```

to:

```jsx
"use client";

import { useEffect, useRef, useState } from "react";
import V19Filament from "./V19Filament";
```

- [ ] **Step 2: Mount `<V19Filament />` as the first child of the section**

In the `V19FeaturedWork` component's `return`, change:

```jsx
    <section className="v19fw">
      <header className="v19fw-header container">
```

to:

```jsx
    <section className="v19fw">
      <V19Filament />
      <header className="v19fw-header container">
```

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v19/V19FeaturedWork.jsx
git commit -m "feat(v19): mount filament background in Featured Work section"
```

---

## Task 4: Filament styles

**Files:**
- Modify: `tma-web/components/portfolio-v19/v19.css`

Append a new block at the end of the file. The wrapper sits at `z-index: 1`
(above the section bg and `::before` glow, below `.v19fw-header` / `.v19fw-grid`
which are `z-index: 2`). Under reduced motion the path is shown statically at low
opacity.

- [ ] **Step 1: Append the CSS**

Add to the end of `tma-web/components/portfolio-v19/v19.css`:

```css
/* ---------- SCROLL-DRAWN FILAMENT ---------- */
.v19-filament {
  position: absolute;
  inset: 0;
  z-index: 1;            /* above section bg, below header/grid (z:2) */
  pointer-events: none;
}
.v19-filament svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.v19-filament-path {
  filter: drop-shadow(0 0 6px rgba(111, 211, 255, 0.35));
}

@media (prefers-reduced-motion: reduce) {
  /* JS already renders the full path (dashoffset 0); soften it so the
     static line reads as a quiet background mark. */
  .v19-filament-path {
    opacity: 0.5;
    filter: none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v19/v19.css
git commit -m "style(v19): filament positioning, glow, reduced-motion rule"
```

---

## Task 5: Playwright e2e

**Files:**
- Create: `tma-web/playwright/tests/v19-filament.spec.js`

`/portfolio-v19` is a local (unmerged/untracked) route, so the test runs against
a local dev server — same convention as `obsidian-hero.spec.js`. `strokeDashoffset`
is read via `getComputedStyle(path).strokeDashoffset` (GSAP sets it as an inline
style; computed value is in px).

- [ ] **Step 1: Write the spec**

`tma-web/playwright/tests/v19-filament.spec.js`:

```js
import { test, expect } from "@playwright/test";

// Local dev server (the /portfolio-v19 route is unmerged):
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v19-filament.spec.js
// All page.goto() calls are relative and resolve against the configured baseURL.
// NOTE: globals.css sets `html { scroll-behavior: smooth }`, so scroll helpers
// MUST pass behavior:"instant" or reads race the smooth animation.

const SETTLE_MS = 450;

const readOffset = (page) =>
  page.evaluate(() => {
    const p = document.querySelector(".v19-filament-path");
    return parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
  });

test("filament mounts inside Featured Work", async ({ page }) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19fw .v19-filament svg path")).toHaveCount(1);
});

test("filament draws as the section scrolls (dashoffset decreases)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament-path")).toBeVisible();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(SETTLE_MS);
  const top = await readOffset(page);

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(SETTLE_MS);
  const bottom = await readOffset(page);

  // fully scrolled = more of the path drawn = smaller remaining offset
  expect(bottom).toBeLessThan(top);
});

test("reduced-motion: path is fully drawn and stays static on scroll", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament-path")).toBeVisible();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(SETTLE_MS);
  const top = await readOffset(page);

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(SETTLE_MS);
  const bottom = await readOffset(page);

  // static full path: offset ~0 and unchanged by scroll
  expect(top).toBeLessThan(1);
  expect(Math.abs(bottom - top)).toBeLessThan(1);
});

test("no console errors during mount + scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v19");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});

test("unmount removes the filament (navigation away)", async ({ page }) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament")).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".v19-filament")).toHaveCount(0);
});
```

- [ ] **Step 2: Run the tests against a local dev server**

In one terminal:

```bash
cd tma-web && npm run dev
```

In another:

```bash
cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v19-filament.spec.js
```

Expected: 5 passed.

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v19-filament.spec.js
git commit -m "test(v19): e2e for scroll-drawn filament (mount/draw/reduced-motion/teardown)"
```

---

## Task 6: Visual verification

- [ ] **Step 1: With `npm run dev` running, open `/portfolio-v19` in a browser at desktop width (≥1024px)**

Scroll from the hero into Featured Work and confirm:
- the filament begins drawing as the section enters view (~80% viewport),
- it is fully drawn by the time the section bottom reaches the viewport bottom,
- the thread reads cool/blue→white and never overlaps a card's media (it threads the gutters).

- [ ] **Step 2: Resize to mobile width (≤820px)**

Confirm the path collapses to the central S-curve, still draws on scroll, and stays clear of the single-column cards.

- [ ] **Step 3: Toggle OS "reduce motion" and reload**

Confirm the full path renders statically at lower opacity with no scroll-driven drawing, and the card hover-video interaction is unaffected at all widths.

If any control points clip a card, nudge the fractions in `buildPath` and re-verify (no commit needed until it looks right, then amend Task 2's commit or add a follow-up `style` commit).

---

## Self-Review Notes

- **Spec coverage:** concept/thread-of-light (Task 2 path + gradient), cool tint (Task 2 gradient stops + Task 4 glow), native dash technique / no DrawSVG (Task 2), scroll range `top 80%`→`bottom bottom` scrub 0.6 (Task 2), responsive gutters + mobile S-curve (Task 2 `buildPath`), reduced motion static (Task 2 + Task 4), layering z:1 below cards (Task 4), resize refresh (Task 2 ResizeObserver), files list (all tasks), Playwright cases (Task 5). All spec sections map to a task.
- **Type/name consistency:** class names `.v19-filament`, `.v19-filament-path`, gradient id `v19-filament-grad`, and component default export `V19Filament` are identical across Tasks 2, 3, 4, 5.
- **No placeholders:** every code step contains full content; the only "tune later" is the optional `buildPath` fraction nudge in Task 6, which is explicit visual QA, not a missing implementation.

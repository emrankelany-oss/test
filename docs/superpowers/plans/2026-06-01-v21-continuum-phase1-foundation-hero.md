# V21 Continuum — Phase 1: Foundation + Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the comfort/premium foundation for the V21 "Continuum" redesign and replace the cramped hero with a calm, type-first editorial Hero — spacing-token system, weighted Lenis, a display serif, a film-grain layer, and a custom cursor, all on the existing filament/atmosphere/comet soul.

**Architecture:** New CSS token system (`--space-*`, type) on `.v21-page`; `SmoothScroll` gains optional calm props (defaults unchanged so V20 is untouched); a new `V21Cursor` custom cursor; `V21Hero.jsx` is rewritten as a type-first editorial hero (oversized serif headline with a line-by-line reveal + a framed reel inset). The rest of the page (old Featured/MotionMatters/OurWork) stays mounted below for now and is replaced in Phases 2–3.

**Tech Stack:** Next.js (React client components), Lenis, GSAP (already present), CSS custom properties, Google Fonts (Fraunces), Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-06-01-v21-continuum-redesign-design.md` (Phase 1 = Foundation + Hero)

**Branch:** current `feat/obsidian-hero`. **V20 must stay untouched.** Commit only the exact paths listed; never `git add -A` (a separate V22 workstream shares the tree). Dev server already runs on http://localhost:3000.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `tma-web/components/portfolio/SmoothScroll.jsx` | Add optional `duration`/`lerp` props (defaults preserve current behavior → V20/V22 unaffected) | **Modify** |
| `tma-web/components/portfolio-v21/v21.css` | Append a Phase-1 block: `:root`/`.v21-page` spacing+type tokens, Fraunces import, `.v21-grain`, new `.v21-hero*` type-first styles, `.v21-cursor` | **Modify (append)** |
| `tma-web/components/portfolio-v21/V21Cursor.jsx` | Custom lerp-followed cursor dot; grows over `[data-cursor="play"]`; off on touch/reduced-motion | **Create** |
| `tma-web/components/portfolio-v21/V21Hero.jsx` | Rewrite as the type-first editorial hero (serif headline + line reveal + framed reel inset + meta) | **Replace** |
| `tma-web/app/portfolio-v21/page.jsx` | Mount `<V21Cursor/>`; pass calm props to `<SmoothScroll/>` | **Modify** |
| `tma-web/playwright/tests/v21-continuum-phase1.spec.js` | e2e: tokens, hero structure/spacing/reveal, cursor, reduced-motion, console guard, V20 isolation | **Create** |

## Running tests
Dev server must be running (`cd tma-web && npm run dev`, port 3000). Run a spec:
```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 --project=laptop-1440
```

---

## Task 1: SmoothScroll calm props (V20-safe)

**Files:** Modify `tma-web/components/portfolio/SmoothScroll.jsx`

- [ ] **Step 1: Replace the file with the prop-aware version (defaults = current values)**

```jsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Defaults preserve the original behavior so existing pages (V20/V22) are
// unaffected. V21 passes calmer values for a weighted, premium feel.
export default function SmoothScroll({ duration = 1.1, lerp } = {}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const opts = {
      duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.2,
    };
    if (typeof lerp === "number") opts.lerp = lerp;

    const lenis = new Lenis(opts);

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tick = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [duration, lerp]);

  return null;
}
```

- [ ] **Step 2: Verify V20 still renders with no console errors (regression)**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters --project=laptop-1440`
Expected: all pass (V20 passes no props → identical behavior).

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/components/portfolio/SmoothScroll.jsx
git commit -m "feat(scroll): optional calm props on SmoothScroll (defaults unchanged)"
```

---

## Task 2: Spacing/type tokens + grain + Fraunces (CSS foundation)

**Files:** Modify (append) `tma-web/components/portfolio-v21/v21.css`

- [ ] **Step 1: Write the failing test** — create `tma-web/playwright/tests/v21-continuum-phase1.spec.js`:

```js
import { test, expect } from "@playwright/test";

const SETTLE_MS = 450;
const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollBottom = (page) =>
  page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));

test("spacing tokens resolve to generous values", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const px = (name) =>
    page.evaluate((n) => {
      const probe = document.createElement("div");
      probe.style.height = `var(${n})`;
      document.querySelector(".v21-page").appendChild(probe);
      const h = parseFloat(getComputedStyle(probe).height) || 0;
      probe.remove();
      return h;
    }, name);
  expect(await px("--space-act")).toBeGreaterThan(150); // big breath between sections
  expect(await px("--space-block")).toBeGreaterThan(60);
  expect(await px("--gutter")).toBeGreaterThan(20);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 --project=laptop-1440`
Expected: FAIL — tokens undefined (height resolves to 0).

- [ ] **Step 3: Append the foundation CSS to `tma-web/components/portfolio-v21/v21.css`**

```css
/* =====================================================================
   V21 — Continuum redesign · Phase 1 foundation
   Spacing/type token system (the "comfort" fix), a display serif, and a
   film-grain layer. Scoped to .v21-page so V20 is unaffected.
   ===================================================================== */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,500&display=swap');

.v21-page {
  --space-act: clamp(180px, 20vw, 320px);
  --space-block: clamp(72px, 9vw, 140px);
  --gutter: clamp(24px, 6vw, 120px);
  --measure: min(1280px, 92vw);
  --v21-serif: "Fraunces", Georgia, "Times New Roman", serif;
  --v21-ink: #f3f5f8;
  --v21-mut: #8b93a0;
  --v21-cy: #6fd3ff;
}

/* A reusable centered container with comfortable gutters. */
.v21-measure {
  width: var(--measure);
  margin-inline: auto;
  padding-inline: clamp(0px, 2vw, 24px);
}

/* Film-grain overlay — fixed, faint, adds material richness. */
.v21-grain {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
@media (prefers-reduced-motion: reduce) {
  .v21-grain { display: none; }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 --project=laptop-1440`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/components/portfolio-v21/v21.css tma-web/playwright/tests/v21-continuum-phase1.spec.js
git commit -m "feat(v21): spacing/type tokens + grain foundation (Continuum)"
```

---

## Task 3: Custom cursor (V21Cursor)

**Files:** Create `tma-web/components/portfolio-v21/V21Cursor.jsx`; modify `v21.css` (append); modify `app/portfolio-v21/page.jsx`; add test.

- [ ] **Step 1: Append the cursor tests** to `tma-web/playwright/tests/v21-continuum-phase1.spec.js`:

```js
test("custom cursor mounts and follows the pointer (desktop)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  const cursor = page.locator(".v21-cursor");
  await expect(cursor).toHaveCount(1);

  await page.mouse.move(300, 300);
  await page.waitForTimeout(120);
  const a = await cursor.evaluate((el) => el.getBoundingClientRect());
  await page.mouse.move(900, 600);
  await page.waitForTimeout(200);
  const b = await cursor.evaluate((el) => el.getBoundingClientRect());
  expect(Math.abs(b.left - a.left) + Math.abs(b.top - a.top)).toBeGreaterThan(50);
});

test("reduced-motion: custom cursor is not rendered", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.locator(".v21-cursor")).toHaveCount(0);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 --project=laptop-1440`
Expected: FAIL — `.v21-cursor` count 0.

- [ ] **Step 3: Create `tma-web/components/portfolio-v21/V21Cursor.jsx`**

```jsx
"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * V21Cursor — a small lerp-followed dot that replaces the native cursor on
 * fine-pointer devices. Grows + shows a "play" glyph over [data-cursor="play"]
 * elements. Disabled entirely on touch and reduced-motion (native cursor used).
 */
export default function V21Cursor() {
  const dotRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const dot = dotRef.current;
    if (!dot) return;

    document.documentElement.classList.add("v21-has-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      const playable = e.target && e.target.closest && e.target.closest('[data-cursor="play"]');
      dot.classList.toggle("is-play", !!playable);
    };
    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      dot.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("v21-has-cursor");
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <div ref={dotRef} className="v21-cursor" aria-hidden="true">
      <span className="v21-cursor-label">▶</span>
    </div>
  );
}
```

- [ ] **Step 4: Append the cursor CSS to `v21.css`**

```css
/* Custom cursor — fixed dot, blends over the dark canvas. Native cursor is
   hidden only when the custom one is active (fine pointer, no reduced-motion). */
.v21-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 60;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(243, 245, 248, 0.9);
  mix-blend-mode: difference;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s cubic-bezier(.2,.8,.2,1), height 0.3s cubic-bezier(.2,.8,.2,1), background 0.3s ease;
  will-change: transform;
}
.v21-cursor .v21-cursor-label {
  font-size: 11px;
  color: #060708;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.v21-cursor.is-play {
  width: 58px;
  height: 58px;
  background: var(--v21-cy);
  mix-blend-mode: normal;
}
.v21-cursor.is-play .v21-cursor-label { opacity: 1; }
html.v21-has-cursor,
html.v21-has-cursor a,
html.v21-has-cursor [data-cursor="play"] { cursor: none; }
```

- [ ] **Step 5: Mount in the page.** In `tma-web/app/portfolio-v21/page.jsx`, add the import near the other v21 imports:

```jsx
import V21Cursor from "@/components/portfolio-v21/V21Cursor";
```

and render it as the first child inside `<main className="v21-page">` (before `<SmoothScroll />`):

```jsx
    <main className="v21-page">
      <V21Cursor />
      <div className="v21-grain" aria-hidden="true" />
      <SmoothScroll duration={1.3} lerp={0.08} />
```

(Adding `duration`/`lerp` here also applies the calm scroll from Task 1, and mounts the grain layer from Task 2.)

- [ ] **Step 6: Run to verify pass**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 --project=laptop-1440`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/components/portfolio-v21/V21Cursor.jsx tma-web/components/portfolio-v21/v21.css tma-web/app/portfolio-v21/page.jsx tma-web/playwright/tests/v21-continuum-phase1.spec.js
git commit -m "feat(v21): custom cursor + calm Lenis + grain mounted (Continuum)"
```

---

## Task 4: Type-first editorial Hero

**Files:** Replace `tma-web/components/portfolio-v21/V21Hero.jsx`; append hero CSS to `v21.css`; add tests.

- [ ] **Step 1: Append the hero tests** to `tma-web/playwright/tests/v21-continuum-phase1.spec.js`:

```js
test("hero is type-first: serif headline lines + framed reel inset, generous top space", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  // Headline split into multiple animated lines.
  await expect(page.locator(".v21-hero .v21h-line")).toHaveCount(4);
  // Framed reel inset (not full-bleed) present.
  await expect(page.locator(".v21-hero .v21h-reel")).toHaveCount(1);
  // Generous breathing room: hero padding-top is large.
  const padTop = await page.locator(".v21-hero").evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
  expect(padTop).toBeGreaterThan(90);
  // Headline uses the display serif.
  const fam = await page.locator(".v21-hero .v21h-headline").evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase());
  expect(fam).toContain("fraunces");
});

test("reduced-motion: hero headline lines are fully visible (no entrance animation)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const op = await page.locator(".v21-hero .v21h-line span").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.95);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 --project=laptop-1440`
Expected: FAIL — `.v21h-line` count 0 (old hero markup).

- [ ] **Step 3: Replace `tma-web/components/portfolio-v21/V21Hero.jsx` entirely**

```jsx
"use client";

import { useEffect, useRef } from "react";

/**
 * V21Hero — "The Continuum" type-first editorial hero.
 *
 * A calm, spacious opening: an oversized display-serif headline that reveals
 * line-by-line, a short meta row, and the showreel as a FRAMED inset (not
 * full-bleed). Filament/atmosphere/comet (mounted at the page level) thread
 * through behind it. No internal nav — the page mounts <Nav/> separately.
 */
export default function V21Hero() {
  const reelRef = useRef(null);

  useEffect(() => {
    const v = reelRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  return (
    <header className="v21-hero" id="top">
      <div className="v21-hero-inner v21-measure">
        <p className="v21h-kicker">Creative motion studio · GCC</p>

        <h1 className="v21h-headline">
          <span className="v21h-line"><span>Where strategy</span></span>
          <span className="v21h-line"><span>meets <em>bold</em></span></span>
          <span className="v21h-line"><span>storytelling</span></span>
          <span className="v21h-line v21h-line--reel">
            <span>
              <a className="v21h-reel" href="#contact" data-cursor="play" aria-label="Play showreel">
                <video
                  ref={reelRef}
                  src="/assets/hero2.mp4"
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                />
                <span className="v21h-reel-play" aria-hidden="true">▶</span>
                <span className="v21h-reel-label">Showreel 2025</span>
              </a>
            </span>
          </span>
        </h1>

        <div className="v21h-meta">
          <span>EST. 2019</span>
          <span>AMMAN · RIYADH</span>
          <span className="v21h-scrollcue">↓ scroll</span>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Append the hero CSS to `v21.css`**

```css
/* ---- Type-first editorial hero (Continuum) -------------------------------- */
.v21-hero {
  position: relative;
  z-index: 1;
  min-height: 92vh;
  display: flex;
  align-items: center;
  padding-top: clamp(120px, 16vh, 220px);
  padding-bottom: var(--space-block);
  color: var(--v21-ink);
}
.v21-hero-inner { width: var(--measure); }
.v21h-kicker {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--v21-cy);
  margin: 0 0 clamp(20px, 3vw, 40px);
}
.v21h-headline {
  font-family: var(--v21-serif);
  font-weight: 400;
  font-size: clamp(44px, 8.5vw, 132px);
  line-height: 1.0;
  letter-spacing: -0.01em;
  margin: 0;
}
.v21h-headline em { font-style: italic; color: var(--v21-cy); }
.v21h-line { display: block; overflow: hidden; }
.v21h-line > span { display: inline-block; transform: translateY(110%); opacity: 0; }
@keyframes v21h-rise {
  to { transform: translateY(0); opacity: 1; }
}
.v21h-line:nth-child(2) > span { animation: v21h-rise 1.0s cubic-bezier(.2,.8,.2,1) 0.10s forwards; }
.v21h-line:nth-child(3) > span { animation: v21h-rise 1.0s cubic-bezier(.2,.8,.2,1) 0.22s forwards; }
.v21h-line:nth-child(4) > span { animation: v21h-rise 1.0s cubic-bezier(.2,.8,.2,1) 0.34s forwards; }
.v21h-line:nth-child(5) > span { animation: v21h-rise 1.0s cubic-bezier(.2,.8,.2,1) 0.46s forwards; }

/* Framed reel inset sits on the last headline line, to the right of the word. */
.v21h-line--reel > span { display: inline-flex; vertical-align: middle; }
.v21h-reel {
  position: relative;
  display: inline-block;
  width: clamp(160px, 22vw, 320px);
  aspect-ratio: 16 / 10;
  margin-left: clamp(16px, 2vw, 32px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(111, 211, 255, 0.18);
  vertical-align: middle;
  text-decoration: none;
}
.v21h-reel video { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(1.05); }
.v21h-reel-play {
  position: absolute; left: 14px; bottom: 12px;
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,.6); color: #fff; font-size: 12px;
  backdrop-filter: blur(3px);
}
.v21h-reel-label {
  position: absolute; right: 12px; top: 10px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(255,255,255,.85);
}
.v21h-meta {
  display: flex;
  gap: clamp(20px, 3vw, 44px);
  margin-top: clamp(40px, 6vw, 88px);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--v21-mut);
}
.v21h-scrollcue { color: var(--v21-cy); }

@media (max-width: 860px) {
  .v21h-line--reel > span { display: block; }
  .v21h-reel { margin-left: 0; margin-top: 16px; width: min(80vw, 360px); }
}

/* Reduced motion: no entrance animation; headline fully visible. */
@media (prefers-reduced-motion: reduce) {
  .v21h-line > span { transform: none; opacity: 1; animation: none; }
}
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 --project=laptop-1440`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/components/portfolio-v21/V21Hero.jsx tma-web/components/portfolio-v21/v21.css tma-web/playwright/tests/v21-continuum-phase1.spec.js
git commit -m "feat(v21): type-first editorial hero (Continuum Phase 1)"
```

---

## Task 5: Cross-cutting guards + 6-viewport sweep + V20 isolation

**Files:** append to `tma-web/playwright/tests/v21-continuum-phase1.spec.js`

- [ ] **Step 1: Append the guard tests**

```js
test("no console errors across a full scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v21");
  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run the full Phase-1 spec on laptop (expect 6 passed)**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 --project=laptop-1440`
Expected: 6 passed.

- [ ] **Step 3: Run across all 6 viewports**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1`
Expected: green on mobile-375/414, tablet-768/1024, laptop-1440, desktop-1920. If a small viewport fails the hero `padTop > 90` check (shorter vh), relax only that numeric threshold for that case and note it — do not weaken structural assertions.

- [ ] **Step 4: V20 no-regression**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters --project=laptop-1440`
Expected: all pass. Also confirm: `git diff --name-only | grep -i portfolio-v20` → empty (no V20 files touched).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/playwright/tests/v21-continuum-phase1.spec.js
git commit -m "test(v21): Continuum Phase 1 full-scroll guard + sweep"
```

---

## Manual verification
Load `http://localhost:3000/portfolio-v21`: the hero is now a calm, oversized serif statement that rises in line-by-line, with the reel as a small framed inset and a custom cursor that grows to ▶ over the reel. Generous space above/below. Scroll feels weighted (calm Lenis). The old sections still appear below (replaced in Phases 2–3). `/portfolio-v20` is unchanged.

## Self-Review (done during planning)
- **Spec coverage (Phase 1 scope):** tokens (Task 2), calm Lenis (Tasks 1+3), display serif/type (Tasks 2+4), grain (Tasks 2+3), custom cursor (Task 3), type-first hero w/ line reveal + framed reel + meta (Task 4), reduced-motion for cursor + hero (Tasks 3,4), scroll-spine reuse (unchanged soul modules already mounted in page — not re-touched here), tests + 6 viewports + V20 isolation (Task 5). ✔
- **Placeholder scan:** none — all steps have complete code/commands.
- **Name consistency:** `.v21h-line`, `.v21h-headline`, `.v21h-reel`, `.v21-cursor`/`.is-play`/`v21-has-cursor`, `--space-act/-block`, `--gutter`, `--v21-serif/-cy/-ink/-mut`, `SmoothScroll({duration,lerp})` used consistently across tasks. ✔
- **Note:** `--font-mono` fallback chains to `ui-monospace` if the project var is unset, so meta text never breaks.

# Portfolio V22 (Clim-Inspired) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/portfolio-v22` — a single-scroll TMA portfolio page that borrows Studio Clim's interaction mechanics (magnetic cursor, velocity marquee, scroll-scrubbed video, blur char-reveals, drag gallery, count-up stats) in TMA's cool-blue brand, with a structure distinct from v19–v21.

**Architecture:** A Next.js App Router server component (`page.jsx`) assembles client-island sections under `components/portfolio-v22/`. Lenis smooth scroll + GSAP/ScrollTrigger drive motion (reusing the existing `SmoothScroll` integration). Project content comes from the shared v20 roster (re-exported, never duplicated). A small external store opens a self-contained project modal.

**Tech Stack:** Next 16 / React 19, Lenis 1.3.x, GSAP 3.15 (ScrollTrigger + Draggable), CSS custom properties. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-01-portfolio-v22-clim-inspired-design.md`

---

## Conventions for every task

- **Repo root for app code:** `c:\Users\Pc\Downloads\the-motion-agency-web-main\tma-web` (the Next app). All paths below are relative to it unless noted.
- **This Next.js has breaking changes** (see `tma-web/AGENTS.md`). Do NOT invent Next APIs — mirror the proven patterns already in `app/portfolio-v20/page.jsx` and the v20 components. Consult `node_modules/next/dist/docs/` only if you need an API not already used in v20.
- **TDD = Playwright e2e** (the repo's verification discipline). Specs live in `playwright/tests/`. Each task: write a failing spec → run it red → implement → run it green → commit.
- **Running the tests** (dev server must be up in a separate terminal):
  ```bash
  cd tma-web && npm run dev          # terminal 1 (leave running)
  # terminal 2:
  cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test <spec-name> --project=laptop-1440
  ```
- **Commit scope:** stage only the files the task created/modified.

## File structure (locked)

```
app/portfolio-v22/page.jsx                       # server component: metadata + assembly
components/portfolio-v22/
  v22.css                                         # theme tokens + all section styles
  projects.js                                     # re-export roster + FEATURED/CAPABILITIES/IMPACT
  usePrefersReducedMotion.js                      # re-export of v20 hook
  useProjectModal.js                              # external store (open/close a project)
  hooks/useMagnetic.js                            # magnetic pull for an element ref
  hooks/useSplitReveal.js                         # char/word reveal via ScrollTrigger
  hooks/useScrubVideo.js                          # scroll-scrub a video's currentTime
  V22Cursor.jsx                                   # global magnetic blend-mode cursor
  V22Preloader.jsx                                # monogram + 0→100 counter, wipes away
  V22DotField.jsx                                 # scattered parallax dots behind Showreel
  V22Hero.jsx                                     # headline + Showreel CTA + dot-field
  V22Marquee.jsx                                  # scroll-velocity marquee
  V22FeaturedWork.jsx                             # lead scrubbed tile + hover-play grid
  V22Capabilities.jsx                             # 3 C's, clip + char reveals
  V22WorkArchive.jsx                              # Draggable rail + category filters
  V22Impact.jsx                                   # count-up stats
  V22ProjectModal.jsx                             # self-contained project detail modal
playwright/tests/v22-*.spec.js                    # one spec per task
```

**Reused as-is (import, do not copy):** `components/home/Nav`, `components/home/Contact`, `components/home/Footer`, `components/portfolio/SmoothScroll`, `components/shell/ClientShell`.

---

## Task 0: Scaffold route, theme, data, reduced-motion

**Files:**
- Create: `components/portfolio-v22/v22.css`
- Create: `components/portfolio-v22/projects.js`
- Create: `components/portfolio-v22/usePrefersReducedMotion.js`
- Create: `app/portfolio-v22/page.jsx`
- Test: `playwright/tests/v22-scaffold.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-scaffold.spec.js
import { test, expect } from "@playwright/test";

test("v22 page mounts with the hero headline and dark theme", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-page")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/storytelling/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-scaffold --project=laptop-1440`
Expected: FAIL — 404 / `.v22-page` count 0.

- [ ] **Step 3: Create the theme tokens**

```css
/* components/portfolio-v22/v22.css */
.v22-page {
  --v22-bg: #050d16;
  --v22-ink: #eaf4ff;
  --v22-lit: #6fd3ff;
  --v22-dim: #9fc6ee;
  --v22-line: #14324f;
  --v22-panel: #0b2742;
  --font-display: var(--font-inter-tight), system-ui, sans-serif;
  --font-label: var(--font-space-grotesk), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;

  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(120% 80% at 72% 6%, #0b2742 0%, var(--v22-bg) 62%);
  color: var(--v22-ink);
  font-family: var(--font-display);
  overflow-x: clip;
}

/* split-reveal unit (used by useSplitReveal) */
.v22-page .rv-u { display: inline-block; will-change: transform, filter, opacity; }

/* section rhythm */
.v22-section { position: relative; padding: clamp(72px, 10vw, 160px) clamp(20px, 5vw, 80px); }
.v22-eyebrow {
  font-family: var(--font-mono);
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--v22-lit);
}
```

- [ ] **Step 4: Create the data module**

```js
// components/portfolio-v22/projects.js
// V22 sources its content from the shared v20 roster — single source of truth.
import { PROJECTS, PROJECTS_BY_SLUG } from "@/components/portfolio-v20/projects";

export { PROJECTS, PROJECTS_BY_SLUG };

// Curated lead set for the Featured section: the deep case studies first,
// then a few high-recognition brands.
const FEATURED_EXTRA = ["burger-king-krispier", "lg-lifes-good", "vodafone-global"];
export const FEATURED = [
  ...PROJECTS.filter((p) => p.deep),
  ...FEATURED_EXTRA.map((s) => PROJECTS_BY_SLUG[s]).filter(Boolean),
];

export const CAPABILITIES = [
  {
    key: "creativity",
    title: "Creativity",
    body: "Strategy-first concepts that turn category noise into bold, ownable stories.",
  },
  {
    key: "collaboration",
    title: "Collaboration",
    body: "We embed with your team end-to-end — from the core idea to final delivery.",
  },
  {
    key: "craftsmanship",
    title: "Craftsmanship",
    body: "Motion, design and production crafted to a standard that earns attention.",
  },
];

// Numeric values kept separate from formatting so V22Impact can count up.
export const IMPACT = [
  { value: 35.6, prefix: "+", suffix: "%", label: "Revenue YoY (Foodics 2023→2024)" },
  { value: 32000, prefix: "", suffix: "+", label: "Merchants onboarded" },
  { value: 1, prefix: "$", suffix: "B", label: "Unicorn valuation reached" },
  { value: 35, prefix: "", suffix: "%", label: "Saudi market share" },
];
```

- [ ] **Step 5: Re-export the reduced-motion hook**

```js
// components/portfolio-v22/usePrefersReducedMotion.js
"use client";
export { usePrefersReducedMotion } from "@/components/portfolio-v20/usePrefersReducedMotion";
```

- [ ] **Step 6: Create the page with a minimal hero placeholder**

```jsx
// app/portfolio-v22/page.jsx
import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import "@/components/portfolio-v22/v22.css";

export const metadata = {
  title: "Portfolio V22 — The Motion Agency",
  description:
    "Where strategy meets bold storytelling — a motion-led showcase of The Motion Agency's work.",
};

export default function PortfolioV22Page() {
  return (
    <main className="v22-page">
      <SmoothScroll />
      <ClientShell enableScrolledNav />
      <Nav />
      <section className="v22-section">
        <p className="v22-eyebrow">Where strategy meets bold storytelling.</p>
        <h1 style={{ fontSize: "clamp(40px, 9vw, 132px)", lineHeight: 0.95, letterSpacing: "-0.02em", fontWeight: 600, margin: "12px 0 0" }}>
          Motion that moves<br />brands forward.
        </h1>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-scaffold --project=laptop-1440`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/portfolio-v22/page.jsx components/portfolio-v22/v22.css components/portfolio-v22/projects.js components/portfolio-v22/usePrefersReducedMotion.js playwright/tests/v22-scaffold.spec.js
git commit -m "feat(v22): scaffold route, theme tokens, shared data, reduced-motion"
```

---

## Task 1: Magnetic hook + global cursor

**Files:**
- Create: `components/portfolio-v22/hooks/useMagnetic.js`
- Create: `components/portfolio-v22/V22Cursor.jsx`
- Modify: `components/portfolio-v22/v22.css` (append cursor styles)
- Modify: `app/portfolio-v22/page.jsx` (mount `<V22Cursor/>` + a `[data-magnetic]` probe)
- Test: `playwright/tests/v22-cursor.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-cursor.spec.js
import { test, expect } from "@playwright/test";

test("magnetic cursor mounts on fine-pointer and hides native cursor in zones", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-cursor")).toHaveCount(1);
  await expect(page.locator("body.v22-has-cursor")).toHaveCount(1);
});

test("cursor reports the zone label via data attribute", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const probe = page.locator("[data-cursor='view']").first();
  await probe.hover();
  await expect(page.locator(".v22-cursor.is-active")).toBeVisible();
  await expect(page.locator(".v22-cursor-label")).toContainText(/showreel|view/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-cursor --project=laptop-1440`
Expected: FAIL — `.v22-cursor` count 0.

- [ ] **Step 3: Create the magnetic hook**

```js
// components/portfolio-v22/hooks/useMagnetic.js
"use client";
import { useEffect } from "react";
import gsap from "gsap";

// Pulls the referenced element toward the pointer while hovered.
export function useMagnetic(ref, { strength = 0.4 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => { xTo(0); yTo(0); };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, strength]);
}
```

- [ ] **Step 4: Create the cursor component** (extends the proven V20Cursor pattern with multiple labels + a drag state)

```jsx
// components/portfolio-v22/V22Cursor.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function V22Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef(null);
  const labelRef = useRef(null);
  const s = useRef({ tx: 0, ty: 0, x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduce);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("v22-has-cursor");
    const dot = dotRef.current, label = labelRef.current;
    const st = s.current;
    st.tx = st.x = window.innerWidth / 2;
    st.ty = st.y = window.innerHeight / 2;

    const onMove = (e) => { st.tx = e.clientX; st.ty = e.clientY; };
    const zoneOf = (el) => (el && el.closest ? el.closest("[data-cursor]") : null);

    const onOver = (e) => {
      const zone = zoneOf(e.target);
      if (!zone) return;
      const kind = zone.getAttribute("data-cursor"); // view | drag | sound
      const text = zone.getAttribute("data-cursor-label") || kind.toUpperCase();
      if (label) label.textContent = text;
      dot.dataset.kind = kind;
      dot.classList.add("is-active");
    };
    const onOut = (e) => {
      if (zoneOf(e.target) && !zoneOf(e.relatedTarget)) {
        dot.classList.remove("is-active");
        delete dot.dataset.kind;
      }
    };

    let raf = 0;
    const tick = () => {
      st.x += (st.tx - st.x) * 0.22;
      st.y += (st.ty - st.y) * 0.22;
      dot.style.transform = `translate3d(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.body.classList.remove("v22-has-cursor");
    };
  }, [enabled]);

  if (!enabled || typeof document === "undefined") return null;
  return createPortal(
    <div ref={dotRef} className="v22-cursor" aria-hidden="true">
      <span ref={labelRef} className="v22-cursor-label" />
    </div>,
    document.body
  );
}
```

- [ ] **Step 5: Append cursor styles to `v22.css`**

```css
/* ---- magnetic cursor ---- */
.v22-cursor {
  position: fixed; top: 0; left: 0; z-index: 9999;
  width: 14px; height: 14px; border-radius: 999px;
  background: var(--v22-lit, #6fd3ff);
  mix-blend-mode: difference; pointer-events: none;
  display: flex; align-items: center; justify-content: center;
  transition: width .25s ease, height .25s ease, background .25s ease;
}
.v22-cursor-label {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .08em;
  text-transform: uppercase; color: #04121f; opacity: 0; white-space: nowrap;
}
.v22-cursor.is-active { width: 92px; height: 92px; background: #fff; }
.v22-cursor.is-active .v22-cursor-label { opacity: 1; }
.v22-cursor[data-kind="drag"] { width: 76px; height: 76px; }
body.v22-has-cursor [data-cursor] { cursor: none; }
@media (pointer: coarse) { .v22-cursor { display: none; } }
```

- [ ] **Step 6: Mount the cursor + a probe in the page**

In `app/portfolio-v22/page.jsx`, add the import and render `<V22Cursor/>` right after `<SmoothScroll/>`, and give the existing `<h1>`'s wrapper section a probe button so the label test has a target:

```jsx
import V22Cursor from "@/components/portfolio-v22/V22Cursor";
// ...
<SmoothScroll />
<V22Cursor />
// inside the section, after the <h1>:
<a href="#v22-featured" data-cursor="view" data-cursor-label="Showreel" data-magnetic
   className="v22-eyebrow" style={{ display: "inline-block", marginTop: 24 }}>
  ▶ Watch the showreel
</a>
```

- [ ] **Step 7: Run test to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-cursor --project=laptop-1440`
Expected: PASS (both tests).

- [ ] **Step 8: Commit**

```bash
git add components/portfolio-v22/hooks/useMagnetic.js components/portfolio-v22/V22Cursor.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-cursor.spec.js
git commit -m "feat(v22): magnetic hook + global blend-mode cursor with zone labels"
```

---

## Task 2: Split-reveal hook + Hero + DotField

**Files:**
- Create: `components/portfolio-v22/hooks/useSplitReveal.js`
- Create: `components/portfolio-v22/V22DotField.jsx`
- Create: `components/portfolio-v22/V22Hero.jsx`
- Modify: `components/portfolio-v22/v22.css` (hero + dot-field styles)
- Modify: `app/portfolio-v22/page.jsx` (replace placeholder section with `<V22Hero/>`)
- Test: `playwright/tests/v22-hero.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-hero.spec.js
import { test, expect } from "@playwright/test";

test("hero renders headline, eyebrow, magnetic showreel CTA and dot-field", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-hero")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/storytelling/i);
  await expect(page.locator(".v22-hero [data-cursor='view']")).toBeVisible();
  // dot-field renders a deterministic number of dots
  await expect(page.locator(".v22-dotfield .v22-dot")).toHaveCount(14);
});

test("headline characters are split for reveal", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-hero h1 .rv-u").first()).toBeAttached();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-hero --project=laptop-1440`
Expected: FAIL — `.v22-hero` not found.

- [ ] **Step 3: Create the split-reveal hook** (manual char/word split — robust, no plugin licensing)

```js
// components/portfolio-v22/hooks/useSplitReveal.js
"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function useSplitReveal(ref, { by = "chars", stagger = 0.025, start = "top 85%" } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const original = el.textContent;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      return;
    }
    el.setAttribute("aria-label", original);
    el.textContent = "";
    const units = by === "words" ? original.split(/(\s+)/) : Array.from(original);
    const spans = units.map((u) => {
      const span = document.createElement("span");
      span.className = "rv-u";
      span.setAttribute("aria-hidden", "true");
      span.textContent = u === " " ? " " : u;
      el.appendChild(span);
      return span;
    });
    const tween = gsap.from(spans, {
      yPercent: 45, opacity: 0, filter: "blur(12px)", scale: 0.92,
      duration: 0.55, ease: "back.out(1.6)", stagger,
      scrollTrigger: { trigger: el, start, once: true },
      onComplete: () => el.classList.add("is-in"),
    });
    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      el.textContent = original; // restore for HMR / unmount
    };
  }, [ref, by, stagger, start]);
}
```

- [ ] **Step 4: Create the dot-field**

```jsx
// components/portfolio-v22/V22DotField.jsx
"use client";
import { useEffect, useRef } from "react";

// Deterministic positions (no SSR randomness). x/y are percentages within the box.
const DOTS = [
  { x: 12, y: 22, c: "#6fd3ff" }, { x: 28, y: 64, c: "#2f86d8" },
  { x: 41, y: 14, c: "#9fc6ee" }, { x: 53, y: 48, c: "#6fd3ff" },
  { x: 66, y: 28, c: "#ffffff" }, { x: 74, y: 70, c: "#2f86d8" },
  { x: 86, y: 38, c: "#6fd3ff" }, { x: 19, y: 84, c: "#9fc6ee" },
  { x: 60, y: 82, c: "#6fd3ff" }, { x: 92, y: 16, c: "#2f86d8" },
  { x: 8, y: 52, c: "#9fc6ee" }, { x: 36, y: 36, c: "#ffffff" },
  { x: 48, y: 74, c: "#6fd3ff" }, { x: 80, y: 58, c: "#9fc6ee" },
];

export default function V22DotField() {
  const wrapRef = useRef(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dots = Array.from(wrap.querySelectorAll(".v22-dot"));
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      dots.forEach((d, i) => {
        const depth = ((i % 5) + 1) / 18;
        d.style.transform = `translate3d(${(mx * depth).toFixed(1)}px, ${(my * depth).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div ref={wrapRef} className="v22-dotfield" aria-hidden="true">
      {DOTS.map((d, i) => (
        <span key={i} className="v22-dot"
          style={{ left: `${d.x}%`, top: `${d.y}%`, background: d.c }} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create the hero**

```jsx
// components/portfolio-v22/V22Hero.jsx
"use client";
import { useRef } from "react";
import V22DotField from "./V22DotField";
import { useSplitReveal } from "./hooks/useSplitReveal";
import { useMagnetic } from "./hooks/useMagnetic";

export default function V22Hero() {
  const headingRef = useRef(null);
  const ctaRef = useRef(null);
  useSplitReveal(headingRef, { by: "chars", stagger: 0.02 });
  useMagnetic(ctaRef, { strength: 0.5 });

  return (
    <section className="v22-hero v22-section" id="v22-top">
      <div className="v22-hero-copy">
        <p className="v22-eyebrow">Founded 2015 · Riyadh · Cairo</p>
        <h1 ref={headingRef} className="v22-hero-title">
          Where strategy meets bold storytelling.
        </h1>
        <a
          ref={ctaRef}
          href="#v22-featured"
          className="v22-showreel"
          data-magnetic
          data-cursor="view"
          data-cursor-label="Showreel"
        >
          ▶ Watch the reel
        </a>
      </div>
      <V22DotField />
    </section>
  );
}
```

- [ ] **Step 6: Append hero + dot-field styles to `v22.css`**

```css
/* ---- hero ---- */
.v22-hero { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: center; min-height: 92vh; }
.v22-hero-title {
  font-size: clamp(40px, 8.5vw, 124px); line-height: 0.95; letter-spacing: -0.025em;
  font-weight: 600; margin: 14px 0 0; max-width: 14ch;
}
.v22-showreel {
  display: inline-block; margin-top: 34px; padding: 14px 26px; border-radius: 999px;
  background: var(--v22-lit); color: #04121f; font-family: var(--font-label);
  font-weight: 600; text-decoration: none; letter-spacing: .01em;
}
.v22-dotfield { position: relative; height: min(46vh, 420px); }
.v22-dot { position: absolute; width: 16px; height: 16px; border-radius: 999px; transform: translate3d(0,0,0); will-change: transform; }
@media (max-width: 860px) {
  .v22-hero { grid-template-columns: 1fr; min-height: auto; }
  .v22-dotfield { height: 240px; }
}
```

- [ ] **Step 7: Wire the hero into the page**

In `app/portfolio-v22/page.jsx`, remove the placeholder `<section>` (and the temporary probe link) and render `<V22Hero/>`:

```jsx
import V22Hero from "@/components/portfolio-v22/V22Hero";
// ...
<Nav />
<V22Hero />
```

- [ ] **Step 8: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-hero v22-cursor --project=laptop-1440`
Expected: PASS (cursor label test now targets the hero CTA).

- [ ] **Step 9: Commit**

```bash
git add components/portfolio-v22/hooks/useSplitReveal.js components/portfolio-v22/V22DotField.jsx components/portfolio-v22/V22Hero.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-hero.spec.js
git commit -m "feat(v22): split-reveal hook, hero headline, magnetic showreel CTA, dot-field"
```

---

## Task 3: Velocity marquee

**Files:**
- Create: `components/portfolio-v22/V22Marquee.jsx`
- Modify: `components/portfolio-v22/v22.css` (marquee styles)
- Modify: `app/portfolio-v22/page.jsx`
- Test: `playwright/tests/v22-marquee.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-marquee.spec.js
import { test, expect } from "@playwright/test";

test("marquee renders a duplicated track that translates over time", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const track = page.locator(".v22-marquee-track");
  await expect(track).toBeVisible();
  const read = () => track.evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return m.m41; // translateX
  });
  const a = await read();
  await page.waitForTimeout(600);
  const b = await read();
  expect(b).not.toBe(a); // it is moving
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-marquee --project=laptop-1440`
Expected: FAIL — `.v22-marquee-track` not found.

- [ ] **Step 3: Create the marquee** (velocity from scroll delta — decoupled from Lenis internals)

```jsx
// components/portfolio-v22/V22Marquee.jsx
"use client";
import { useEffect, useRef } from "react";

const DEFAULT_ITEMS = [
  "END-TO-END PRODUCTION", "BRAND", "EVENTS", "MOTION DESIGN",
  "CONTENT", "STRATEGY", "CAMPAIGNS", "STORYTELLING",
];

export default function V22Marquee({ items = DEFAULT_ITEMS }) {
  const trackRef = useRef(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = 0, lastY = window.scrollY, vel = 0, raf = 0;
    const BASE = 0.6; // baseline px/frame drift
    const tick = () => {
      const y = window.scrollY;
      vel += (Math.abs(y - lastY) - vel) * 0.1; // eased scroll speed
      lastY = y;
      x -= BASE + vel * 0.25;
      const half = track.scrollWidth / 2;
      if (half > 0 && -x >= half) x += half;
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const row = [...items, ...items]; // duplicate for seamless loop
  return (
    <div className="v22-marquee" aria-hidden="true">
      <div ref={trackRef} className="v22-marquee-track">
        {row.map((t, i) => (
          <span key={i} className="v22-marquee-item">{t}<i className="v22-marquee-dot" /></span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Append marquee styles to `v22.css`**

```css
/* ---- velocity marquee ---- */
.v22-marquee { overflow: hidden; border-block: 1px solid var(--v22-line); padding: 22px 0; }
.v22-marquee-track { display: inline-flex; white-space: nowrap; will-change: transform; }
.v22-marquee-item {
  display: inline-flex; align-items: center; gap: 28px; padding-inline: 14px;
  font-size: clamp(20px, 3vw, 40px); font-weight: 600; letter-spacing: -0.01em; color: var(--v22-dim);
}
.v22-marquee-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--v22-lit); }
```

- [ ] **Step 5: Wire into the page**

```jsx
import V22Marquee from "@/components/portfolio-v22/V22Marquee";
// after <V22Hero />:
<V22Marquee />
```

- [ ] **Step 6: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-marquee --project=laptop-1440`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/portfolio-v22/V22Marquee.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-marquee.spec.js
git commit -m "feat(v22): scroll-velocity marquee"
```

---

## Task 4: Project modal store + self-contained modal

**Files:**
- Create: `components/portfolio-v22/useProjectModal.js`
- Create: `components/portfolio-v22/V22ProjectModal.jsx`
- Modify: `components/portfolio-v22/v22.css` (modal styles)
- Modify: `app/portfolio-v22/page.jsx` (mount `<V22ProjectModal/>`)
- Test: `playwright/tests/v22-modal.spec.js`

> Built before Featured/Archive so their tiles have something to open. The store mirrors v20's `useProjectDrawer` external-store pattern.

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-modal.spec.js
import { test, expect } from "@playwright/test";

test("project modal opens from a programmatic open and closes on Escape", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await page.evaluate(() => window.__v22OpenProject && window.__v22OpenProject("foodics-boundless"));
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Foodics/i);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-modal --project=laptop-1440`
Expected: FAIL — no dialog.

- [ ] **Step 3: Create the store**

```js
// components/portfolio-v22/useProjectModal.js
"use client";
import { useSyncExternalStore } from "react";

let openSlug = null;
let lastTrigger = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => openSlug;
const getServerSnapshot = () => null;

export function openProject(slug, triggerEl) {
  lastTrigger = triggerEl || null;
  openSlug = slug;
  emit();
}
export function closeProject() {
  openSlug = null;
  emit();
  if (lastTrigger && typeof lastTrigger.focus === "function") {
    try { lastTrigger.focus({ preventScroll: true }); } catch {}
  }
  lastTrigger = null;
}
export function useProjectModal() {
  const slug = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { openSlug: slug, open: openProject, close: closeProject };
}
```

- [ ] **Step 4: Create the modal**

```jsx
// components/portfolio-v22/V22ProjectModal.jsx
"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PROJECTS_BY_SLUG } from "./projects";
import { useProjectModal, openProject } from "./useProjectModal";

export default function V22ProjectModal() {
  const { openSlug, close } = useProjectModal();

  // expose a test/debug hook + lock scroll while open
  useEffect(() => {
    if (typeof window !== "undefined") window.__v22OpenProject = openProject;
  }, []);
  useEffect(() => {
    if (!openSlug) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [openSlug, close]);

  if (!openSlug || typeof document === "undefined") return null;
  const p = PROJECTS_BY_SLUG[openSlug];
  if (!p) return null;

  return createPortal(
    <div className="v22-modal" role="dialog" aria-modal="true" aria-label={`${p.client} — ${p.title}`}>
      <button className="v22-modal-scrim" aria-label="Close" onClick={close} />
      <div className="v22-modal-card">
        <button className="v22-modal-close" onClick={close} aria-label="Close project">✕</button>
        <p className="v22-eyebrow">{p.client} · {p.category}</p>
        <h2 className="v22-modal-title">{p.title}</h2>
        {p.tagline ? <p className="v22-modal-tagline">{p.tagline}</p> : null}
        {p.intro ? <p className="v22-modal-intro">{p.intro}</p> : null}
        {Array.isArray(p.services) && p.services.length ? (
          <ul className="v22-modal-services">
            {p.services.map((s) => <li key={s}>{s}</li>)}
          </ul>
        ) : null}
        {Array.isArray(p.results) && p.results.length ? (
          <div className="v22-modal-results">
            {p.results.map((r) => (
              <div key={r.label} className="v22-modal-result">
                <span className="v22-modal-metric">{r.metric}</span>
                <span className="v22-modal-metric-label">{r.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 5: Append modal styles to `v22.css`**

```css
/* ---- project modal ---- */
.v22-modal { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; }
.v22-modal-scrim { position: absolute; inset: 0; border: 0; background: rgba(2,8,15,.72); backdrop-filter: blur(6px); cursor: pointer; }
.v22-modal-card {
  position: relative; z-index: 1; width: min(720px, 92vw); max-height: 88vh; overflow: auto;
  background: var(--v22-panel); border: 1px solid var(--v22-line); border-radius: 18px;
  padding: clamp(24px, 4vw, 48px); color: var(--v22-ink);
}
.v22-modal-close { position: absolute; top: 16px; right: 16px; background: transparent; border: 0; color: var(--v22-dim); font-size: 18px; cursor: pointer; }
.v22-modal-title { font-size: clamp(28px, 5vw, 52px); line-height: 1; letter-spacing: -0.02em; margin: 8px 0 0; }
.v22-modal-tagline { color: var(--v22-lit); font-family: var(--font-label); margin: 10px 0 0; }
.v22-modal-intro { color: var(--v22-dim); line-height: 1.6; margin: 18px 0 0; }
.v22-modal-services { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 22px 0 0; }
.v22-modal-services li { font-family: var(--font-mono); font-size: 12px; padding: 6px 12px; border: 1px solid var(--v22-line); border-radius: 999px; color: var(--v22-dim); }
.v22-modal-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 18px; margin: 26px 0 0; }
.v22-modal-metric { display: block; font-size: clamp(24px, 4vw, 40px); font-weight: 600; color: var(--v22-lit); }
.v22-modal-metric-label { display: block; font-size: 13px; color: var(--v22-dim); margin-top: 4px; }
```

- [ ] **Step 6: Mount in the page**

```jsx
import V22ProjectModal from "@/components/portfolio-v22/V22ProjectModal";
// after <V22Cursor />:
<V22ProjectModal />
```

- [ ] **Step 7: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-modal --project=laptop-1440`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/portfolio-v22/useProjectModal.js components/portfolio-v22/V22ProjectModal.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-modal.spec.js
git commit -m "feat(v22): project modal store + self-contained detail modal"
```

---

## Task 5: Scrub-video hook + Featured Work

**Files:**
- Create: `components/portfolio-v22/hooks/useScrubVideo.js`
- Create: `components/portfolio-v22/V22FeaturedWork.jsx`
- Modify: `components/portfolio-v22/v22.css` (featured styles)
- Modify: `app/portfolio-v22/page.jsx`
- Test: `playwright/tests/v22-featured.spec.js`

> Tiles use `project.hero` (poster) + `project.video` if present. Many roster entries have no `video` field; the tile shows the poster image and is still clickable. The lead tile attempts scroll-scrub only if a video element with a duration exists.

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-featured.spec.js
import { test, expect } from "@playwright/test";

test("featured section renders the curated tiles and opens a project", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const section = page.locator("#v22-featured");
  await expect(section).toBeVisible();
  const tiles = section.locator(".v22-feat-tile");
  await expect(await tiles.count()).toBeGreaterThanOrEqual(3);
  await tiles.first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-featured --project=laptop-1440`
Expected: FAIL — `#v22-featured` not found.

- [ ] **Step 3: Create the scrub-video hook**

```js
// components/portfolio-v22/hooks/useScrubVideo.js
"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// Maps the container's scroll progress onto the video's currentTime.
export function useScrubVideo(videoRef, containerRef) {
  useEffect(() => {
    const v = videoRef.current, c = containerRef.current;
    if (!v || !c || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    v.muted = true;
    v.pause();
    const hasDur = () => Number.isFinite(v.duration) && v.duration > 0;
    const st = ScrollTrigger.create({
      trigger: c, start: "top bottom", end: "bottom top", scrub: true,
      onUpdate: (self) => { if (hasDur()) v.currentTime = self.progress * v.duration; },
    });
    return () => st.kill();
  }, [videoRef, containerRef]);
}
```

- [ ] **Step 4: Create Featured Work**

```jsx
// components/portfolio-v22/V22FeaturedWork.jsx
"use client";
import { useRef } from "react";
import { FEATURED } from "./projects";
import { openProject } from "./useProjectModal";
import { useScrubVideo } from "./hooks/useScrubVideo";
import { useSplitReveal } from "./hooks/useSplitReveal";

function LeadTile({ project }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const titleRef = useRef(null);
  useScrubVideo(videoRef, wrapRef);
  useSplitReveal(titleRef, { by: "chars", stagger: 0.02 });
  return (
    <button
      ref={wrapRef}
      className="v22-feat-tile v22-feat-lead"
      data-cursor="view" data-cursor-label="See project"
      onClick={(e) => openProject(project.slug, e.currentTarget)}
    >
      <div className="v22-feat-media">
        {project.video ? (
          <video ref={videoRef} src={project.video} poster={project.hero} muted playsInline preload="none" />
        ) : (
          <img src={project.hero} alt="" loading="lazy" />
        )}
      </div>
      <div className="v22-feat-meta">
        <span className="v22-eyebrow">{project.client} · {project.category}</span>
        <h3 ref={titleRef} className="v22-feat-title">{project.title}</h3>
      </div>
    </button>
  );
}

function GridTile({ project }) {
  const videoRef = useRef(null);
  const onEnter = () => { const v = videoRef.current; if (v && v.play) v.play().catch(() => {}); };
  const onLeave = () => { const v = videoRef.current; if (v) { v.pause(); } };
  return (
    <button
      className="v22-feat-tile"
      data-cursor="view" data-cursor-label="See project"
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      onClick={(e) => openProject(project.slug, e.currentTarget)}
    >
      <div className="v22-feat-media">
        {project.video ? (
          <video ref={videoRef} src={project.video} poster={project.hero} muted loop playsInline preload="none" />
        ) : (
          <img src={project.hero} alt="" loading="lazy" />
        )}
      </div>
      <div className="v22-feat-meta">
        <span className="v22-eyebrow">{project.client}</span>
        <h3 className="v22-feat-title-sm">{project.title}</h3>
      </div>
    </button>
  );
}

export default function V22FeaturedWork() {
  const [lead, ...rest] = FEATURED;
  return (
    <section id="v22-featured" className="v22-section v22-featured">
      <p className="v22-eyebrow">Selected work</p>
      {lead ? <LeadTile project={lead} /> : null}
      <div className="v22-feat-grid">
        {rest.map((p) => <GridTile key={p.slug} project={p} />)}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Append featured styles to `v22.css`**

```css
/* ---- featured work ---- */
.v22-featured { display: flex; flex-direction: column; gap: 28px; }
.v22-feat-tile { appearance: none; border: 0; background: transparent; text-align: left; padding: 0; cursor: pointer; color: inherit; }
.v22-feat-media { position: relative; overflow: hidden; border-radius: 16px; background: var(--v22-panel); aspect-ratio: 16 / 9; }
.v22-feat-media > img, .v22-feat-media > video { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s ease; }
.v22-feat-tile:hover .v22-feat-media > img, .v22-feat-tile:hover .v22-feat-media > video { transform: scale(1.04); }
.v22-feat-lead .v22-feat-media { aspect-ratio: 21 / 9; }
.v22-feat-meta { display: flex; flex-direction: column; gap: 6px; padding: 14px 4px 0; }
.v22-feat-title { font-size: clamp(28px, 5vw, 64px); line-height: 0.98; letter-spacing: -0.02em; font-weight: 600; margin: 0; }
.v22-feat-title-sm { font-size: clamp(18px, 2.4vw, 26px); margin: 0; font-weight: 600; }
.v22-feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px; }
```

- [ ] **Step 6: Wire into the page**

```jsx
import V22FeaturedWork from "@/components/portfolio-v22/V22FeaturedWork";
// after <V22Marquee />:
<V22FeaturedWork />
```

- [ ] **Step 7: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-featured --project=laptop-1440`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/portfolio-v22/hooks/useScrubVideo.js components/portfolio-v22/V22FeaturedWork.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-featured.spec.js
git commit -m "feat(v22): scrub-video hook + featured work (lead scrub tile + hover-play grid)"
```

---

## Task 6: Capabilities (3 C's)

**Files:**
- Create: `components/portfolio-v22/V22Capabilities.jsx`
- Modify: `components/portfolio-v22/v22.css`
- Modify: `app/portfolio-v22/page.jsx`
- Test: `playwright/tests/v22-capabilities.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-capabilities.spec.js
import { test, expect } from "@playwright/test";

test("capabilities renders the three pillars and reveals on scroll", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const cards = page.locator(".v22-cap-card");
  await expect(cards).toHaveCount(3);
  await cards.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await expect(page.locator(".v22-cap-card.is-in").first()).toBeVisible();
  await expect(cards.nth(0)).toContainText(/Creativity/i);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-capabilities --project=laptop-1440`
Expected: FAIL — no `.v22-cap-card`.

- [ ] **Step 3: Create the component**

```jsx
// components/portfolio-v22/V22Capabilities.jsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CAPABILITIES } from "./projects";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function V22Capabilities() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;
    const cards = Array.from(root.querySelectorAll(".v22-cap-card"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => c.classList.add("is-in"));
      return;
    }
    const triggers = cards.map((card) =>
      ScrollTrigger.create({
        trigger: card, start: "top 80%", once: true,
        onEnter: () => card.classList.add("is-in"),
      })
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section ref={rootRef} className="v22-section v22-caps">
      <p className="v22-eyebrow">How we work</p>
      <div className="v22-cap-grid">
        {CAPABILITIES.map((c) => (
          <article key={c.key} className="v22-cap-card" data-skin={c.key}>
            <h3 className="v22-cap-title">{c.title}</h3>
            <p className="v22-cap-body">{c.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Append styles** (clip-path reveal driven by the `is-in` class)

```css
/* ---- capabilities ---- */
.v22-caps { border-top: 1px solid var(--v22-line); }
.v22-cap-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 28px; }
.v22-cap-card {
  border: 1px solid var(--v22-line); border-radius: 16px; padding: 32px;
  background: linear-gradient(160deg, var(--v22-panel), #071320);
  clip-path: inset(0 0 100% 0); opacity: 0; transition: clip-path .7s ease, opacity .7s ease;
}
.v22-cap-card.is-in { clip-path: inset(0 0 0 0); opacity: 1; }
.v22-cap-title { font-size: clamp(24px, 3vw, 40px); margin: 0; letter-spacing: -0.02em; }
.v22-cap-card[data-skin="creativity"] .v22-cap-title { color: var(--v22-lit); }
.v22-cap-card[data-skin="collaboration"] .v22-cap-title { color: #9544FF; }
.v22-cap-card[data-skin="craftsmanship"] .v22-cap-title { color: #00ff49; }
.v22-cap-body { color: var(--v22-dim); line-height: 1.6; margin: 14px 0 0; }
@media (max-width: 860px) { .v22-cap-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 5: Wire into the page**

```jsx
import V22Capabilities from "@/components/portfolio-v22/V22Capabilities";
// after <V22FeaturedWork />:
<V22Capabilities />
```

- [ ] **Step 6: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-capabilities --project=laptop-1440`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/portfolio-v22/V22Capabilities.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-capabilities.spec.js
git commit -m "feat(v22): capabilities 3 C's with clip-path reveal + accent skins"
```

---

## Task 7: Work Archive (Draggable rail + filters)

**Files:**
- Create: `components/portfolio-v22/V22WorkArchive.jsx`
- Modify: `components/portfolio-v22/v22.css`
- Modify: `app/portfolio-v22/page.jsx`
- Test: `playwright/tests/v22-archive.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-archive.spec.js
import { test, expect } from "@playwright/test";

test("archive lists all projects and filters by category", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const cards = page.locator(".v22-arch-card");
  const total = await cards.count();
  expect(total).toBeGreaterThan(20);
  // open the filters and pick the first non-"All" category
  await page.locator(".v22-arch-filter-toggle").click();
  const chip = page.locator(".v22-arch-chip").nth(1);
  const label = (await chip.textContent())?.trim();
  await chip.click();
  await page.waitForTimeout(200);
  const filtered = await cards.count();
  expect(filtered).toBeLessThan(total);
  expect(label && label.length).toBeTruthy();
});

test("clicking an archive card opens its project", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await page.locator(".v22-arch-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-archive --project=laptop-1440`
Expected: FAIL — no `.v22-arch-card`.

- [ ] **Step 3: Create the component** (GSAP Draggable, free plugin; no Inertia)

```jsx
// components/portfolio-v22/V22WorkArchive.jsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { PROJECTS } from "./projects";
import { openProject } from "./useProjectModal";

if (typeof window !== "undefined") gsap.registerPlugin(Draggable);

const baseCategory = (p) => (p.category || "Other").split(/[·\-—]/)[0].trim();

export default function V22WorkArchive() {
  const [active, setActive] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const railRef = useRef(null);
  const trackRef = useRef(null);

  const categories = useMemo(() => {
    const set = new Set(PROJECTS.map(baseCategory));
    return ["All", ...Array.from(set)];
  }, []);

  const visible = useMemo(
    () => (active === "All" ? PROJECTS : PROJECTS.filter((p) => baseCategory(p) === active)),
    [active]
  );

  useEffect(() => {
    const track = trackRef.current, rail = railRef.current;
    if (!track || !rail || typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // native scroll on touch
    const setBounds = () => {
      const min = Math.min(0, rail.clientWidth - track.scrollWidth);
      return { minX: min, maxX: 0 };
    };
    const drag = Draggable.create(track, {
      type: "x", inertia: false, bounds: setBounds(),
      cursor: "grab", activeCursor: "grabbing",
    })[0];
    const onResize = () => drag.applyBounds(setBounds());
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); drag.kill(); };
  }, [visible.length]);

  return (
    <section className="v22-section v22-arch">
      <header className="v22-arch-head">
        <h2 className="v22-arch-title">Work</h2>
        <div className="v22-arch-filters">
          <button
            className="v22-arch-filter-toggle" data-magnetic
            data-cursor="view" data-cursor-label="Filters"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            + Filters
          </button>
          {filtersOpen ? (
            <div className="v22-arch-chips">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`v22-arch-chip${c === active ? " is-active" : ""}`}
                  onClick={() => setActive(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div ref={railRef} className="v22-arch-rail" data-cursor="drag" data-cursor-label="Drag">
        <div ref={trackRef} className="v22-arch-track">
          {visible.map((p) => (
            <button
              key={p.slug}
              className="v22-arch-card"
              onClick={(e) => openProject(p.slug, e.currentTarget)}
            >
              <div className="v22-arch-media"><img src={p.thumb} alt="" loading="lazy" /></div>
              <span className="v22-eyebrow">{p.client}</span>
              <span className="v22-arch-card-title">{p.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Append styles**

```css
/* ---- work archive ---- */
.v22-arch-head { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.v22-arch-title { font-size: clamp(48px, 12vw, 180px); line-height: 0.9; letter-spacing: -0.03em; margin: 0; }
.v22-arch-filters { position: relative; }
.v22-arch-filter-toggle { background: var(--v22-panel); color: var(--v22-ink); border: 1px solid var(--v22-line); border-radius: 999px; padding: 12px 22px; font-family: var(--font-label); cursor: pointer; }
.v22-arch-chips { position: absolute; right: 0; margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; max-width: 420px; padding: 14px; background: var(--v22-panel); border: 1px solid var(--v22-line); border-radius: 14px; z-index: 5; }
.v22-arch-chip { background: transparent; border: 1px solid var(--v22-line); color: var(--v22-dim); border-radius: 999px; padding: 6px 14px; font-size: 13px; cursor: pointer; }
.v22-arch-chip.is-active { background: var(--v22-lit); color: #04121f; border-color: var(--v22-lit); }
.v22-arch-rail { overflow: hidden; margin-top: 34px; }
.v22-arch-track { display: flex; gap: 22px; width: max-content; will-change: transform; }
.v22-arch-card { width: 300px; flex: 0 0 auto; background: transparent; border: 0; padding: 0; text-align: left; color: inherit; cursor: pointer; display: flex; flex-direction: column; gap: 8px; }
.v22-arch-media { aspect-ratio: 4 / 3; border-radius: 14px; overflow: hidden; background: var(--v22-panel); }
.v22-arch-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.v22-arch-card-title { font-size: 18px; font-weight: 600; }
@media (pointer: coarse) { .v22-arch-rail { overflow-x: auto; } }
```

- [ ] **Step 5: Wire into the page**

```jsx
import V22WorkArchive from "@/components/portfolio-v22/V22WorkArchive";
// after <V22Capabilities />:
<V22WorkArchive />
```

- [ ] **Step 6: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-archive --project=laptop-1440`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/portfolio-v22/V22WorkArchive.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-archive.spec.js
git commit -m "feat(v22): work archive drag-rail with category filters"
```

---

## Task 8: Impact (count-up stats)

**Files:**
- Create: `components/portfolio-v22/V22Impact.jsx`
- Modify: `components/portfolio-v22/v22.css`
- Modify: `app/portfolio-v22/page.jsx`
- Test: `playwright/tests/v22-impact.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-impact.spec.js
import { test, expect } from "@playwright/test";

test("impact renders four stats and counts up on scroll", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const stats = page.locator(".v22-stat");
  await expect(stats).toHaveCount(4);
  await stats.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1600);
  const text = (await page.locator(".v22-stat-value").first().textContent())?.trim();
  expect(text).toMatch(/[0-9]/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-impact --project=laptop-1440`
Expected: FAIL — no `.v22-stat`.

- [ ] **Step 3: Create the component**

```jsx
// components/portfolio-v22/V22Impact.jsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMPACT } from "./projects";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const fmt = (n, item) => {
  const rounded = item.value % 1 === 0 ? Math.round(n) : n.toFixed(1);
  const withThousands = Number(rounded).toLocaleString("en-US");
  return `${item.prefix}${withThousands}${item.suffix}`;
};

export default function V22Impact() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;
    const valEls = Array.from(root.querySelectorAll(".v22-stat-value"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    valEls.forEach((el, i) => {
      const item = IMPACT[i];
      if (reduce) { el.textContent = fmt(item.value, item); return; }
      const obj = { n: 0 };
      gsap.to(obj, {
        n: item.value, duration: 1.4, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate: () => { el.textContent = fmt(obj.n, item); },
        onComplete: () => { el.textContent = fmt(item.value, item); },
      });
    });
    return () => ScrollTrigger.getAll().forEach((t) => { if (root.contains(t.trigger)) t.kill(); });
  }, []);

  return (
    <section ref={rootRef} className="v22-section v22-impact">
      <p className="v22-eyebrow">Impact</p>
      <div className="v22-stat-grid">
        {IMPACT.map((item) => (
          <div key={item.label} className="v22-stat">
            <span className="v22-stat-value">{`${item.prefix}0${item.suffix}`}</span>
            <span className="v22-stat-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Append styles**

```css
/* ---- impact ---- */
.v22-impact { border-top: 1px solid var(--v22-line); }
.v22-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 28px; }
.v22-stat { display: flex; flex-direction: column; gap: 8px; }
.v22-stat-value { font-size: clamp(40px, 7vw, 96px); line-height: 1; font-weight: 600; letter-spacing: -0.03em; color: var(--v22-lit); font-variant-numeric: tabular-nums; }
.v22-stat-label { color: var(--v22-dim); font-size: 14px; max-width: 22ch; }
@media (max-width: 860px) { .v22-stat-grid { grid-template-columns: repeat(2, 1fr); } }
```

- [ ] **Step 5: Wire into the page**

```jsx
import V22Impact from "@/components/portfolio-v22/V22Impact";
// after <V22WorkArchive />:
<V22Impact />
```

- [ ] **Step 6: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-impact --project=laptop-1440`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/portfolio-v22/V22Impact.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-impact.spec.js
git commit -m "feat(v22): impact count-up stats"
```

---

## Task 9: Contact + Footer + final assembly

**Files:**
- Modify: `app/portfolio-v22/page.jsx` (append `Contact`, `Footer`; final import order)
- Test: `playwright/tests/v22-assembly.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-assembly.spec.js
import { test, expect } from "@playwright/test";

test("page assembles all sections in order with contact + footer", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-hero")).toBeVisible();
  await expect(page.locator(".v22-marquee")).toBeVisible();
  await expect(page.locator("#v22-featured")).toBeVisible();
  await expect(page.locator(".v22-caps")).toBeVisible();
  await expect(page.locator(".v22-arch")).toBeVisible();
  await expect(page.locator(".v22-impact")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-assembly --project=laptop-1440`
Expected: FAIL — `footer` not found.

- [ ] **Step 3: Finalize the page** (full file, replacing prior incremental version)

```jsx
// app/portfolio-v22/page.jsx
import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import V22Cursor from "@/components/portfolio-v22/V22Cursor";
import V22ProjectModal from "@/components/portfolio-v22/V22ProjectModal";
import V22Hero from "@/components/portfolio-v22/V22Hero";
import V22Marquee from "@/components/portfolio-v22/V22Marquee";
import V22FeaturedWork from "@/components/portfolio-v22/V22FeaturedWork";
import V22Capabilities from "@/components/portfolio-v22/V22Capabilities";
import V22WorkArchive from "@/components/portfolio-v22/V22WorkArchive";
import V22Impact from "@/components/portfolio-v22/V22Impact";
import "@/components/portfolio-v22/v22.css";

export const metadata = {
  title: "Portfolio V22 — The Motion Agency",
  description:
    "Where strategy meets bold storytelling — a motion-led showcase of The Motion Agency's work.",
};

export default function PortfolioV22Page() {
  return (
    <main className="v22-page">
      <SmoothScroll />
      <V22Cursor />
      <V22ProjectModal />
      <ClientShell enableScrolledNav />
      <Nav />
      <V22Hero />
      <V22Marquee />
      <V22FeaturedWork />
      <V22Capabilities />
      <V22WorkArchive />
      <V22Impact />
      <Contact />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-assembly --project=laptop-1440`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/portfolio-v22/page.jsx playwright/tests/v22-assembly.spec.js
git commit -m "feat(v22): assemble full page with contact + footer"
```

---

## Task 10: Reduced-motion fallback + console-clean + full sweep

**Files:**
- Test: `playwright/tests/v22-reduced-motion.spec.js`
- Test: `playwright/tests/v22-console.spec.js`
- Possible fix targets: any component that throws or animates under reduced motion.

- [ ] **Step 1: Write the reduced-motion test**

```js
// playwright/tests/v22-reduced-motion.spec.js
import { test, expect } from "@playwright/test";
test.use({ reducedMotion: "reduce" });

test("reduced motion: no custom cursor, headings present, marquee static", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-cursor")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/storytelling/i);
  // headline is fully visible (split-reveal added is-in immediately)
  await expect(page.locator(".v22-hero h1.is-in")).toBeVisible();
  // marquee track does not drift
  const track = page.locator(".v22-marquee-track");
  const read = () => track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  const a = await read(); await page.waitForTimeout(500); const b = await read();
  expect(b).toBe(a);
});
```

- [ ] **Step 2: Write the console-clean test**

```js
// playwright/tests/v22-console.spec.js
import { test, expect } from "@playwright/test";

test("no console errors on load and after a full scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/portfolio-v22");
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
  });
  await page.waitForTimeout(400);
  expect(errors, errors.join("\n")).toEqual([]);
});
```

- [ ] **Step 3: Run both; fix any failures**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-reduced-motion v22-console --project=laptop-1440`
Expected: PASS. If the console test fails, the message lists offending logs — fix the component, re-run. (The `console.log` calls in hooks/components must be removed; none are specified in this plan.)

- [ ] **Step 4: Full multi-viewport sweep**

Run:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22- --project=mobile-375 --project=tablet-768 --project=laptop-1440 --project=desktop-1920
```
Expected: all `v22-*` specs PASS across all four viewports. Fix any responsive breakage (most likely in archive chips overflow or hero grid at 375px).

- [ ] **Step 5: Commit**

```bash
git add playwright/tests/v22-reduced-motion.spec.js playwright/tests/v22-console.spec.js
git commit -m "test(v22): reduced-motion fallback + console-clean + multi-viewport sweep"
```

---

## Task 11: Preloader (monogram + 0→100 counter)

**Files:**
- Create: `components/portfolio-v22/V22Preloader.jsx`
- Modify: `components/portfolio-v22/v22.css`
- Modify: `app/portfolio-v22/page.jsx` (mount `<V22Preloader/>` first)
- Test: `playwright/tests/v22-preloader.spec.js`

> Built last on purpose: it fully **unmounts** after its intro and adds `body.v22-ready`, so Playwright's action auto-wait transparently delays clicks in earlier specs until it's gone — no edits to Tasks 0–10 needed.

- [ ] **Step 1: Write the failing test**

```js
// playwright/tests/v22-preloader.spec.js
import { test, expect } from "@playwright/test";

test("preloader plays then unmounts, marking the page ready", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator("body.v22-ready")).toHaveCount(1, { timeout: 6000 });
  await expect(page.locator(".v22-preloader")).toHaveCount(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-preloader --project=laptop-1440`
Expected: FAIL — `body.v22-ready` never appears.

- [ ] **Step 3: Create the preloader**

```jsx
// components/portfolio-v22/V22Preloader.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function V22Preloader() {
  const [done, setDone] = useState(false);
  const rootRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const markReady = () => { document.body.classList.add("v22-ready"); setDone(true); };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markReady();
      return;
    }
    const root = rootRef.current, count = countRef.current;
    const obj = { n: 0 };
    const tl = gsap.timeline({ onComplete: markReady });
    tl.to(obj, {
      n: 100, duration: 1.0, ease: "power2.inOut",
      onUpdate: () => { if (count) count.textContent = String(Math.round(obj.n)); },
    });
    tl.to(root, { yPercent: -100, duration: 0.6, ease: "power3.inOut" }, "+=0.1");
    return () => tl.kill();
  }, []);

  if (done) return null;
  return (
    <div ref={rootRef} className="v22-preloader" aria-hidden="true">
      <span className="v22-preloader-mark">the motion agency</span>
      <span ref={countRef} className="v22-preloader-count">0</span>
    </div>
  );
}
```

- [ ] **Step 4: Append styles to `v22.css`**

```css
/* ---- preloader ---- */
.v22-preloader {
  position: fixed; inset: 0; z-index: 10000; background: var(--v22-bg);
  display: flex; align-items: center; justify-content: space-between;
  padding: clamp(20px, 5vw, 60px); will-change: transform;
}
.v22-preloader-mark { font-family: var(--font-label); font-weight: 600; letter-spacing: -0.01em; color: var(--v22-ink); }
.v22-preloader-count { font-size: clamp(48px, 14vw, 200px); font-weight: 600; color: var(--v22-lit); font-variant-numeric: tabular-nums; line-height: 1; }
```

- [ ] **Step 5: Mount first in the page**

In `app/portfolio-v22/page.jsx`, add the import and render `<V22Preloader/>` as the first child of `<main>` (before `<SmoothScroll/>`):

```jsx
import V22Preloader from "@/components/portfolio-v22/V22Preloader";
// ...
<main className="v22-page">
  <V22Preloader />
  <SmoothScroll />
  {/* ...rest unchanged... */}
```

- [ ] **Step 6: Run to verify it passes**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-preloader --project=laptop-1440`
Expected: PASS.

- [ ] **Step 7: Re-run the full suite to confirm nothing regressed**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22- --project=laptop-1440`
Expected: all `v22-*` specs PASS (clicks in featured/archive/modal auto-wait through the ~1.6s preloader).

- [ ] **Step 8: Commit**

```bash
git add components/portfolio-v22/V22Preloader.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-preloader.spec.js
git commit -m "feat(v22): preloader monogram + 0-100 counter wipe-reveal"
```

---

## Refinements vs. spec (flag for reviewer)

- **Project modal is self-contained** (its own component + store + styles) rather than literally forking `V20ProjectModal`. This keeps V22's CSS prefixed and avoids importing the entire `v20.css`. Same UX as specified.
- **Showreel CTA** scrolls to `#v22-featured` (anchor) rather than opening a dedicated reel player; a reel-video modal can be added later if desired (not in scope).
- **Work-archive uses GSAP Draggable without InertiaPlugin** (Inertia is a paid plugin); drag is bounded with `inertia:false`. Touch devices fall back to native horizontal scroll.
- **Velocity source** is `window.scrollY` delta (not `lenis.velocity`) so the marquee stays decoupled from `SmoothScroll`'s internal Lenis instance. Equivalent effect.

## Self-review notes

- **Spec coverage:** every spec section maps to a task — preloader (Task 11), hero + dot-field (Task 2), velocity marquee (Task 3), featured work + scrub video (Task 5), capabilities (Task 6), work archive + filters (Task 7), impact stats (Task 8), contact/footer (Task 9), magnetic cursor (Task 1), reduced-motion + a11y + testing (Task 10). Lenis↔ScrollTrigger wiring is reused from the existing `SmoothScroll` (Task 0).
- **Type/name consistency:** the store API (`openProject`/`closeProject`/`useProjectModal`) is used identically in the modal (Task 4), featured tiles (Task 5) and archive cards (Task 7). The split-reveal `is-in` class set by `useSplitReveal` (Task 2) is the same class asserted in the reduced-motion test (Task 10). Data exports `FEATURED`/`CAPABILITIES`/`IMPACT` (Task 0) match their consumers (Tasks 5/6/8).
- **No placeholders:** every code step contains complete, runnable code; no TODO/TBD.
- **Ordering:** modal (Task 4) precedes the tile sections (5/7) so their click targets exist; preloader (Task 11) is last so it can't gate the build of earlier sections.

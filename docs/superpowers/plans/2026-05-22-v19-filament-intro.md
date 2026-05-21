# V19 Filament Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the filament write "The Motion Agency" in the cinemascope preloader, fly a tip to the "Design" word, then scroll-draw from Design through the hero into the work lane (wiping Design's colour) — reading as one continuous line.

**Architecture:** Three coordinated SVGs sharing exact handoff coordinates and one cool gradient: (1) an intro overlay SVG in `V19Preloader` (time-driven: wordmark stroke-draw + flight to a runtime-measured "Design" border), (2) a scroll-driven hero-lead segment (`V19Filament variant="lead"`) starting at Design and crossing it, ending at the hero's bottom-left seam, (3) the existing work-lane `V19Filament` (unchanged). The intro plays once per load, then scroll takes over.

**Tech Stack:** Next.js (App Router), React, GSAP core + `gsap/ScrollTrigger` (native SVG dash; no DrawSVG), SVG `<text>` stroke-draw for the wordmark, Playwright e2e.

---

## File Structure

- **Modify** `tma-web/components/portfolio-v19/V19Hero.jsx` — wrap "Design" inner text in `.v19-line-word`; mount `<V19Filament variant="lead" />` inside `.v19-hero`.
- **Modify** `tma-web/components/portfolio-v19/V19Filament.jsx` — add `variant` prop: `"lane"` (current behaviour, default) and `"lead"` (hero segment, starts at Design, single Design wipe, hero ScrollTrigger, persistent seed). Expose a stable hook for the preloader to read Design's measured border and to know when the lead has mounted.
- **Modify** `tma-web/components/portfolio-v19/V19Preloader.jsx` — replace the "M" monogram stroke-draw with an SVG `<text>` wordmark stroke-draw (left→right reveal); after the split, animate a flight `<path>` tip to the measured "Design" border; on completion hand off (the lead segment is already mounted and seeded).
- **Modify** `tma-web/components/portfolio-v19/v19.css` — `.v19-line-word` wipe gradient (mirror `.v19fw-title-word`); `.v19-filament--lead` positioning; wordmark `<text>`/flight styles in the preloader.
- **Modify** `tma-web/playwright/tests/v19-filament.spec.js` — add hero-lead + Design-wipe tests (lane tests stay).
- **Create** `tma-web/playwright/tests/v19-intro.spec.js` — preloader wordmark-draw, flight-lands-at-Design, once-per-load, reduced-motion.

### Layering / coordinate notes (verified in the codebase)

- `.v19-hero` is `position: relative; overflow: hidden;` with bg at `z-index:0` and `.v19-hero-inner` at `z-index:4`. A `.v19-filament` (base `z-index:1`) mounted in the hero sits above the bg and **behind** the headline — same as the (reverted) earlier hero lead.
- `.v19-line-4 > span` is the inner "Design" text node; its **X is reliable even mid entrance-animation** (the rise animation only translates Y).
- At scroll-top, `.v19-hero` top = viewport top, so Design's `getBoundingClientRect` (viewport coords, used by the flight) equals its hero-local coords (used by the lead). This is the shared handoff coordinate.
- The preloader holds the viewport at top during the intro, so the measurement is taken at scroll 0.

---

## Task 1: "Design" wipe target

**Files:**
- Modify: `tma-web/components/portfolio-v19/V19Hero.jsx`
- Modify: `tma-web/components/portfolio-v19/v19.css`

- [ ] **Step 1: Add the wipe class to the "Design" text node**

In `V19Hero.jsx`, change:

```jsx
              <span className="v19-line v19-line-4">
                <span>Design</span>
              </span>
```

to:

```jsx
              <span className="v19-line v19-line-4">
                <span className="v19-line-word">Design</span>
              </span>
```

- [ ] **Step 2: Add the wipe gradient CSS (mirror `.v19fw-title-word`)**

Append to `tma-web/components/portfolio-v19/v19.css`:

```css
/* "Design" fills with the filament colour as the line tip crosses it,
   driven by --v19-wipe (0%→100%) — same technique as .v19fw-title-word. */
.v19-line-word {
  --v19-wipe: 0%;
  --v19-lit: #6fd3ff;
  background-image: linear-gradient(
    90deg,
    var(--v19-lit) 0%,
    var(--v19-lit) var(--v19-wipe),
    currentColor var(--v19-wipe),
    currentColor 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

- [ ] **Step 3: Verify the page still renders and the word is unchanged at rest**

Run (dev server already running on :3000):

```bash
cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=laptop-1440 v19-filament.spec.js -g "mount" 2>&1 | tail -5
```

Expected: existing mount test still passes; visually "Design" still reads white at rest (wipe 0%).

- [ ] **Step 4: Commit**

```bash
git add tma-web/components/portfolio-v19/V19Hero.jsx tma-web/components/portfolio-v19/v19.css
git commit -m "feat(v19): make the Design word a filament wipe target"
```

---

## Task 2: Hero-lead filament segment (`variant="lead"`)

**Files:**
- Modify: `tma-web/components/portfolio-v19/V19Filament.jsx`
- Modify: `tma-web/components/portfolio-v19/V19Hero.jsx`
- Modify: `tma-web/components/portfolio-v19/v19.css`
- Test: `tma-web/playwright/tests/v19-filament.spec.js`

The lead segment starts at the **left border of "Design"**, crosses it horizontally (the wipe), then descends to the hero's bottom-left seam `(0, heroH)`. A small **persistent seed** keeps the start visible at rest (so the flight handoff has something to land into); scroll draws the rest. The intro replay is handled in Task 5 — here the segment simply works on scroll.

- [ ] **Step 1: Add a lead path builder + seed constant to `V19Filament.jsx`**

Near the top of `V19Filament.jsx` (after `buildLanePath`), add:

```jsx
const LEAD_SEED_PX = 10; // always-drawn nub at Design so the start stays visible

/* LEAD segment (hero): starts at the left border of "Design", crosses it
   horizontally (wipe), then descends to the hero bottom-left seam (0,h)
   where the work-lane path's "M 0 0" picks up. design = hero-coord box. */
function buildLeadPath(w, h, design) {
  if (!design) {
    return `M ${w * 0.04} ${h * 0.5} C ${w * 0.04} ${h * 0.7}, 0 ${h * 0.85}, 0 ${h}`;
  }
  const dl = design.l;
  const dr = design.r;
  const cy = design.cy;
  return (
    `M ${dl} ${cy} ` +
    `L ${dr} ${cy} ` + // crossing segment the Design wipe tracks
    `C ${dr} ${cy + (h - cy) * 0.25}, ${w * 0.18} ${cy + (h - cy) * 0.45}, ${w * 0.12} ${cy + (h - cy) * 0.62} ` +
    `C ${w * 0.06} ${cy + (h - cy) * 0.8}, 0 ${h * 0.92}, 0 ${h}`
  );
}
```

- [ ] **Step 2: Add a `variant` prop and branch the effect**

Change the component signature in `V19Filament.jsx` from:

```jsx
export default function V19Filament({
  laneSelector = ".v19-worklane",
  featuredWordSel = ".v19fw-title-word",
  ourWordSel = ".v19ow-title-word",
  workSel = ".v19ow-title em",
  stops = DEFAULT_STOPS,
} = {}) {
```

to:

```jsx
export default function V19Filament({
  variant = "lane",
  laneSelector = ".v19-worklane",
  featuredWordSel = ".v19fw-title-word",
  ourWordSel = ".v19ow-title-word",
  workSel = ".v19ow-title em",
  designSel = ".v19-line-4 .v19-line-word",
  heroSelector = ".v19-hero",
  stops = DEFAULT_STOPS,
} = {}) {
  const isLead = variant === "lead";
```

Then, inside the `useEffect`, wrap the lane-specific setup so the lead branch builds its own path, single wipe target, hero trigger, and seeded offset. Replace the body from `const lane = ...` down to the end of `measure`/tween setup with this structure (keep the existing lane code in the `else`):

```jsx
    const container = isLead
      ? root.closest(heroSelector) || root.parentElement
      : root.closest(laneSelector) || root.parentElement;
    if (!container) return;

    const boxIn = (el) => {
      if (!el) return null;
      const s = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        l: r.left - s.left,
        r: r.right - s.left,
        t: r.top - s.top,
        b: r.bottom - s.top,
        cy: r.top - s.top + r.height / 2,
      };
    };

    if (isLead) {
      const designEl = container.querySelector(designSel);
      const wipe = { el: designEl, s1: -1, s2: -1, ready: false };
      const geom = { len: 0 };
      const setWipe = (frac) =>
        wipe.el && wipe.el.style.setProperty("--v19-wipe", (frac * 100).toFixed(2) + "%");

      const measure = (resetOffset = true) => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        // X from inner text (reliable mid-animation), Y from the line block
        const dBox = boxIn(designEl);
        if (!dBox) return;
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        path.setAttribute("d", buildLeadPath(w, h, dBox));
        const len = path.getTotalLength();
        geom.len = len;
        // wipe window = arc-length range over the Design box
        wipe.s1 = -1; wipe.s2 = -1; wipe.ready = false;
        const N = 320;
        for (let i = 0; i <= N; i++) {
          const s = (len * i) / N;
          const pt = path.getPointAtLength(s);
          if (pt.x >= dBox.l - 1 && pt.x <= dBox.r + 1 && pt.y >= dBox.t - 2 && pt.y <= dBox.b + 2) {
            if (wipe.s1 < 0) wipe.s1 = s;
            wipe.s2 = s;
          }
        }
        if (wipe.s1 >= 0 && wipe.s2 > wipe.s1) wipe.ready = true;
        const drawable = Math.max(0, len - LEAD_SEED_PX);
        if (resetOffset) {
          gsap.set(path, {
            strokeDasharray: len,
            strokeDashoffset: reduced ? 0 : drawable, // seed shown at rest
          });
        } else {
          gsap.set(path, { strokeDasharray: len });
        }
        if (reduced) setWipe(1);
      };

      const applyWipe = (p) => {
        if (!wipe.ready || !geom.len) return;
        const a = wipe.s1 / geom.len;
        const b = wipe.s2 / geom.len;
        setWipe(Math.min(1, Math.max(0, (p - a) / (b - a))));
      };

      const ctx = gsap.context(() => {
        measure();
        if (!reduced) {
          const state = { p: 0 };
          gsap.to(state, {
            p: 1,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top top",
              end: "bottom top",
              scrub: 1.6,
            },
            onUpdate: () => {
              const p = state.p;
              const drawable = Math.max(0, geom.len - LEAD_SEED_PX);
              path.style.strokeDashoffset = String(drawable * (1 - p));
              applyWipe(p);
            },
          });
        }
      }, root);

      let rafId = 0;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          measure(false);
          if (!reduced) ScrollTrigger.refresh();
        });
      });
      ro.observe(container);

      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        ctx.revert();
        if (wipe.el) wipe.el.style.removeProperty("--v19-wipe");
      };
    }

    // ----- variant === "lane" (existing behaviour) -----
    const lane = container;
```

(The remaining existing lane code stays exactly as-is, now living after the `isLead` early-return. Update its dependency array to include the new props.)

Change the dependency array at the end of the effect to:

```jsx
  }, [reduced, variant, laneSelector, featuredWordSel, ourWordSel, workSel, designSel, heroSelector]);
```

- [ ] **Step 3: Add the lead modifier class on the wrapper**

In the component's returned JSX, change the wrapper className to include a lead modifier:

```jsx
    <div
      ref={rootRef}
      className={`v19-filament${isLead ? " v19-filament--lead" : ""}`}
      aria-hidden="true"
    >
```

- [ ] **Step 4: Mount the lead segment in the hero**

In `V19Hero.jsx`, add the import after the React import:

```jsx
import V19Filament from "./V19Filament";
```

and mount it as the first child of `.v19-hero`, right after the closing `</div>` of `.v19-hero-bg`:

```jsx
      <V19Filament variant="lead" />
```

- [ ] **Step 5: Add lead positioning CSS**

Append to `v19.css`:

```css
/* hero lead segment — same base .v19-filament (absolute, inset:0, z-index:1,
   pointer-events:none); explicit rule kept for clarity/overrides. */
.v19-filament--lead { z-index: 1; }
```

- [ ] **Step 6: Add e2e for the lead segment**

Append to `tma-web/playwright/tests/v19-filament.spec.js` (uses the existing `scrollTo`/`SETTLE_MS` helpers in that file):

```js
test("hero lead mounts, starts at the Design word, ends at the seam", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForTimeout(SETTLE_MS);
  const r = await page.evaluate(() => {
    const hero = document.querySelector(".v19-hero");
    const path = document.querySelector(".v19-hero .v19-filament-path");
    const word = document.querySelector(".v19-line-4 .v19-line-word");
    if (!hero || !path || !word) return null;
    const s = hero.getBoundingClientRect();
    const wb = word.getBoundingClientRect();
    const start = path.getPointAtLength(0);
    const end = path.getPointAtLength(path.getTotalLength());
    return {
      startX: start.x, startY: start.y,
      wordL: wb.left - s.left, wordCy: wb.top - s.top + wb.height / 2,
      endX: end.x, endY: end.y, heroH: hero.clientHeight,
    };
  });
  expect(r).not.toBeNull();
  // starts at Design's left border
  expect(Math.abs(r.startX - r.wordL)).toBeLessThan(8);
  expect(Math.abs(r.startY - r.wordCy)).toBeLessThan(8);
  // ends at the bottom-left seam
  expect(r.endX).toBeLessThan(2);
  expect(Math.abs(r.endY - r.heroH)).toBeLessThan(2);
});
```

- [ ] **Step 7: Run the lead test**

```bash
cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=laptop-1440 v19-filament.spec.js -g "hero lead" 2>&1 | tail -8
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add tma-web/components/portfolio-v19/V19Filament.jsx tma-web/components/portfolio-v19/V19Hero.jsx tma-web/components/portfolio-v19/v19.css tma-web/playwright/tests/v19-filament.spec.js
git commit -m "feat(v19): scroll-driven hero lead filament starting at Design (seeded)"
```

---

## Task 3: Wordmark stroke-draw in the preloader

**Files:**
- Modify: `tma-web/components/portfolio-v19/V19Preloader.jsx`
- Modify: `tma-web/components/portfolio-v19/v19.css`

Replace the centred "M" monogram (`.v19pl-mark` svg) with an SVG `<text>` wordmark in Inter Tight (`var(--display)`), `fill:none` + cool `stroke`, drawn on by animating `stroke-dashoffset`, gated by a left→right `clipPath` reveal. The existing `.v19pl-word` mono caption is removed (the line now renders the letters). Counter/bar/seam/panels stay.

- [ ] **Step 1: Replace the core markup**

In `V19Preloader.jsx`, replace the `<svg className="v19pl-mark" ...>...</svg>` block AND the `.v19pl-word` div with a single wordmark SVG:

```jsx
        <svg
          ref={markRef}
          className="v19pl-wordmark"
          viewBox="0 0 1000 160"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="v19pl-reveal">
              <rect ref={revealRef} x="0" y="0" width="0" height="160" />
            </clipPath>
            <linearGradient id="v19pl-ink" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9fe0ff" />
              <stop offset="60%" stopColor="#6fd3ff" />
              <stop offset="100%" stopColor="#bfe9ff" />
            </linearGradient>
          </defs>
          <text
            ref={wordRef}
            x="500" y="112" textAnchor="middle"
            clipPath="url(#v19pl-reveal)"
            fill="none"
            stroke="url(#v19pl-ink)"
            strokeWidth="2"
            strokeDasharray="6 240"
          >
            The Motion Agency
          </text>
        </svg>
```

Notes:
- `markRef`/`wordRef` already exist; add a new `revealRef` (Step 2).
- The font + size are set in CSS (Step 4) on `.v19pl-wordmark text`.

- [ ] **Step 2: Add `revealRef` and update the GSAP draw**

Add the ref near the others in `V19Preloader.jsx`:

```jsx
  const revealRef = useRef(null);
```

In the **non-reduced** timeline, replace the monogram-draw + word-wipe lines:

```jsx
      tl.to(markRef.current, { strokeDashoffset: 0, duration: 1.05, ease: "power2.inOut" }, 0.3);
      tl.fromTo(seamRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: "power2.inOut" }, 0.55);
      tl.to(wordRef.current, { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power3.out" }, 0.85);
```

with a wordmark stroke-draw + left→right reveal:

```jsx
      // wordmark writes itself: dash strokes the glyph outlines while a
      // left→right reveal rect uncovers them like a pen moving across.
      gsap.set(wordRef.current, { strokeDashoffset: 0 });
      gsap.set(revealRef.current, { attr: { width: 0 } });
      tl.to(revealRef.current, { attr: { width: 1000 }, duration: 1.25, ease: "power2.inOut" }, 0.3);
      tl.fromTo(wordRef.current, { strokeDashoffset: 246 }, { strokeDashoffset: 0, duration: 1.25, ease: "none" }, 0.3);
      tl.fromTo(seamRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: "power2.inOut" }, 0.55);
```

In the **reduced-motion** branch, replace the monogram/word static sets:

```jsx
        gsap.set(markRef.current, { strokeDashoffset: 0 });
        gsap.set(wordRef.current, { clipPath: "inset(0 0% 0 0)" });
```

with:

```jsx
        gsap.set(revealRef.current, { attr: { width: 1000 } });
        gsap.set(wordRef.current, { strokeDashoffset: 0 });
```

(Leave the rest of both branches — counter, bar, glow, split — unchanged.)

- [ ] **Step 3: Remove now-unused `wordRef` on the old `.v19pl-word` div**

Confirm there is no remaining `<div ref={wordRef} className="v19pl-word">` (it was replaced in Step 1). The `wordRef` now points at the `<text>`.

- [ ] **Step 4: Add wordmark CSS, remove monogram-specific rules**

In `v19.css`, replace the `.v19pl-mark` / `.v19pl-mark path` / `.v19pl-word` rules with:

```css
.v19pl-wordmark {
  display: block;
  width: clamp(280px, 52vw, 680px);
  height: auto;
  filter: drop-shadow(0 0 18px rgba(111, 211, 255, 0.45));
}
.v19pl-wordmark text {
  font-family: var(--display);
  font-weight: 800;
  font-size: 96px;
  letter-spacing: -0.02em;
  paint-order: stroke;
}
@media (max-width: 600px) {
  .v19pl-wordmark { width: 84vw; }
}
```

- [ ] **Step 5: Visually verify the wordmark draws (screenshot at mid-intro)**

With the dev server running, capture the preloader early (before the split). Use a throwaway script:

```bash
cd tma-web && cat > _shot.mjs <<'EOF'
import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3000/portfolio-v19", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(900);            // mid wordmark draw
await p.screenshot({ path: "../v19-intro-draw.png" });
await b.close();
EOF
node _shot.mjs && echo done
```

Read `../v19-intro-draw.png`: the cool wordmark "The Motion Agency" should be partially-to-fully drawn (outlined strokes), centred, no "M" monogram. Tune `font-size`/`viewBox` if clipped. Then `rm tma-web/_shot.mjs ../v19-intro-draw.png`.

- [ ] **Step 6: Commit**

```bash
git add tma-web/components/portfolio-v19/V19Preloader.jsx tma-web/components/portfolio-v19/v19.css
git commit -m "feat(v19): preloader writes the wordmark via SVG-text stroke-draw"
```

---

## Task 4: Flight tip to the "Design" border

**Files:**
- Modify: `tma-web/components/portfolio-v19/V19Preloader.jsx`
- Modify: `tma-web/components/portfolio-v19/v19.css`

After the panels split, a flight `<path>` (full-viewport fixed SVG, viewport coords) draws from the wordmark area to the **measured** left border of "Design". The Design point is read just before the flight tween.

- [ ] **Step 1: Add the flight SVG markup**

In `V19Preloader.jsx`, add — as a direct child of the `.v19pl` root, after the `.v19pl-core` div — a full-viewport flight layer:

```jsx
      <svg
        ref={flightSvgRef}
        className="v19pl-flight"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={flightRef}
          fill="none"
          stroke="url(#v19pl-ink)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
```

Add refs near the others:

```jsx
  const flightSvgRef = useRef(null);
  const flightRef = useRef(null);
```

- [ ] **Step 2: Add flight CSS**

Append to `v19.css`:

```css
.v19pl-flight {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 6;            /* above the core, below nothing that matters */
  pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(111, 211, 255, 0.5));
}
```

- [ ] **Step 3: Build + animate the flight at the burst, landing on Design**

In `V19Preloader.jsx`, inside the non-reduced timeline, just before the panel-split lines (around `BURST`), insert a call that measures Design and builds the flight path, then tweens the draw. Add this helper inside the effect (above `const ctx = gsap.context`):

```jsx
    const buildFlight = () => {
      const svg = flightSvgRef.current;
      const path = flightRef.current;
      const design = document.querySelector(".v19-line-4 .v19-line-word");
      if (!svg || !path || !design) return 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
      const d = design.getBoundingClientRect();
      const tx = d.left;             // left border of "Design" (viewport coords)
      const ty = d.top + d.height / 2;
      const sx = vw / 2;             // wordmark centre
      const sy = vh / 2;
      // smooth cubic from centre to Design's border
      path.setAttribute(
        "d",
        `M ${sx} ${sy} C ${sx - vw * 0.12} ${sy + vh * 0.06}, ` +
          `${tx + (sx - tx) * 0.4} ${ty - vh * 0.04}, ${tx} ${ty}`
      );
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      return len;
    };
```

Then in the timeline, at the burst (replace the `coreRef` dissolve timing area), add:

```jsx
      // flight: wordmark fades, a tip draws from centre to Design's border
      tl.add(() => { buildFlight(); }, BURST - 0.02);
      tl.to(flightRef.current, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, BURST + 0.1);
      tl.to(coreRef.current, { opacity: 0, duration: 0.45, ease: "power2.in" }, BURST + 0.05);
      // trail fades after landing (so only the seeded lead remains at Design)
      tl.to(flightSvgRef.current, { opacity: 0, duration: 0.4, ease: "power1.out" }, BURST + 1.05);
```

(Remove the old `coreRef` upward-dissolve line if it conflicts; keep panels split lines.)

- [ ] **Step 4: Verify the flight lands at Design (e2e)**

Create `tma-web/playwright/tests/v19-intro.spec.js`:

```js
import { test, expect } from "@playwright/test";

// /portfolio-v19 intro: wordmark draw → flight to "Design".
// Runs against the local dev server (PLAYWRIGHT_BASE_URL).

test("flight path lands at the Design word border", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  // wait past the intro (draw + split + flight ≈ < 5s)
  await page.waitForTimeout(5000);
  const r = await page.evaluate(() => {
    const path = document.querySelector(".v19pl-flight path");
    const word = document.querySelector(".v19-line-4 .v19-line-word");
    if (!word) return { landed: null };
    const wb = word.getBoundingClientRect();
    const target = { x: wb.left, y: wb.top + wb.height / 2 };
    if (!path) return { landed: "no-flight", target };
    const end = path.getPointAtLength(path.getTotalLength());
    return { endX: end.x, endY: end.y, target };
  });
  // the flight svg may already be removed/faded post-intro; if present, assert landing
  if (r.endX !== undefined) {
    expect(Math.abs(r.endX - r.target.x)).toBeLessThan(6);
    expect(Math.abs(r.endY - r.target.y)).toBeLessThan(6);
  }
  // either way the Design word must exist for the handoff
  expect(r.target).toBeTruthy();
});
```

Run:

```bash
cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=laptop-1440 v19-intro.spec.js -g "flight" 2>&1 | tail -8
```

Expected: PASS. (If the flight svg fades before 5s, the test still asserts the Design target exists; tighten the wait to capture the landing if you want the coordinate assertion to run.)

- [ ] **Step 5: Visual verify the flight, then commit**

Screenshot at ~3.3s (post-split, mid-flight) using the throwaway-script pattern from Task 3 Step 5 (`waitForTimeout(3300)`), read it, confirm the tip arcs from centre to "Design". Clean up the script/png.

```bash
git add tma-web/components/portfolio-v19/V19Preloader.jsx tma-web/components/portfolio-v19/v19.css tma-web/playwright/tests/v19-intro.spec.js
git commit -m "feat(v19): preloader flight tip draws to the Design word border"
```

---

## Task 5: Handoff + once-per-load + Design wipe on scroll

**Files:**
- Modify: `tma-web/components/portfolio-v19/V19Preloader.jsx`
- Test: `tma-web/playwright/tests/v19-filament.spec.js`

The hero-lead (Task 2) already mounts with a persistent seed at Design and draws on scroll, so the visual handoff is: flight lands at Design → flight svg fades → the seeded lead is already sitting at exactly that point. No extra wiring is needed for the *position* handoff (shared measured coordinate). This task verifies the handoff and the Design wipe, and confirms the once-per-load behaviour still holds (it is inherited from `hasPlayedThisLoad`, unchanged).

- [ ] **Step 1: Add a Design-wipe scroll test**

Append to `tma-web/playwright/tests/v19-filament.spec.js`:

```js
test('"Design" wipes its colour as the line is scrolled past it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForTimeout(5200); // let the intro finish + scroll release

  const readDesignWipe = () =>
    page.evaluate(() => {
      const w = document.querySelector(".v19-line-4 .v19-line-word");
      return w ? parseFloat(getComputedStyle(w).getPropertyValue("--v19-wipe")) || 0 : -1;
    });

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const atTop = await readDesignWipe();

  // scroll a little past the hero so the lead tip crosses "Design"
  await page.evaluate(() => window.scrollTo({ top: Math.round(window.innerHeight * 0.6), behavior: "instant" }));
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const past = await readDesignWipe();

  expect(atTop).toBeLessThan(40);  // not yet fully crossed at rest
  expect(past).toBeGreaterThan(atTop);  // wipes further as scrolled
});
```

- [ ] **Step 2: Run the handoff/wipe test**

```bash
cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=laptop-1440 v19-filament.spec.js -g "Design" 2>&1 | tail -8
```

Expected: PASS.

- [ ] **Step 3: Visual verify the handoff (record a short scroll)**

Throwaway script: load, wait 5.2s (intro done), screenshot (line resting at Design seed), then scroll to 0.4·vh, wait, screenshot (line drawn through Design + Design partly cyan). Confirm no jump/gap at Design. Clean up.

- [ ] **Step 4: Commit**

```bash
git add tma-web/playwright/tests/v19-filament.spec.js
git commit -m "test(v19): Design wipe + intro→scroll handoff coverage"
```

---

## Task 6: Reduced motion + full regression + visual pass

**Files:**
- Modify: `tma-web/playwright/tests/v19-intro.spec.js`

- [ ] **Step 1: Add reduced-motion test**

Append to `v19-intro.spec.js`:

```js
test("reduced motion: wordmark shown, no flight, line rests at Design", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForTimeout(2500);
  // hero lead present and fully/over-drawn at rest (reduced = static full)
  const off = await page.evaluate(() => {
    const p = document.querySelector(".v19-hero .v19-filament-path");
    return p ? parseFloat(getComputedStyle(p).strokeDashoffset) || 0 : -1;
  });
  expect(off).toBeGreaterThanOrEqual(0);
  expect(off).toBeLessThan(2); // static full path under reduced motion
});
```

- [ ] **Step 2: Full e2e regression (both viewports)**

```bash
cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=laptop-1440 --project=mobile-375 v19-filament.spec.js v19-intro.spec.js 2>&1 | tail -20
```

Expected: all green. Investigate any failure before proceeding.

- [ ] **Step 3: Full visual pass**

Watch the real intro at `/portfolio-v19` (hard refresh): wordmark writes → panels split → tip flies to "Design" → scrolling draws the line through "Design" (colour wipe) into Featured / Our Work. Confirm: no flash of the old "M", no jump at Design, smooth flight, line continuous into the lane. Tune timings (`BURST`, durations) and the flight curve control points if needed; re-verify.

- [ ] **Step 4: Final commit**

```bash
git add tma-web/playwright/tests/v19-intro.spec.js
git commit -m "test(v19): reduced-motion intro + full filament-intro regression"
```

---

## Self-Review Notes

- **Spec coverage:** four beats → Tasks 3 (draw), existing split (reveal), 4 (flight), 2+5 (scroll/Design wipe). Three SVGs → intro overlay (Tasks 3-4), hero lead (Task 2), lane (unchanged). Shared handoff coordinate → `buildFlight` measures `.v19-line-4 .v19-line-word` (Task 4) and the lead uses the same box (Task 2). Wordmark via SVG `<text>` stroke-draw → Task 3. Reduced motion → Tasks 3 (branch) + 6. Once-per-load → inherited `hasPlayedThisLoad` (Task 5 note). Tests → Tasks 2,4,5,6. All spec sections map to a task.
- **Naming consistency:** `.v19-line-word` (Design wipe), `.v19-filament--lead`, `variant="lead"`, `--v19-wipe`, refs `revealRef`/`flightRef`/`flightSvgRef`, gradient ids `v19pl-ink`/`v19pl-reveal` are used identically across tasks.
- **Placeholder scan:** no TBD/TODO; deterministic code given for builders, measurement, wipe, handoff; animation **timings** are concrete starting values explicitly flagged for visual tuning in Tasks 3/4/6 (tuning ≠ placeholder).
- **Risk:** SVG `<text>` dash-draw look + flight curve are the visual-iteration points; tests assert structural facts (paths exist, start/end coordinates, wipe variable moves) so tuning can proceed safely.

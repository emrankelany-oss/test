# V22 Showreel — Pinned Orbit Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace V22's "Selected work" section with a scroll-pinned sequence where the Foodics and Zid cards fan their films into a ring around a shrinking card (Foodics first, then Zid takes the stage), with a static gallery fallback for reduced-motion/mobile.

**Architecture:** A new `V22Showreel` section renders a "stage" of two project groups (card + film tiles). By default it lays out as a static stacked gallery (the fallback). On fine-pointer, non-reduced-motion, ≥861px viewports, `useOrbitTimeline` flips the section to `data-mode="orbit"` and drives a single GSAP `ScrollTrigger` pinned + scrubbed master timeline through the phases. Films open in a shared lightbox; cards open the existing project modal.

**Tech Stack:** Next 16 / React 19, GSAP + ScrollTrigger (already used by V22), Lenis via existing `SmoothScroll`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-02-v22-showreel-orbit-design.md`

---

## Conventions for every task

- **App root:** `c:\Users\Pc\Downloads\the-motion-agency-web-main\tma-web`. All paths relative to it.
- A **dev server is already running at http://localhost:3000** — do NOT start another.
- **e2e:** `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test <name> --project=laptop-1440` (bash-style env prefix, NOT PowerShell `$env:`).
- **node unit tests:** `npm test` runs `node --test test/**/*.test.mjs`.
- `@/` alias = app root. Branch `feat/obsidian-hero`. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- This Next.js (v16) has breaking changes — mirror existing V22 component patterns; do not invent Next APIs.
- v22.css edits are **append-only** unless a task says otherwise.

## File structure

```
components/portfolio-v22/
  ringPositions.js          # pure ellipse geometry (unit-tested)
  showreel.js               # SHOWREEL data (cards + V20 film arrays)
  useFilmLightbox.js        # external store (open/close a film)
  V22FilmLightbox.jsx       # mp4/youtube lightbox dialog
  V22Showreel.jsx           # the section (static gallery + orbit stage)
  hooks/useOrbitTimeline.js # pinned scrubbed GSAP master timeline
  v22.css                   # APPEND showreel + lightbox styles
app/portfolio-v22/page.jsx  # swap V22FeaturedWork -> V22Showreel; mount V22FilmLightbox
test/portfolio-v22-ring.test.mjs   # node unit test for ringPositions + showreel data
playwright/tests/v22-showreel.spec.js   # new e2e
```
**Removed:** `components/portfolio-v22/V22FeaturedWork.jsx`, `components/portfolio-v22/hooks/useScrubVideo.js` (only used by the old featured section), `playwright/tests/v22-featured.spec.js`.

---

## Task 1: Ring geometry + showreel data (pure, unit-tested)

**Files:**
- Create: `components/portfolio-v22/ringPositions.js`
- Create: `components/portfolio-v22/showreel.js`
- Test: `test/portfolio-v22-ring.test.mjs`

- [ ] **Step 1: Write the failing node test** `test/portfolio-v22-ring.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { ringPositions } from "../components/portfolio-v22/ringPositions.js";
import { SHOWREEL } from "../components/portfolio-v22/showreel.js";

test("ringPositions: empty for count 0", () => {
  assert.deepEqual(ringPositions(0, { rx: 100, ry: 100 }), []);
});

test("ringPositions: first tile sits at top (-90deg)", () => {
  const p = ringPositions(4, { rx: 100, ry: 100 });
  assert.equal(p.length, 4);
  assert.ok(Math.abs(p[0].x) < 1e-6);        // cos(-90)=0
  assert.ok(Math.abs(p[0].y + 100) < 1e-6);  // sin(-90)*100 = -100 (top)
  assert.ok(Math.abs(p[1].x - 100) < 1e-6);  // angle 0 -> right
});

test("showreel data: foodics has 7 films, zid has 2", () => {
  const f = SHOWREEL.find((p) => p.slug === "foodics-boundless");
  const z = SHOWREEL.find((p) => p.slug === "zid-ripple");
  assert.equal(f.films.length, 7);
  assert.equal(z.films.length, 2);
  // every film has the fields the UI needs
  for (const film of [...f.films, ...z.films]) {
    assert.ok(film.id && film.title && film.group && film.kind && film.poster);
    if (film.kind === "mp4") assert.ok(film.src);
    if (film.kind === "youtube") assert.ok(film.youtubeId);
  }
});
```

- [ ] **Step 2: Run it, expect FAIL**

Run: `npm test`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `components/portfolio-v22/ringPositions.js`:**

```js
// Pure geometry: evenly distribute `count` items on an ellipse centered at 0,0.
// Returns [{x, y, angle}] px offsets. First item at top (-90deg), going clockwise.
export function ringPositions(count, { rx, ry }) {
  if (count <= 0) return [];
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = -90 + i * (360 / count);
    const rad = (angle * Math.PI) / 180;
    out.push({ x: Math.cos(rad) * rx, y: Math.sin(rad) * ry, angle });
  }
  return out;
}
```

- [ ] **Step 4: Create `components/portfolio-v22/showreel.js`:**

```js
// Showreel content — the exact films V20 assigned to each flagship project.
const V = "/assets/videos";
const P = "/assets/videos/posters";
const yt = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const SHOWREEL = [
  {
    slug: "foodics-boundless",
    client: "Foodics",
    title: "Boundless",
    poster: "/assets/case-foodics-boundless.png",
    films: [
      { id: "f-bl-2022", title: "Boundless 2022", group: "Event Film", kind: "youtube", youtubeId: "ZqrF7NYuXHU", poster: yt("ZqrF7NYuXHU") },
      { id: "f-bl-2023", title: "Boundless 2023", group: "Event Film", kind: "youtube", youtubeId: "uzd9os9G1d8", poster: yt("uzd9os9G1d8") },
      { id: "f-cafe", title: "Café Spot", group: "TV Commercial", kind: "mp4", src: `${V}/media1.mp4`, poster: `${P}/media1.jpg` },
      { id: "f-living", title: "Living-Room Spot", group: "TV Commercial", kind: "mp4", src: `${V}/media5.mp4`, poster: `${P}/media5.jpg` },
      { id: "f-kiosk", title: "Self-Order Kiosk", group: "Product Film", kind: "mp4", src: `${V}/media6.mp4`, poster: `${P}/media6.jpg` },
      { id: "f-pos", title: "POS + Printer", group: "Product Film", kind: "mp4", src: `${V}/media22.mp4`, poster: `${P}/media22.jpg` },
      { id: "f-app", title: "App — New Version", group: "Product Film", kind: "mp4", src: `${V}/hero1.mp4`, poster: `${P}/hero1.jpg` },
    ],
  },
  {
    slug: "zid-ripple",
    client: "Zid",
    title: "Ripple",
    poster: "/assets/case-zid-ripple.png",
    films: [
      { id: "z-ripple-2024", title: "Ripple 2024", group: "Event Film", kind: "youtube", youtubeId: "GSSS71zV5HI", poster: yt("GSSS71zV5HI") },
      { id: "z-strategy", title: "Strategy Film", group: "Brand Film", kind: "mp4", src: `${V}/Zid%20-%20Strategy.MP4`, poster: `${P}/Zid---Strategy.jpg` },
    ],
  },
];
```

- [ ] **Step 5: Run it, expect PASS**

Run: `npm test`
Expected: the three new tests PASS (other repo node tests unaffected).

- [ ] **Step 6: Commit**

```bash
git add components/portfolio-v22/ringPositions.js components/portfolio-v22/showreel.js test/portfolio-v22-ring.test.mjs
git commit -m "feat(v22): showreel data + ring geometry helper (unit-tested)"
```

---

## Task 2: Film lightbox (store + component)

**Files:**
- Create: `components/portfolio-v22/useFilmLightbox.js`
- Create: `components/portfolio-v22/V22FilmLightbox.jsx`
- Modify: `components/portfolio-v22/v22.css` (APPEND lightbox styles)
- Modify: `app/portfolio-v22/page.jsx` (mount `<V22FilmLightbox/>` near `<V22ProjectModal/>`)
- Test: `playwright/tests/v22-showreel.spec.js` (create with the lightbox test; more added in Task 3)

- [ ] **Step 1: Write the failing test** `playwright/tests/v22-showreel.spec.js`:

```js
import { test, expect } from "@playwright/test";

test("film lightbox opens from a programmatic open and closes on Escape", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await page.waitForFunction(() => typeof window.__v22OpenFilm === "function");
  await page.evaluate(() =>
    window.__v22OpenFilm({ id: "t", title: "Test Film", kind: "mp4", src: "/assets/videos/media1.mp4", poster: "/assets/videos/posters/media1.jpg" })
  );
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("video")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
```

- [ ] **Step 2: Run it, expect FAIL** (`window.__v22OpenFilm` never defined).

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-showreel --project=laptop-1440`

- [ ] **Step 3: Create `components/portfolio-v22/useFilmLightbox.js`** (mirrors the proven `useProjectModal` store):

```js
"use client";
import { useSyncExternalStore } from "react";

let openFilmObj = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => openFilmObj;
const getServerSnapshot = () => null;

export function openFilm(film) { openFilmObj = film; emit(); }
export function closeFilm() { openFilmObj = null; emit(); }
export function useFilmLightbox() {
  const film = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { film, open: openFilm, close: closeFilm };
}
// test/debug affordance, same pattern as the project modal
if (typeof window !== "undefined") window.__v22OpenFilm = openFilm;
```

- [ ] **Step 4: Create `components/portfolio-v22/V22FilmLightbox.jsx`:**

```jsx
"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useFilmLightbox } from "./useFilmLightbox";

export default function V22FilmLightbox() {
  const { film, close } = useFilmLightbox();
  useEffect(() => {
    if (!film) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [film, close]);

  if (!film || typeof document === "undefined") return null;
  return createPortal(
    <div className="v22-film" role="dialog" aria-modal="true" aria-label={film.title}>
      <button className="v22-film-scrim" aria-label="Close" onClick={close} />
      <div className="v22-film-frame">
        <button className="v22-film-close" onClick={close} aria-label="Close film">✕</button>
        {film.kind === "youtube" ? (
          <iframe
            className="v22-film-media"
            src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0`}
            title={film.title}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : (
          <video className="v22-film-media" src={film.src} poster={film.poster} controls autoPlay playsInline />
        )}
        <p className="v22-film-title">{film.title}</p>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 5: APPEND to `components/portfolio-v22/v22.css`:**

```css
/* ---- film lightbox ---- */
.v22-film { position: fixed; inset: 0; z-index: 1100; display: grid; place-items: center; }
.v22-film-scrim { position: absolute; inset: 0; border: 0; background: rgba(0,0,0,.85); backdrop-filter: blur(8px); cursor: pointer; }
.v22-film-frame { position: relative; z-index: 1; width: min(1100px, 92vw); }
.v22-film-media { width: 100%; aspect-ratio: 16 / 9; display: block; background: #000; border: 0; }
.v22-film-close { position: absolute; top: -40px; right: 0; background: transparent; border: 0; color: #fff; font-size: 20px; cursor: pointer; }
.v22-film-title { color: var(--v22-dim); font-size: 14px; margin: 14px 0 0; }
```

- [ ] **Step 6: Mount in `app/portfolio-v22/page.jsx`** — add `import V22FilmLightbox from "@/components/portfolio-v22/V22FilmLightbox";` and render `<V22FilmLightbox />` right after the existing `<V22ProjectModal />`.

- [ ] **Step 7: Run it, expect PASS**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-showreel --project=laptop-1440`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/portfolio-v22/useFilmLightbox.js components/portfolio-v22/V22FilmLightbox.jsx components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-showreel.spec.js
git commit -m "feat(v22): film lightbox (mp4 + youtube) with store"
```

---

## Task 3: V22Showreel static gallery + swap into page (replaces V22FeaturedWork)

**Files:**
- Create: `components/portfolio-v22/V22Showreel.jsx`
- Modify: `components/portfolio-v22/v22.css` (APPEND showreel static styles)
- Modify: `app/portfolio-v22/page.jsx` (swap `V22FeaturedWork` → `V22Showreel`)
- Delete: `components/portfolio-v22/V22FeaturedWork.jsx`, `components/portfolio-v22/hooks/useScrubVideo.js`, `playwright/tests/v22-featured.spec.js`
- Test: extend `playwright/tests/v22-showreel.spec.js`

> The orbit timeline is added in Task 4. This task ships the section in **static** mode only (the fallback layout), which is fully usable and is what mobile/reduced-motion will keep. `useOrbitTimeline` is imported but is a no-op until Task 4 creates it — so create a temporary stub in Step 3 to keep imports valid, replaced in Task 4.

- [ ] **Step 1: Add failing tests to `playwright/tests/v22-showreel.spec.js`** (append):

```js
test("showreel section mounts with both cards and all films as tiles", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const section = page.locator("#v22-featured.v22-showreel");
  await expect(section).toHaveCount(1);
  await expect(section.locator(".v22-sr-card")).toHaveCount(2);
  // 7 foodics + 2 zid = 9 film tiles
  await expect(section.locator(".v22-sr-tile")).toHaveCount(9);
  await expect(section.locator(".v22-sr-group[data-slug='foodics-boundless'] .v22-sr-tile")).toHaveCount(7);
});

test("clicking a film tile opens the lightbox", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await page.locator(".v22-sr-tile").first().scrollIntoViewIfNeeded();
  await page.locator(".v22-sr-tile").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
```

- [ ] **Step 2: Run, expect FAIL** (`.v22-showreel` not found).

- [ ] **Step 3: Create a temporary no-op hook so the component import resolves** — `components/portfolio-v22/hooks/useOrbitTimeline.js`:

```js
"use client";
// Replaced in Task 4 with the real pinned-timeline implementation.
export function useOrbitTimeline() {}
```

- [ ] **Step 4: Create `components/portfolio-v22/V22Showreel.jsx`:**

```jsx
"use client";
import { useEffect, useRef, useState } from "react";
import { SHOWREEL } from "./showreel";
import { openProject } from "./useProjectModal";
import { openFilm } from "./useFilmLightbox";
import { useOrbitTimeline } from "./hooks/useOrbitTimeline";

function FilmTile({ film }) {
  const vref = useRef(null);
  const enter = () => { const v = vref.current; if (v && v.play) v.play().catch(() => {}); };
  const leave = () => { const v = vref.current; if (v) v.pause(); };
  return (
    <button
      className="v22-sr-tile"
      data-cursor="view" data-cursor-label="Play"
      onMouseEnter={enter} onMouseLeave={leave}
      onClick={() => openFilm(film)}
    >
      <span className="v22-sr-tile-media">
        {film.kind === "mp4" ? (
          <video ref={vref} src={film.src} poster={film.poster} muted loop playsInline preload="none" />
        ) : (
          <img src={film.poster} alt="" loading="lazy" />
        )}
      </span>
      <span className="v22-sr-tile-meta">
        <span className="v22-eyebrow">{film.group}</span>
        <span className="v22-sr-tile-title">{film.title}</span>
      </span>
    </button>
  );
}

export default function V22Showreel() {
  const sectionRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia("(min-width: 861px)").matches;
    setEnabled(fine && !reduce && wide);
  }, []);

  useOrbitTimeline(sectionRef, { enabled });

  return (
    <section id="v22-featured" ref={sectionRef} className="v22-section v22-showreel" data-mode="static">
      <h2 className="v22-eyebrow">Selected work</h2>
      <div className="v22-sr-stage">
        {SHOWREEL.map((proj) => (
          <div key={proj.slug} className="v22-sr-group" data-slug={proj.slug}>
            <button
              className="v22-sr-card"
              data-cursor="view" data-cursor-label="See project"
              onClick={(e) => openProject(proj.slug, e.currentTarget)}
            >
              <span className="v22-sr-card-media"><img src={proj.poster} alt="" /></span>
              <span className="v22-sr-card-label">
                <span className="v22-eyebrow">{proj.client}</span>
                <span className="v22-sr-card-title">{proj.title}</span>
              </span>
            </button>
            <div className="v22-sr-tiles">
              {proj.films.map((f) => <FilmTile key={f.id} film={f} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: APPEND static-mode styles to `components/portfolio-v22/v22.css`:**

```css
/* ---- showreel (static / fallback layout) ---- */
.v22-showreel .v22-sr-stage { display: flex; flex-direction: column; gap: clamp(56px, 9vw, 140px); margin-top: clamp(40px, 6vw, 90px); }
.v22-sr-group { display: flex; flex-direction: column; gap: clamp(24px, 3vw, 44px); }
.v22-sr-card { appearance: none; background: transparent; border: 0; padding: 0; text-align: left; color: inherit; cursor: pointer; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
.v22-sr-card-media { display: block; width: min(440px, 72vw); aspect-ratio: 3 / 4; overflow: hidden; background: var(--v22-panel); }
.v22-sr-card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.v22-sr-card-label { display: flex; flex-direction: column; gap: 8px; }
.v22-sr-card-title { font-size: clamp(30px, 5vw, 64px); font-weight: 400; letter-spacing: -0.015em; line-height: 0.98; }
.v22-sr-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: clamp(20px, 2.6vw, 38px); }
.v22-sr-tile { appearance: none; background: transparent; border: 0; padding: 0; text-align: left; color: inherit; cursor: pointer; display: flex; flex-direction: column; gap: 12px; }
.v22-sr-tile-media { display: block; aspect-ratio: 16 / 9; overflow: hidden; background: var(--v22-panel); }
.v22-sr-tile-media img, .v22-sr-tile-media video { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.16,1,.3,1); }
.v22-sr-tile:hover .v22-sr-tile-media img, .v22-sr-tile:hover .v22-sr-tile-media video { transform: scale(1.05); }
.v22-sr-tile-meta { display: flex; flex-direction: column; gap: 4px; }
.v22-sr-tile-title { font-size: clamp(16px, 1.5vw, 20px); font-weight: 400; }
```

- [ ] **Step 6: Swap into the page** — in `app/portfolio-v22/page.jsx`: replace `import V22FeaturedWork ...` with `import V22Showreel from "@/components/portfolio-v22/V22Showreel";` and replace `<V22FeaturedWork />` with `<V22Showreel />`.

- [ ] **Step 7: Delete the superseded files:**

```bash
git rm components/portfolio-v22/V22FeaturedWork.jsx components/portfolio-v22/hooks/useScrubVideo.js playwright/tests/v22-featured.spec.js
```

- [ ] **Step 8: Run, expect PASS** (showreel structure + lightbox + assembly):

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-showreel v22-assembly --project=laptop-1440`
Expected: PASS. (`v22-assembly` still finds `#v22-featured`.)

- [ ] **Step 9: Commit**

```bash
git add components/portfolio-v22/V22Showreel.jsx components/portfolio-v22/hooks/useOrbitTimeline.js components/portfolio-v22/v22.css app/portfolio-v22/page.jsx playwright/tests/v22-showreel.spec.js
git commit -m "feat(v22): showreel static gallery; replace featured-work section"
```

---

## Task 4: Orbit timeline (pinned, scrubbed) — desktop enhancement

**Files:**
- Modify: `components/portfolio-v22/hooks/useOrbitTimeline.js` (replace the stub)
- Modify: `components/portfolio-v22/v22.css` (APPEND orbit-mode styles)
- Test: extend `playwright/tests/v22-showreel.spec.js`

- [ ] **Step 1: Add the failing desktop test** (append to `playwright/tests/v22-showreel.spec.js`):

```js
test("desktop: section pins and Foodics films reach the ring on scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v22");
  // orbit mode is enabled on fine-pointer desktop
  const section = page.locator("#v22-featured");
  await expect(section).toHaveAttribute("data-mode", "orbit");
  // scroll to the section top, then into the Foodics fan phase
  const top = await section.evaluate((el) => window.scrollY + el.getBoundingClientRect().top);
  await page.evaluate((y) => window.scrollTo(0, y + 1), top);          // pin engaged
  await page.waitForTimeout(400);
  const stageBox1 = await page.locator(".v22-sr-stage").boundingBox();
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 2.2), top); // into fan phase
  await page.waitForTimeout(800);
  const stageBox2 = await page.locator(".v22-sr-stage").boundingBox();
  // pinned: stage stays at ~same viewport y while we scrolled 2+ screens
  expect(Math.abs(stageBox2.y - stageBox1.y)).toBeLessThan(40);
  // at least one foodics tile is now visible (faded in)
  const visibleTiles = await page.locator(".v22-sr-group[data-slug='foodics-boundless'] .v22-sr-tile")
    .evaluateAll((els) => els.filter((e) => parseFloat(getComputedStyle(e).opacity) > 0.6).length);
  expect(visibleTiles).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run, expect FAIL** (`data-mode` is still "static" because the hook is a no-op).

- [ ] **Step 3: Replace `components/portfolio-v22/hooks/useOrbitTimeline.js` with the real implementation:**

```js
"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ringPositions } from "../ringPositions";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function useOrbitTimeline(sectionRef, { enabled }) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof window === "undefined" || !enabled) return;

    section.dataset.mode = "orbit";
    const stage = section.querySelector(".v22-sr-stage");
    const groups = Array.from(section.querySelectorAll(".v22-sr-group"));
    const data = groups.map((g) => ({
      card: g.querySelector(".v22-sr-card"),
      tiles: Array.from(g.querySelectorAll(".v22-sr-tile")),
    }));
    const [foodics, zid] = data;

    const ctx = gsap.context(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const rx = Math.min(vw * 0.32, 520);
      const ry = Math.min(vh * 0.30, 320);
      const portraitW = Math.min(vw * 0.20, 280), portraitH = Math.min(vh * 0.52, 460);
      const landW = Math.min(vw * 0.34, 520), landH = Math.min(vh * 0.34, 300);
      const gap = Math.min(vw * 0.13, 220);

      // center everything; GSAP owns the transform (xPercent/yPercent = -50 keeps centered)
      const center = { xPercent: -50, yPercent: -50, left: "50%", top: "50%" };
      gsap.set([foodics.card, zid.card], { ...center });
      gsap.set(foodics.card, { width: portraitW, height: portraitH, x: -gap, autoAlpha: 1, zIndex: 2 });
      gsap.set(zid.card, { width: portraitW, height: portraitH, x: gap, autoAlpha: 1, zIndex: 1 });
      data.forEach(({ tiles }) =>
        gsap.set(tiles, { ...center, x: 0, y: 0, scale: 0.4, autoAlpha: 0, zIndex: 3 })
      );

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section, start: "top top", end: "+=550%",
          pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });

      // P1: morph to landscape + zid slides behind foodics (both to center)
      tl.to([foodics.card, zid.card], { width: landW, height: landH, duration: 1 }, "morph")
        .to(foodics.card, { x: 0, duration: 1 }, "morph")
        .to(zid.card, { x: 0, scale: 0.92, autoAlpha: 0.4, duration: 1 }, "morph");

      // P2: foodics shrinks; its 7 films fan to the ring
      const fpos = ringPositions(foodics.tiles.length, { rx, ry });
      tl.to(foodics.card, { scale: 0.6, duration: 1 }, "fanF");
      foodics.tiles.forEach((t, i) => {
        tl.to(t, { x: fpos[i].x, y: fpos[i].y, scale: 1, autoAlpha: 1, duration: 1 }, "fanF+=" + (i * 0.06));
      });

      // P3: hold
      tl.to({}, { duration: 0.6 });

      // P4: collapse foodics films back + fade foodics card; surface zid
      tl.addLabel("collapseF");
      foodics.tiles.forEach((t) => {
        tl.to(t, { x: 0, y: 0, scale: 0.4, autoAlpha: 0, duration: 1 }, "collapseF");
      });
      tl.to(foodics.card, { scale: 0.4, autoAlpha: 0, duration: 1 }, "collapseF")
        .to(zid.card, { autoAlpha: 1, scale: 1, zIndex: 4, duration: 1 }, "collapseF");

      // P5: zid moves to center, shrinks, fans its 2 films
      const zpos = ringPositions(zid.tiles.length, { rx, ry });
      tl.to(zid.card, { y: 0, scale: 0.6, duration: 1 }, "fanZ");
      zid.tiles.forEach((t, i) => {
        tl.to(t, { x: zpos[i].x, y: zpos[i].y, scale: 1, autoAlpha: 1, duration: 1 }, "fanZ+=" + (i * 0.12));
      });

      // P6: hold then release
      tl.to({}, { duration: 0.6 });
    }, section);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
      if (section) section.dataset.mode = "static";
    };
  }, [sectionRef, enabled]);
}
```

- [ ] **Step 4: APPEND orbit-mode styles to `components/portfolio-v22/v22.css`:**

```css
/* ---- showreel (orbit mode — pinned choreography) ---- */
.v22-showreel[data-mode="orbit"] .v22-sr-stage { position: relative; display: block; height: 100vh; margin: 0; overflow: hidden; }
.v22-showreel[data-mode="orbit"] .v22-sr-group { position: absolute; inset: 0; display: block; gap: 0; }
.v22-showreel[data-mode="orbit"] .v22-sr-card { position: absolute; gap: 0; }
.v22-showreel[data-mode="orbit"] .v22-sr-card-media { width: 100%; height: 100%; aspect-ratio: auto; }
.v22-showreel[data-mode="orbit"] .v22-sr-card-label { display: none; } /* titles live on the tiles in orbit */
.v22-showreel[data-mode="orbit"] .v22-sr-tiles { display: contents; } /* tiles become direct absolute children of the group */
.v22-showreel[data-mode="orbit"] .v22-sr-tile { position: absolute; width: clamp(150px, 15vw, 220px); gap: 8px; pointer-events: auto; }
.v22-showreel[data-mode="orbit"] .v22-sr-tile-media { aspect-ratio: 16 / 9; }
```

- [ ] **Step 5: Run, expect PASS**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-showreel --project=laptop-1440`
Expected: all showreel tests PASS, including the new pin/fan test.

- [ ] **Step 6: Visual check** — capture and inspect (the choreography is judged by eye):

```bash
cat > _shot.mjs <<'EOF'
import { chromium } from 'playwright';
import fs from 'fs'; fs.mkdirSync('C:/tmp/clim/sr', { recursive: true });
const b = await chromium.launch({ headless: true });
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await page.goto('http://localhost:3000/portfolio-v22', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
const top = await page.evaluate(() => { const el = document.querySelector('#v22-featured'); return window.scrollY + el.getBoundingClientRect().top; });
for (const [name, mult] of [['intro',0.2],['morph',0.9],['foodics-fan',2.3],['hold',3.0],['collapse',3.6],['zid-fan',4.6]]) {
  await page.evaluate((y) => window.scrollTo(0, y), top + 900 * mult * (900/900) + window.innerHeight*mult);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `C:/tmp/clim/sr/${name}.png` });
}
await b.close();
EOF
node _shot.mjs && rm -f _shot.mjs
```
Then Read each `C:/tmp/clim/sr/*.png`. Verify: two portrait cards → landscape+stack → Foodics ring of 7 with titles → hold → collapse → Zid ring of 2. If positions overlap the card or tiles clip off-screen, tune the geometry constants in Step 3 (`rx`, `ry`, `landW/H`, tile `width`) and re-run Step 5–6. **Do not loosen the test; tune the constants.**

- [ ] **Step 7: Commit**

```bash
git add components/portfolio-v22/hooks/useOrbitTimeline.js components/portfolio-v22/v22.css playwright/tests/v22-showreel.spec.js
git commit -m "feat(v22): pinned scrubbed orbit timeline (Foodics then Zid fan-out)"
```

---

## Task 5: Reduced-motion / mobile fallback verification + full sweep

**Files:**
- Test: extend `playwright/tests/v22-showreel.spec.js`

- [ ] **Step 1: Add fallback tests** (append):

```js
test("reduced motion: static gallery, no pin, all tiles present", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/portfolio-v22");
  await expect(page.locator("#v22-featured")).toHaveAttribute("data-mode", "static");
  await expect(page.locator(".v22-sr-tile")).toHaveCount(9);
  await page.locator(".v22-sr-tile").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("mobile: static gallery renders all tiles", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/portfolio-v22");
  await expect(page.locator("#v22-featured")).toHaveAttribute("data-mode", "static");
  await expect(page.locator(".v22-sr-tile")).toHaveCount(9);
});
```

- [ ] **Step 2: Run, expect PASS**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-showreel --project=laptop-1440 --project=mobile-375`
Expected: PASS (orbit tests only assert orbit on desktop; the reduced-motion test forces static even on laptop).

- [ ] **Step 3: Console-clean across the pinned section**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22-console --project=laptop-1440`
Expected: PASS. If a youtube thumbnail or video logs a network error that fails it, confirm the existing console spec's resource-error handling still excludes resource 404s; real JS errors must still fail. Fix any real error at its source.

- [ ] **Step 4: Full v22 sweep across 4 viewports**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v22- --project=mobile-375 --project=tablet-768 --project=laptop-1440 --project=desktop-1920`
Expected: ALL pass. Note: the desktop pin test asserts `data-mode=orbit` only at ≥861px fine-pointer; mobile-375/tablet-768 are `hasTouch:true` so they stay static — the orbit-specific test must be guarded to run only on wide fine-pointer projects. If it runs on touch projects and fails, gate it: at the top of that test add
```js
const fine = await page.evaluate(() => matchMedia("(pointer: fine)").matches && matchMedia("(min-width: 861px)").matches);
test.skip(!fine, "orbit only on wide fine-pointer");
```

- [ ] **Step 5: Commit**

```bash
git add playwright/tests/v22-showreel.spec.js
git commit -m "test(v22): showreel reduced-motion + mobile fallback + sweep guards"
```

---

## Self-review notes

- **Spec coverage:** data/content (Task 1), lightbox + interactivity §5 (Task 2), static fallback §6 + section swap + `id="v22-featured"` (Task 3), pinned orbit choreography §4 + ring geometry (Tasks 1+4), testing §8 (Tasks 2–5). Removal of `V22FeaturedWork`/`useScrubVideo`/old spec is in Task 3.
- **No placeholders:** every step has complete code. The Task 3 `useOrbitTimeline` stub is intentional and explicitly replaced in Task 4 (not a placeholder left dangling).
- **Type/name consistency:** `openFilm`/`closeFilm`/`useFilmLightbox` (Task 2) used by `FilmTile` (Task 3); `openProject` reused from the existing modal store; `ringPositions(count,{rx,ry})` (Task 1) consumed in Task 4; DOM hooks `.v22-sr-stage/.v22-sr-group/.v22-sr-card/.v22-sr-tile` and `data-mode` are identical across component (Task 3), CSS (Tasks 3–4), hook (Task 4), and tests.
- **Known tunables (not defects):** orbit geometry constants and pin length (`end:"+=550%"`) are first-pass values to refine in Task 4 Step 6; resize during orbit calls `ScrollTrigger.refresh()` but baked px targets are not recomputed — acceptable for v1 (a full-resize re-layout is out of scope).

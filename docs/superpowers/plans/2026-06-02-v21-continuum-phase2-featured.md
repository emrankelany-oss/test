# V21 Continuum — Phase 2: Featured (cinematic editorial bands) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace V21's cramped 3-up Featured grid with a calm, premium **editorial layout**: a few standout works as large near-full-width cinematic bands, one per breath, oversized serif title overlapping the media, minimal caption, hover-to-play video, slow scroll reveal + parallax depth — using the new spacing tokens and custom cursor, while keeping the filament threading intact.

**Architecture:** Transform the existing `V21FeaturedWork.jsx` in place — **preserve its existing `PROJECTS` data array and its `VideoModal` open-on-click logic and the `.v21fw` header (which carries the filament anchors `.v21fw-title-word` + `.v21fw-title em`)**; rewrite only the project list from the dense grid into a vertical stack of large `.v21fw-band` items with generous `--space-block` gaps. Motion via GSAP ScrollTrigger (slow reveal + scrubbed parallax) and the global `V21Cursor` (`data-cursor="play"`). Section order in the page is unchanged so the filament path is unaffected.

**Tech Stack:** Next.js (React client component), GSAP ScrollTrigger, CSS custom properties/tokens, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-06-01-v21-continuum-redesign-design.md` (Phase 2 = Featured).

**Branch:** `feat/obsidian-hero`. **V20 untouched.** Commit only listed paths; never `git add -A`. Dev server already on http://localhost:3000.

**Scope guard (do NOT do in this phase):** do not reorder sections, do not move/retire MotionMatters or OurWork, do not change the filament/atmosphere/cursor. Only the Featured section's project-list layout + its motion change. The "MOTION MATTERS" pinned beat already sits right after Featured and serves as the contemplative divider — leave it where it is (moving it would break the filament's head→MM→tail geometry).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `tma-web/components/portfolio-v21/V21FeaturedWork.jsx` | Keep data + `VideoModal` + the `.v21fw` header; replace the grid list with editorial `.v21fw-band` items; add GSAP reveal+parallax; open modal on click; `data-cursor="play"` on media | **Modify** |
| `tma-web/components/portfolio-v21/v21.css` | Append `.v21fw-bands` / `.v21fw-band*` editorial styles (supersede the old `.v21fw-grid`/`.v21fw-card*`); keep `.v21fw-title-word` wipe rule as-is | **Modify (append)** |
| `tma-web/playwright/tests/v21-continuum-phase2.spec.js` | e2e: bands count + large size + generous gap, filament anchors intact, hover-to-play, reveal/reduced-motion, modal opens, console guard, V20 isolation | **Create** |

## Running tests
Dev server running (`cd tma-web && npm run dev`, :3000). Run:
```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase2 --project=laptop-1440
```

---

## Task 1: Editorial bands — markup + CSS

Transform the Featured project list into large stacked cinematic bands.

**Files:** Modify `V21FeaturedWork.jsx` (render + a small GSAP effect), append CSS to `v21.css`, create the test file.

- [ ] **Step 1: Create `tma-web/playwright/tests/v21-continuum-phase2.spec.js`:**

```js
import { test, expect } from "@playwright/test";

const SETTLE_MS = 450;
const SCRUB_MS = 1200;
const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollBottom = (page) =>
  page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
const fwTop = (page) =>
  page.evaluate(() => Math.round(window.scrollY + document.querySelector(".v21fw").getBoundingClientRect().top));

test("featured renders large editorial bands with generous gaps", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  const bands = page.locator(".v21fw-band");
  const n = await bands.count();
  expect(n).toBeGreaterThanOrEqual(2);
  expect(n).toBeLessThanOrEqual(4); // "a few standout works", not a wall

  // Each band is large (near-full-width of the measure) — not a tight grid cell.
  const firstW = await bands.first().evaluate((el) => el.getBoundingClientRect().width);
  const pageW = await page.evaluate(() => document.querySelector(".v21fw").clientWidth);
  expect(firstW).toBeGreaterThan(pageW * 0.6);

  // Generous vertical gap between bands (>= ~64px from --space-block).
  if (n >= 2) {
    const gap = await page.evaluate(() => {
      const els = [...document.querySelectorAll(".v21fw-band")];
      const a = els[0].getBoundingClientRect();
      const b = els[1].getBoundingClientRect();
      return b.top - a.bottom;
    });
    expect(gap).toBeGreaterThan(60);
  }
});

test("filament anchors still present in the featured header", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.locator(".v21fw .v21fw-title-word")).toHaveCount(1);
  await expect(page.locator(".v21fw .v21fw-title em")).toHaveCount(1);
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase2 --project=laptop-1440`
Expected: the bands test FAILS (`.v21fw-band` count 0 — current markup uses `.v21fw-card`). The anchors test PASSES (header already has those classes).

- [ ] **Step 3: Transform the render in `V21FeaturedWork.jsx`.**

Read the file first. **Preserve**: the `PROJECTS` data array, the `VideoModal`/`ProjectGallery` components and the open-state logic (`openProject`/`setOpenProject` etc.), and the entire `.v21fw-header` block (eyebrow, `.v21fw-title` with `.v21fw-title-word` + `em`, lede). **Replace** the `<ul className="v21fw-grid">…</ul>` (the 3-up card grid) with a stacked bands list. Use the FIRST 3 entries of the existing `PROJECTS` array (do not invent new data/paths; reuse each project's existing poster/video/client/title/sector/year fields — match the field names already used in this file). The new list markup pattern (adapt field names to the file's actual data keys):

```jsx
<ul className="v21fw-bands">
  {PROJECTS.slice(0, 3).map((p, i) => (
    <li className="v21fw-band" key={p.slug || p.id || i}>
      <a
        className="v21fw-band-link"
        href={`#${p.slug || ""}`}
        data-cursor="play"
        onClick={(e) => { e.preventDefault(); openProject ? null : null; /* call the file's existing open fn, e.g. openModal(p) or openReel(p) */ }}
        aria-label={`Open ${p.client} — ${p.title}`}
      >
        <div className="v21fw-band-media">
          <img className="v21fw-band-poster" src={p.poster /* file's poster field */} alt="" loading="lazy" />
          {/* reuse the file's existing hover-video element/approach if present */}
          <span className="v21fw-band-scrim" aria-hidden="true" />
        </div>
        <span className="v21fw-band-cap">{`${p.client} · ${p.sector || p.category} · ${p.year}`}</span>
        <h3 className="v21fw-band-title">{p.title}</h3>
      </a>
    </li>
  ))}
</ul>
```

Wire the `onClick` to the file's EXISTING open function (e.g. `openModal(p)` for single-film or `openReel(p, rect)` — use whatever the file already defines). Keep the hover-to-play video using the file's existing video element/crossfade approach, moved inside `.v21fw-band-media`. Remove the old per-card cursor badge markup (`.v21fw-cursor*`) — the global `V21Cursor` now provides the play state via `data-cursor="play"`.

- [ ] **Step 4: Append the editorial bands CSS to `v21.css`:**

```css
/* ---- Featured · editorial cinematic bands (Continuum Phase 2) ------------- */
.v21fw-bands {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-block);
}
.v21fw-band { position: relative; }
.v21fw-band-link {
  display: block;
  position: relative;
  text-decoration: none;
  color: var(--v21-ink, #f3f5f8);
}
.v21fw-band-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  background: #0b0e13;
  border: 1px solid rgba(111, 211, 255, 0.10);
}
.v21fw-band-poster,
.v21fw-band-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.v21fw-band-poster {
  transform: scale(1.04);
  transition: transform 1.1s cubic-bezier(.2,.8,.2,1), opacity 0.8s ease;
  will-change: transform;
}
.v21fw-band-video { opacity: 0; transition: opacity 0.8s ease; }
.v21fw-band-link:hover .v21fw-band-poster { transform: scale(1.0); }
.v21fw-band-link:hover .v21fw-band-video { opacity: 1; }
.v21fw-band-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6,7,8,0) 45%, rgba(6,7,8,0.72) 100%);
}
.v21fw-band-cap {
  display: block;
  margin-top: clamp(14px, 1.4vw, 22px);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--v21-mut, #8b93a0);
}
.v21fw-band-title {
  position: absolute;
  left: clamp(20px, 3vw, 48px);
  bottom: clamp(20px, 3vw, 44px);
  right: clamp(20px, 3vw, 48px);
  margin: 0;
  font-family: var(--v21-serif, Georgia, serif);
  font-weight: 400;
  font-size: clamp(30px, 5vw, 76px);
  line-height: 0.98;
  letter-spacing: -0.01em;
  color: #fff;
  pointer-events: none;
}
/* Slow reveal: bands enter softly (GSAP sets data-revealed when in view). */
.v21fw-band { opacity: 0; transform: translateY(40px); filter: blur(8px); transition: none; }
.v21fw-band.is-revealed { opacity: 1; transform: none; filter: none; }
@media (prefers-reduced-motion: reduce) {
  .v21fw-band { opacity: 1; transform: none; filter: none; }
  .v21fw-band-poster { transform: none; }
}
```

- [ ] **Step 5: Add the GSAP reveal + parallax effect in `V21FeaturedWork.jsx`.**

Add a `useEffect` (guarded by reduced-motion via the existing `usePrefersReducedMotion` hook — import it if not already) that, inside a `gsap.context`, for each `.v21fw-band`: adds `is-revealed` via a ScrollTrigger reveal, and applies a gentle scrubbed parallax to its `.v21fw-band-media`. Use this exact effect (place after the existing effects):

```jsx
useEffect(() => {
  if (reduced) return; // reduced-motion: CSS shows bands fully, no parallax
  const root = rootRef.current || document;
  const ctx = gsap.context(() => {
    const bands = gsap.utils.toArray(".v21fw-band");
    bands.forEach((band) => {
      // Slow, one-shot reveal.
      ScrollTrigger.create({
        trigger: band,
        start: "top 82%",
        once: true,
        onEnter: () => band.classList.add("is-revealed"),
      });
      // Gentle parallax depth on the media.
      const media = band.querySelector(".v21fw-band-media");
      if (media) {
        gsap.fromTo(
          media,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: 2.5 },
          }
        );
      }
    });
  }, rootRef);
  return () => ctx.revert();
}, [reduced]);
```

Requirements for this to work: the component must (a) import `gsap` + `ScrollTrigger` and register the plugin (the file likely already does for other effects — reuse), (b) import and call `usePrefersReducedMotion()` into `reduced`, (c) have a `rootRef` on the section root (`<section className="v21fw" ref={rootRef}>`) — add the ref if absent. The CSS reveal classes (`.v21fw-band` hidden → `.is-revealed` shown) are from Step 4.

- [ ] **Step 6: Append reveal/hover tests** to `v21-continuum-phase2.spec.js`:

```js
test("bands reveal on scroll and a band opens a modal on click", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  const top = await fwTop(page);
  await scrollTo(page, top - 200);
  await page.waitForTimeout(SCRUB_MS);

  // First band has revealed (opacity ~1) once scrolled into view.
  const op = await page.locator(".v21fw-band").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.9);

  // Clicking a band opens the existing video modal.
  await page.locator(".v21fw-band-link").first().click();
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.locator(".v21fw-modal")).toHaveCount(1);
});

test("reduced-motion: bands are visible without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const op = await page.locator(".v21fw-band").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.95);
});
```

(If the file's open function opens `ProjectGallery` (a reel panel, class `.v21fw-reel`/similar) instead of `.v21fw-modal` for the first project, adjust the modal selector in this test to match whatever the file's open path actually renders — assert the opened overlay exists, do not weaken to a trivial check.)

- [ ] **Step 7: Run to verify PASS**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase2 --project=laptop-1440`
Expected: PASS (5 tests). Run twice for stability.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/components/portfolio-v21/V21FeaturedWork.jsx tma-web/components/portfolio-v21/v21.css tma-web/playwright/tests/v21-continuum-phase2.spec.js
git commit -m "feat(v21): editorial cinematic Featured bands (Continuum Phase 2)"
```

---

## Task 2: Guards + 6-viewport sweep + filament/V20 isolation

**Files:** append to `v21-continuum-phase2.spec.js`

- [ ] **Step 1: Append the guard + filament-intact tests:**

```js
test("filament still draws across featured (path length unchanged-ish, no errors)", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  // Filament still renders its paths (head/letters/tail present).
  const paths = await page.locator(".v21-filament-path").count();
  expect(paths).toBeGreaterThan(0);
  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run full Phase-2 spec on laptop (expect 6 passed)**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase2 --project=laptop-1440`

- [ ] **Step 3: Run across all 6 viewports**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase2`
Expected: green on all 6. If a band-size/gap threshold is viewport-sensitive on mobile, relax ONLY that numeric value for that case (document it); never weaken structural/count assertions or the filament/reduced-motion checks. If a real product bug appears, STOP and report BLOCKED.

- [ ] **Step 4: V20 + V21 Phase-1 no-regression**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters v21-continuum-phase1 --project=laptop-1440`
Expected: all pass. Confirm `git diff --name-only HEAD~ | grep -i portfolio-v20` → empty.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/playwright/tests/v21-continuum-phase2.spec.js
git commit -m "test(v21): Continuum Phase 2 guards + sweep"
```

---

## Manual verification
`http://localhost:3000/portfolio-v21`: Featured is now a small set of large cinematic bands stacked with big breaths between, oversized serif titles overlapping the media, hover plays the film, the custom cursor shows ▶ over them, and they reveal softly as you scroll. The filament still threads from the hero through the Featured title and on. `/portfolio-v20` unchanged.

## Self-Review (done during planning)
- **Spec coverage (Phase 2):** a few standout works (slice(0,3)), large full-bleed bands one-per-breath (`--space-block` gap, 16/9), oversized serif title overlap (`.v21fw-band-title`), minimal caption (`.v21fw-band-cap`), hover-to-play (poster→video crossfade), slow reveal (GSAP `once` + CSS), parallax depth (scrub 2.5), custom-cursor play state (`data-cursor="play"`), click→modal (reuse existing open fn), reduced-motion (CSS visible + effect bailed), filament anchors preserved (`.v21fw-title-word`/`em`), section order unchanged, tests + 6 viewports + V20/Phase-1 isolation. ✔
- **Placeholder scan:** the render Step instructs adapting to the file's real data keys/open fn (the file is the source of truth for those) and shows the complete markup/CSS; the open-fn wiring is "call the file's existing openModal/openReel" — this is a deliberate reuse instruction, not a TODO. Implementer must read the file (it's a modify-existing task).
- **Name consistency:** `.v21fw-bands/-band/-band-link/-band-media/-band-poster/-band-video/-band-scrim/-band-cap/-band-title`, `is-revealed`, `data-cursor="play"`, `.v21fw-title-word`/`.v21fw-title em` used consistently across markup, CSS, and tests. ✔
- **Risk note:** the exact field names (poster vs thumb, sector vs category, single video vs videos[]) and the open function name differ between the local hardcoded data and global projects.js — the implementer MUST read `V21FeaturedWork.jsx` and use its actual fields/functions. Flagged in Task 1 Step 3.

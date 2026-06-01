# V21 Continuum — Phase 3: Gallery + Contact + Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the redesign — replace the dense Our Work reels+4-col-parallax with an airy 2-up editorial **Gallery** of all works, give the **Contact** close calm v21 spacing, and do the **cleanup pass** (delete dead old-hero/cursor CSS, alias the mono font var, gate the custom cursor off on touch). Keep the filament tail threading and V20 untouched.

**Architecture:** Transform `V21OurWork.jsx` in place — **preserve its `.v21ow-header` (filament TAIL anchors `.v21ow-title-word` + `.v21ow-title em`) and its `useProjectDrawer().open(slug, triggerEl)` open path** — replacing the reel/parallax body with a calm 2-up grid of all `PROJECTS` (generous gaps, staggered column offset, gentle GSAP reveal, hover zoom, custom cursor). Light v21 CSS overrides calm the existing `.contact`. A focused cleanup removes dead CSS and the coarse-pointer cursor node, and aliases `--font-mono → --mono`.

**Tech Stack:** Next.js (React client), GSAP ScrollTrigger, CSS tokens, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-06-01-v21-continuum-redesign-design.md` (Phase 3 = Gallery + Contact + polish).

**Branch:** `feat/obsidian-hero`. **V20 untouched.** Commit only listed paths; never `git add -A`. Dev server on http://localhost:3000.

**Scope guard:** do not reorder sections, do not touch the filament/atmosphere/hero/featured. Gallery replaces only the Our Work *body*; keep its header + drawer. Atmosphere "warm at contact" is intentionally OUT of scope (YAGNI for this pass).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `tma-web/components/portfolio-v21/V21OurWork.jsx` | Keep header (filament anchors) + `useProjectDrawer` open; replace reels/parallax body with an airy 2-up gallery grid of all PROJECTS + gentle reveal | **Modify** |
| `tma-web/components/portfolio-v21/v21.css` | Append `.v21ow-gal*` gallery styles; add `--font-mono: var(--mono,…)` alias + calm `.v21-page .contact` spacing override; DELETE dead blocks (old prism hero, `.v21fw-cursor*`, `.v21cursor*`/`has-magnetic-cursor`) | **Modify** |
| `tma-web/components/portfolio-v21/V21Cursor.jsx` | Gate the DOM node out on coarse pointer (return null) | **Modify** |
| `tma-web/playwright/tests/v21-continuum-phase3.spec.js` | e2e: gallery 2-up + all-works count + gaps + filament tail anchors + reveal + drawer-open + reduced-motion + console guard | **Create** |

## Running tests
```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase3 --project=laptop-1440
```

---

## Task 1: Airy 2-up Gallery (replace Our Work body)

**Files:** Modify `V21OurWork.jsx` (body + reveal effect), append CSS, create test.

- [ ] **Step 1: Create `tma-web/playwright/tests/v21-continuum-phase3.spec.js`:**

```js
import { test, expect } from "@playwright/test";

const SETTLE_MS = 450;
const SCRUB_MS = 1200;
const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollBottom = (page) =>
  page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
const owTop = (page) =>
  page.evaluate(() => Math.round(window.scrollY + document.querySelector(".v21ow").getBoundingClientRect().top));

test("gallery is an airy 2-up grid of many works with filament tail anchors intact", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  // Filament TAIL anchors preserved in the header.
  await expect(page.locator(".v21ow .v21ow-title-word")).toHaveCount(1);
  await expect(page.locator(".v21ow .v21ow-title em")).toHaveCount(1);

  // The gallery shows the full set of works (more than the old 3 featured).
  const items = page.locator(".v21ow-gitem");
  expect(await items.count()).toBeGreaterThan(8);

  // 2 columns: the first two items sit side by side (similar top, different left).
  const boxes = await items.evaluateAll((els) => els.slice(0, 2).map((e) => e.getBoundingClientRect()));
  expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(boxes[0].height); // roughly same row
  expect(Math.abs(boxes[0].left - boxes[1].left)).toBeGreaterThan(boxes[0].width * 0.5); // different columns
});

test("gallery has generous gaps (not the old tight grid)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const colGap = await page.locator(".v21ow-gal").evaluate((el) => parseFloat(getComputedStyle(el).columnGap) || parseFloat(getComputedStyle(el).gap) || 0);
  expect(colGap).toBeGreaterThan(28);
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase3 --project=laptop-1440`
Expected: FAIL — `.v21ow-gitem`/`.v21ow-gal` count 0; anchor sub-asserts pass.

- [ ] **Step 3: Transform `V21OurWork.jsx`.** Read it first. **Preserve**: the import of `PROJECTS`, `const { open } = useProjectDrawer()`, and the entire `.v21ow-header` (eyebrow, `.v21ow-title` with `.v21ow-title-word` + `<em>work</em>`, lede). **Replace** the body — both `<WorkSlider>` reels (Part 1) and the `<WorkParallax>` 4-col grid (Part 2) — with one airy 2-up gallery of ALL projects. You may delete the now-unused `WorkSlider`/`WorkParallax`/`REEL_A`/`REEL_B`/`PARALLAX` definitions (verify unreferenced after). New body markup (adapt field names to the real `PROJECTS` shape — `slug`, `client`, `title`, `category`, `year`, `thumb` with `hero` fallback):

```jsx
<ul className="v21ow-gal">
  {PROJECTS.map((p, i) => (
    <li className={`v21ow-gitem${i % 2 === 1 ? " v21ow-gitem--offset" : ""}`} key={p.slug || i}>
      <a
        className="v21ow-gitem-link"
        href={`#${p.slug || ""}`}
        data-cursor="play"
        onClick={(e) => { e.preventDefault(); open(p.slug, e.currentTarget); }}
        aria-label={`Open ${p.client} — ${p.title}`}
      >
        <div className="v21ow-gitem-media">
          <img className="v21ow-gitem-img" src={p.thumb || p.hero} alt="" loading="lazy" />
        </div>
        <div className="v21ow-gitem-cap">
          <span className="v21ow-gitem-client">{p.client}</span>
          <span className="v21ow-gitem-meta">{`${p.category} · ${p.year}`}</span>
        </div>
      </a>
    </li>
  ))}
</ul>
```

Keep the section root `<section className="v21ow" ...>` and ensure it has a `ref` for the GSAP context (add `const rootRef = useRef(null)` + `ref={rootRef}` if not present).

- [ ] **Step 4: Append the gallery CSS to `v21.css`:**

```css
/* ---- Our Work · airy 2-up editorial gallery (Continuum Phase 3) ----------- */
.v21ow-gal {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: clamp(32px, 4vw, 80px);
  row-gap: var(--space-block);
}
.v21ow-gitem--offset { margin-top: clamp(48px, 8vw, 140px); } /* staggered column */
.v21ow-gitem-link { display: block; text-decoration: none; color: var(--v21-ink, #f3f5f8); }
.v21ow-gitem-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  overflow: hidden;
  background: #0b0e13;
  border: 1px solid rgba(111, 211, 255, 0.08);
}
.v21ow-gitem-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; display: block;
  transform: scale(1.04);
  transition: transform 1.0s cubic-bezier(.2,.8,.2,1);
  will-change: transform;
}
.v21ow-gitem-link:hover .v21ow-gitem-img { transform: scale(1.0); }
.v21ow-gitem-cap {
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
  margin-top: clamp(12px, 1.2vw, 18px);
}
.v21ow-gitem-client { font-family: var(--v21-serif, Georgia, serif); font-size: clamp(18px, 1.8vw, 28px); }
.v21ow-gitem-meta { font-family: var(--mono, ui-monospace, monospace); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--v21-mut, #8b93a0); }
/* gentle reveal */
.v21ow-gitem { opacity: 0; transform: translateY(36px); }
.v21ow-gitem.is-revealed { opacity: 1; transform: none; transition: opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1); }
@media (max-width: 760px) {
  .v21ow-gal { grid-template-columns: 1fr; }
  .v21ow-gitem--offset { margin-top: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .v21ow-gitem { opacity: 1; transform: none; }
  .v21ow-gitem-img { transform: none; }
}
```

- [ ] **Step 5: Add the reveal effect in `V21OurWork.jsx`.** Import `usePrefersReducedMotion` (call into `reduced`) and ensure gsap+ScrollTrigger imported/registered (reuse existing). After existing effects:

```jsx
useEffect(() => {
  if (reduced) return;
  const ctx = gsap.context(() => {
    gsap.utils.toArray(".v21ow-gitem").forEach((it) => {
      ScrollTrigger.create({ trigger: it, start: "top 86%", once: true, onEnter: () => it.classList.add("is-revealed") });
    });
  }, rootRef);
  return () => ctx.revert();
}, [reduced]);
```

- [ ] **Step 6: Append reveal + drawer-open tests:**

```js
test("gallery items reveal on scroll and open the project drawer on click", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  const top = await owTop(page);
  await scrollTo(page, top + 100);
  await page.waitForTimeout(SCRUB_MS);
  const op = await page.locator(".v21ow-gitem").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.9);

  await page.locator(".v21ow-gitem-link").first().click();
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.locator(".v21pm")).toHaveCount(1); // V21ProjectModal opened
});

test("reduced-motion: gallery items visible without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const op = await page.locator(".v21ow-gitem").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.95);
});
```

(If the drawer overlay class is not `.v21pm`, set it to whatever `V21ProjectModal` actually renders — assert the real opened modal, don't weaken.)

- [ ] **Step 7: Run PASS (4 tests), twice**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase3 --project=laptop-1440`

- [ ] **Step 8: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/components/portfolio-v21/V21OurWork.jsx tma-web/components/portfolio-v21/v21.css tma-web/playwright/tests/v21-continuum-phase3.spec.js
git commit -m "feat(v21): airy 2-up editorial gallery of all works (Continuum Phase 3)"
```

---

## Task 2: Polish — mono alias, calm Contact, cursor coarse gate, dead-CSS cleanup

**Files:** Modify `v21.css`, `V21Cursor.jsx`.

- [ ] **Step 1: Mono alias + calm Contact.** Append to `v21.css`:

```css
/* Alias so v21 components that reference --font-mono resolve to the design mono. */
.v21-page { --font-mono: var(--mono, ui-monospace, SFMono-Regular, Menlo, monospace); }
/* Calm the inherited Contact section to the Continuum rhythm. */
.v21-page .contact { padding-top: var(--space-act); }
```

- [ ] **Step 2: Gate the custom cursor off on coarse pointer.** In `V21Cursor.jsx`, change the render guard so no DOM node is emitted on touch. Replace `if (reduced) return null;` (the line just before the returned JSX) with a state-gated render:

Add near the top of the component: `const [fine, setFine] = useState(false);` and in the effect set it: at the start of the effect body add `setFine(!reduced && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches);`. Then change the render guard to:

```jsx
  if (reduced || !fine) return null;
```

Keep the existing effect logic (the rAF still only runs when fine + not reduced). Because the dot ref is only needed when rendered, move the rAF setup into a SECOND effect that depends on `[fine]` and bails if `!fine` — OR simplest: keep one effect but guard the rAF body with the same `(pointer: fine)` check (already present) and rely on `fine` only for the render gate. Ensure: on a fine-pointer desktop the cursor still mounts and follows (Phase-1 tests must still pass); on coarse pointer no `.v21-cursor` node exists; under reduced motion no node.

- [ ] **Step 3: Run the FULL v21 suite to confirm nothing broke before deleting CSS:**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 v21-continuum-phase2 v21-continuum-phase3 --project=laptop-1440`
Expected: all pass (phase1 6, phase2 5, phase3 4).

- [ ] **Step 4: Delete dead CSS blocks** in `v21.css`. Delete by locating each block by its selectors (NOT raw line numbers, which shift). Delete ENTIRELY:
  - **Old prism hero block:** the FIRST `.v21-hero { … }` rule (the one immediately followed by `.v21-hero-bg`, `.v21-prism`, `.v21-prism-cone*` and the prism `@keyframes`) through the end of that prism/keyframes group. DO NOT delete the SECOND, newer `.v21-hero` block (the one under the `/* Type-first editorial hero (Continuum) */` comment near the end of the file) — that one is LIVE.
  - **Old featured hover badge:** `.v21fw-cursor`, `.v21fw-cursor-ring`, `.v21fw-cursor-play`, `.v21fw-cursor-label`, and the media query that hides the badge on coarse/touch. (KEEP `.v21fw`, `.v21fw-header`, `.v21fw-title*`, `.v21fw-modal*`, and the `.v21pg*` gallery panel — all LIVE.)
  - **Old magnetic cursor:** `.v21cursor`, `.v21cursor-label`, and any `body.has-magnetic-cursor …` rules. (KEEP the new `.v21-cursor` block — note the hyphen — it's LIVE.)
  - **Old featured-grid/card (optional, only if clearly unused now):** `.v21fw-grid`, `.v21fw-card*` are dead after Phase 2 (Featured uses `.v21fw-bands`). Delete them too IF grep confirms no JSX emits `.v21fw-card`/`.v21fw-grid` (Phase 2 removed them). If unsure, leave them — they're inert.

  After each deletion, do NOT rely on memory — keep the file valid CSS (balanced braces).

- [ ] **Step 5: Re-run the full v21 suite + visually sanity-check nothing lost styling:**

Run: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase1 v21-continuum-phase2 v21-continuum-phase3 --project=laptop-1440`
Expected: ALL still pass (deletions were dead code). If any test now fails, you deleted a live rule — restore it.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/components/portfolio-v21/v21.css tma-web/components/portfolio-v21/V21Cursor.jsx
git commit -m "chore(v21): mono alias, calm contact, coarse-pointer cursor gate, prune dead CSS"
```

---

## Task 3: Guards + 6-viewport sweep + full regression

**Files:** append to `v21-continuum-phase3.spec.js`.

- [ ] **Step 1: Append guard test:**

```js
test("filament tail still draws + no console errors on full scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  expect(await page.locator(".v21-filament-path").count()).toBeGreaterThan(0);
  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});

test("coarse pointer (touch) renders no custom-cursor node", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  // On the touch-capable mobile projects, the fine-pointer gate should drop the node.
  expect(await page.locator(".v21-cursor").count()).toBe(0);
});
```

(Note: the second test asserts coarse-pointer behavior; it is meaningful on the `hasTouch` mobile projects. On the desktop projects pointer is fine, so it would NOT hold — restrict expectations: run this test only where touch. Simplest: keep it and let the 6-viewport run validate it on mobile/tablet projects; if it fails on the desktop projects because they report fine pointer, change the assertion to: skip when `matchMedia("(pointer: fine)")` matches. Implement that guard inside the test.)

Implement the test robustly:

```js
test("coarse pointer (touch) renders no custom-cursor node", async ({ page }) => {
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const fine = await page.evaluate(() => window.matchMedia("(pointer: fine)").matches);
  const count = await page.locator(".v21-cursor").count();
  if (fine) expect(count).toBe(1);
  else expect(count).toBe(0);
});
```

- [ ] **Step 2: Run full Phase-3 spec on laptop (expect 6 passed)**

`cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase3 --project=laptop-1440`

- [ ] **Step 3: Run across all 6 viewports**

`cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-continuum-phase3`
Expected: green on all 6. If a 2-col-specific assertion fails on the ≤760px single-column mobile layout (where items stack), guard that assertion to only run when 2 columns are present (e.g. check viewport width > 760), and document it. Do NOT weaken the anchor/drawer/reduced-motion/console checks.

- [ ] **Step 4: Full regression (V20 + all V21 phases) + V20 isolation**

`cd /c/Users/Pc/Downloads/the-motion-agency-web-main/tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters v21-continuum-phase1 v21-continuum-phase2 --project=laptop-1440`
Then: `cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git diff --name-only HEAD~3..HEAD | grep -i portfolio-v20` → expect EMPTY.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Pc/Downloads/the-motion-agency-web-main && git add tma-web/playwright/tests/v21-continuum-phase3.spec.js
git commit -m "test(v21): Continuum Phase 3 guards + coarse-cursor + sweep"
```

---

## Manual verification
`http://localhost:3000/portfolio-v21`: after Featured + the MOTION MATTERS beat, Our Work is now an airy 2-up gallery of all works with big gaps, a staggered column, gentle reveals, hover zoom and the custom cursor; clicking opens the project drawer. Contact sits below with calm spacing. The filament still draws its tail across "Our work". No dead-cursor flashes on mobile. `/portfolio-v20` unchanged.

## Self-Review (done during planning)
- **Spec coverage (Phase 3):** airy 2-up gallery of all works (default layout) with generous gaps + staggered column (`v21ow-gitem--offset`) + gentle reveal + hover zoom + custom cursor + drawer open (Task 1); calm Contact spacing + mono alias + cursor coarse gate + dead-CSS prune (Task 2); filament-tail anchors preserved; guards + 6 viewports + full regression + V20 isolation (Task 3). ✔
- **Placeholder scan:** the JS steps instruct adapting to the file's real `PROJECTS` fields / `open()` / drawer overlay class (the file is the source of truth — a modify-existing task), with complete markup/CSS/tests shown. The cleanup deletes by selector with the full test suite as the safety net. No TODOs.
- **Name consistency:** `.v21ow-gal/-gitem/-gitem--offset/-gitem-link/-gitem-media/-gitem-img/-gitem-cap/-gitem-client/-gitem-meta`, `is-revealed`, `.v21ow-title-word`/`.v21ow-title em` (preserved), `.v21pm` (drawer), `--font-mono`→`--mono`, `.v21-cursor` (new, kept) vs `.v21cursor` (old, deleted) used consistently. ✔
- **Risk note:** field names + drawer overlay class must be confirmed against `V21OurWork.jsx`/`V21ProjectModal` by the implementer (flagged). Dead-CSS deletion is delicate (two `.v21-hero` rules) — the plan deletes by content + re-runs the whole suite as the guard.

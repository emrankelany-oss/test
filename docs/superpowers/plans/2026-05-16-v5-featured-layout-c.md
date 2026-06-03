# V5 Featured Work — Layout C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the V5 featured-work cards in an asymmetric "feature-led" editorial composition (Layout C), reduce 6→5 cards, and show images only — without changing the scroll animation at all.

**Architecture:** Approach 1 from the spec — the GSAP deck→grid animation derives entirely from each invisible `.v5-grid-slot`'s measured rect, so re-templating the CSS grid + trimming the card array is sufficient. No animation/timeline/choreography code is touched. Two files change: `V5Stage.jsx` (data) and `globals.css` (layout).

**Tech Stack:** Next.js 16 (Turbopack), React, GSAP/ScrollTrigger, Framer Motion, plain CSS in `app/globals.css`. No unit-test runner in this repo — verification is done against the running dev server (`http://localhost:3000/portfolio-v5`) via the Playwright MCP, the method already established for this work.

**Spec:** `docs/superpowers/specs/2026-05-16-v5-featured-layout-c-design.md`

---

## Pre-flight (shared context for every task)

- Dev server is already running on `http://localhost:3000` (PID outside our control; it hot-reloads). If `http://localhost:3000/portfolio-v5` is unreachable, start it: `cd tma-web && npm run dev` (it will pick a free port; adjust URLs).
- The preloader keeps scroll locked for ~3s + page-load on first paint, then flies away. For DOM verification, navigate, wait for the preloader to finish (it unmounts; `.v5-preloader` gone), then measure. Slots are present in the DOM from first paint regardless.
- After CSS edits, the browser may hold a stale stylesheet mid-HMR; always re-navigate with a fresh cache-bust query (e.g. `?v=NN`) before measuring, and confirm rule text via `document.styleSheets` if a computed value looks wrong (pattern used throughout this project).

---

## Task 1: Create the feature branch

**Files:** none (git only)

- [ ] **Step 1: Branch off main**

Run:
```bash
cd "c:/Users/Pc/Downloads/the-motion-agency-web-main"
git checkout -b feat/v5-featured-layout-c
```
Expected: `Switched to a new branch 'feat/v5-featured-layout-c'`

---

## Task 2: Reduce featured set 6 → 5 and trim choreography

**Files:**
- Modify: `tma-web/components/portfolio-v5/V5Stage.jsx:12` and `:17-24`

- [ ] **Step 1: Slice 5 cards instead of 6**

Edit `tma-web/components/portfolio-v5/V5Stage.jsx`. Replace:
```js
const CARDS = featuredWork.slice(0, 6);
```
with:
```js
const CARDS = featuredWork.slice(0, 5);
```

- [ ] **Step 2: Trim CHOREO to 5 entries**

In the same file, replace the whole `CHOREO` array:
```js
const CHOREO = [
  { tx: 0, ty: -10, rot: -4, depth: 0.18, delay: 0.0, ease: "power3.out", overshoot: 0 },
  { tx: -8, ty: 12, rot: 6, depth: 0.06, delay: 0.05, ease: "power2.out", overshoot: 0 },
  { tx: 14, ty: -2, rot: -9, depth: 0.0, delay: 0.04, ease: "power3.out", overshoot: 0 },
  { tx: -4, ty: -14, rot: 4, depth: 0.22, delay: 0.07, ease: "power2.inOut", overshoot: 0 },
  { tx: 6, ty: 8, rot: -2, depth: 0.04, delay: 0.03, ease: "back.out(1.5)", overshoot: 1 },
  { tx: -12, ty: 4, rot: 8, depth: 0.12, delay: 0.12, ease: "expo.out", overshoot: 0 },
];
```
with (the 6th entry removed — 5 entries, one per card; choreography is relative to each card's own slot so the remaining 5 keep their feel):
```js
const CHOREO = [
  { tx: 0, ty: -10, rot: -4, depth: 0.18, delay: 0.0, ease: "power3.out", overshoot: 0 },
  { tx: -8, ty: 12, rot: 6, depth: 0.06, delay: 0.05, ease: "power2.out", overshoot: 0 },
  { tx: 14, ty: -2, rot: -9, depth: 0.0, delay: 0.04, ease: "power3.out", overshoot: 0 },
  { tx: -4, ty: -14, rot: 4, depth: 0.22, delay: 0.07, ease: "power2.inOut", overshoot: 0 },
  { tx: 6, ty: 8, rot: -2, depth: 0.04, delay: 0.03, ease: "back.out(1.5)", overshoot: 1 },
];
```

- [ ] **Step 3: Verify 5 cards, Vancouver gone**

Navigate to `http://localhost:3000/portfolio-v5?v=1`, let the preloader finish, then run this Playwright evaluate:
```js
() => {
  const cards = [...document.querySelectorAll('.v5-card')];
  return {
    count: cards.length,
    hasVancouver: document.body.innerHTML.includes('Vancouver Canada TVC'),
  };
}
```
Expected: `{ count: 5, hasVancouver: false }`

- [ ] **Step 4: Commit**

```bash
git add tma-web/components/portfolio-v5/V5Stage.jsx
git commit -m "feat(v5): reduce featured work to 5 cards"
```

---

## Task 3: Re-template the slot grid to Layout C

**Files:**
- Modify: `tma-web/app/globals.css:5628` (comment) and `:5642-5649` (`.v5-grid-inner`)

- [ ] **Step 1: Update the section comment**

Replace:
```css
/* --- The 3x2 grid of card slots ---------------------------------------- */
```
with:
```css
/* --- Editorial "feature-led" grid of card slots (Layout C) ------------- */
```

- [ ] **Step 2: Replace the grid template**

Replace:
```css
.v5-grid-inner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: clamp(16px, 1.4vw, 28px);
  width: 100%;
  height: 100%;
}
```
with:
```css
.v5-grid-inner {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: clamp(16px, 1.4vw, 28px);
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 3: Add the 5 slot placements**

Immediately AFTER the `.v5-grid-slot { … }` rule (the block that ends with the "moves the card without resizing the layout." comment and its closing `}`), insert:
```css
/* Feature-led editorial composition (Layout C). data-slot-index N → card 0(N+1).
   See docs/superpowers/specs/2026-05-16-v5-featured-layout-c-design.md */
.v5-grid-inner .v5-grid-slot[data-slot-index="0"] { grid-column: 1 / 7;   grid-row: 1 / 5; }
.v5-grid-inner .v5-grid-slot[data-slot-index="1"] { grid-column: 7 / 13;  grid-row: 1 / 3; }
.v5-grid-inner .v5-grid-slot[data-slot-index="2"] { grid-column: 7 / 10;  grid-row: 3 / 7; }
.v5-grid-inner .v5-grid-slot[data-slot-index="3"] { grid-column: 10 / 13; grid-row: 3 / 6; }
.v5-grid-inner .v5-grid-slot[data-slot-index="4"] { grid-column: 1 / 7;   grid-row: 5 / 7; }
```

- [ ] **Step 4: Verify the Layout-C arrangement**

Navigate to `http://localhost:3000/portfolio-v5?v=2`, let the preloader finish, then run:
```js
() => {
  const s = i => {
    const el = document.querySelector(`.v5-grid-slot[data-slot-index="${i}"]`);
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const a = [0,1,2,3,4].map(s);
  return {
    slots: a,
    featureIsLargestUpperLeft: a[0].w * a[0].h === Math.max(...a.map(o=>o.w*o.h)) && a[0].x < a[1].x,
    bannerTopRight: a[1].x > a[0].x && Math.abs(a[1].y - a[0].y) < 8 && a[1].h < a[0].h,
    portraitTallRight: a[2].x > a[0].x && a[2].h > a[3].h && a[2].y > a[1].y,
    stripUnderFeature: Math.abs(a[4].x - a[0].x) < 8 && a[4].y > a[0].y,
  };
}
```
Expected: all four booleans `true`, and `slots` shows slot 0 the biggest box anchored top-left, slot 1 a short wide box top-right, slot 2 a tall box on the right, slot 3 a small box right, slot 4 a wide short box left under slot 0.

- [ ] **Step 5: Commit**

```bash
git add tma-web/app/globals.css
git commit -m "feat(v5): editorial feature-led landing layout (Layout C)"
```

---

## Task 4: Images only — hide the card text body

**Files:**
- Modify: `tma-web/app/globals.css` (add one rule after the slot placements from Task 3)

- [ ] **Step 1: Add the V5-scoped rule**

Immediately AFTER the 5 slot-placement rules added in Task 3 Step 3, insert:
```css
/* Images only for now — hide the card text body (V5-scoped so the
   shared V5Card text is untouched on any other route). */
.v5-page .v5-card-body { display: none; }
```

- [ ] **Step 2: Verify no text renders on the cards**

Navigate to `http://localhost:3000/portfolio-v5?v=3`, let the preloader finish, then run:
```js
() => {
  const bodies = [...document.querySelectorAll('.v5-card-body')];
  const anyVisible = bodies.some(b => getComputedStyle(b).display !== 'none');
  const imgs = [...document.querySelectorAll('.v5-card-img')]
    .filter(i => getComputedStyle(i).backgroundImage !== 'none').length;
  return { cardBodies: bodies.length, anyTextVisible: anyVisible, imagesShown: imgs };
}
```
Expected: `{ cardBodies: 5, anyTextVisible: false, imagesShown: 5 }`

- [ ] **Step 3: Commit**

```bash
git add tma-web/app/globals.css
git commit -m "feat(v5): show featured cards as images only"
```

---

## Task 5: Mobile single-column stack

**Files:**
- Modify: `tma-web/app/globals.css` (add a media query after the Task 4 rule)

- [ ] **Step 1: Add the mobile collapse**

Immediately AFTER the `.v5-page .v5-card-body { display: none; }` rule from Task 4, insert:
```css
/* Mobile: collapse the editorial grid to a single stacked column,
   source order preserved (01 → 05). */
@media (max-width: 720px) {
  .v5-grid-inner {
    display: flex;
    flex-direction: column;
    gap: clamp(16px, 4vw, 24px);
  }
  .v5-grid-inner .v5-grid-slot {
    grid-column: auto;
    grid-row: auto;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
  }
}
```

- [ ] **Step 2: Verify the stack at ≤720px**

Resize the Playwright browser to 390×844, navigate to `http://localhost:3000/portfolio-v5?v=4`, let the preloader finish, then run:
```js
() => {
  const a = [0,1,2,3,4].map(i => {
    const r = document.querySelector(`.v5-grid-slot[data-slot-index="${i}"]`).getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) };
  });
  const stacked = a.every((o,i) => i === 0 || o.y > a[i-1].y); // each below previous
  const sameWidth = a.every(o => Math.abs(o.w - a[0].w) < 2);   // all full-width equal
  return { slots: a, stackedInOrder: stacked, fullWidthEqual: sameWidth };
}
```
Expected: `stackedInOrder: true`, `fullWidthEqual: true` (slots 0→4 each strictly below the previous, all equal full width). Restore the browser to a desktop size (e.g. 1536×900) afterward.

- [ ] **Step 3: Commit**

```bash
git add tma-web/app/globals.css
git commit -m "feat(v5): stack featured layout in one column on mobile"
```

---

## Task 6: Regression — scroll animation unchanged + clean console

**Files:** none (verification only)

- [ ] **Step 1: Confirm the deck→grid animation still runs identically**

Navigate to `http://localhost:3000/portfolio-v5?v=5` (desktop size), let the preloader finish. Then drive the scroll and sample card transforms to confirm the deck→grid scrub still animates (cards start offset/rotated "on the deck" and settle into their slots):
```js
async () => {
  const card = document.querySelector('.v5-card');
  const read = () => getComputedStyle(card).transform;
  const atTop = read();
  window.scrollTo(0, Math.round(window.innerHeight * 2)); // mid-pin
  await new Promise(r => setTimeout(r, 400));
  const mid = read();
  window.scrollTo(0, Math.round(window.innerHeight * 4.5)); // past the pin
  await new Promise(r => setTimeout(r, 600));
  const settled = read();
  return { atTop, mid, settled,
    moved: atTop !== mid && mid !== settled }; // transform actually scrubbed
}
```
Expected: `moved: true`, and `settled` is at/near identity `matrix(1, 0, 0, 1, 0, 0)` (cards resting in their slots) — i.e. the deck→grid scrub behaves exactly as before, now landing in the Layout-C slots.

- [ ] **Step 2: Confirm no console errors**

Read the newest Playwright console log and confirm no errors/warnings (excluding the benign React-DevTools/HMR lines):
```bash
cd "c:/Users/Pc/Downloads/the-motion-agency-web-main" && ls -t .playwright-mcp/console-*.log | head -1 | xargs cat | grep -viE "react-devtools|HMR connected" | grep -iE "error|warn|fail|exception|uncaught" | head || echo CLEAN
```
Expected: `CLEAN` (no matching lines).

- [ ] **Step 3: Final spec cross-check (manual, against the live page)**

Confirm every spec "Verification" item: (1) 5 cards, no Vancouver; (2) images only, no text; (3) Layout-C resting positions; (4) scroll/pin/scrub/idle identical; (5) ≤720px single-column stack 01→05; (6) no console errors, reduced-motion still snaps. Tick each off.

- [ ] **Step 4: Final commit (if any verification tweak-points were fixed)**

Only if Steps 1–3 surfaced a fix:
```bash
git add -A
git commit -m "fix(v5): address layout-c verification findings"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** 6→5 + CHOREO (Task 2) ✓; Layout-C grid + 5 placements (Task 3) ✓; images-only / hide `.v5-card-body`, `.compact` dropped (Task 4) ✓; mobile single-column stack (Task 5) ✓; animation untouched + verification (Task 6) ✓; out-of-scope items not touched ✓.
- **Placeholder scan:** no TBD/TODO; every code step shows full code; every verify step shows the exact snippet + expected output.
- **Type/selector consistency:** `data-slot-index` 0–4, `.v5-grid-slot`, `.v5-grid-inner`, `.v5-card-body`, `.v5-page`, `.v5-card-img` all match the real DOM (verified against `V5Card.jsx` / `V5Stage.jsx` / `globals.css`). Slot↔card mapping (slot 0 = card 01 …) consistent across spec and tasks.
- **Note:** This repo has no unit-test framework; per project-established practice, verification uses the Playwright MCP against the dev server. Steps are written so a worker runs the snippet and checks the stated expected result before committing.

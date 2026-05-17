# Portfolio V14 — Manifesto + Featured Chapters (SP-2B) — Design

**Date:** 2026-05-17
**Status:** Approved (pending written-spec review)
**Branch context:** `feat/portfolio-v14` (continues from completed + verified SP-0 kernel, SP-1 ProjectUniverse intro, SP-2A cross-scene transition system).

---

## 1. Scope & context

SP-2 ("manifesto + Foodics/Zid featured chapters") was split into SP-2A (transition
system — DONE) and **SP-2B (this doc — narrative content chapters)**. SP-2B replaces the
two SP-0 placeholder probe scenes with three real content scenes after the intro film.

Decided in brainstorming (binding):
- Final `/portfolio-v14` scroll order: **IntroFilm → Manifesto → Foodics → Zid**.
- `ProbeSceneA` and `ProbeSceneB` are both **deleted**.
- Featured chapters are **full narrative acts** (hook → Problem → Solution → Results
  climax) using **verbatim deck copy**, self-contained (no link-out to `/case/*`).
- Each chapter is **one pinned scene with phase-sliced acts** (not act-per-scene).
- Acts are **type-led**; the case key-visual appears only as a dimmed cinematic
  backdrop on the **hook** and **results** acts (bookends), never behind Problem/
  Solution.
- Manifesto = **distilled staged statement** (selected verbatim Slide-3 phrases as
  ~4 huge editorial lines, climaxing on the agency signature close), pure type.
- No closing/CTA scene after Zid (deferred to SP-3). After Zid the scene unpins and
  the document ends.

Out of scope: archive wall / impact / closing (SP-3); WebGL transition renderer +
per-pixel match-cut (SP-4); the existing `/case/foodics-boundless` & `/case/zid-ripple`
deep-dive pages (untouched).

## 2. Pure core — `tma-web/components/portfolio-v14/engine/chapterActs.js`

Two pure, deterministic, side-effect-free exports (node:test, the SP-0/1/2A pattern):

### 2.1 `actState(progress, plan)`

`plan` = `{ acts: [{ id, weight }, ...], inFrac = 0.2, outFrac = 0.2 }`. Act `i`
occupies a contiguous progress band sized by its `weight` (weights normalized over the
sum). Returns `{ index, id, local, phase, opacity }`:

- `index`/`id` — the act whose band contains `clamp(progress,0,1)` (the **last** act
  for `progress >= 1`).
- `local` — progress within that act's band, `0→1`.
- `phase` — `"in"` while `local < inFrac`, `"out"` while `local > 1 - outFrac`, else
  `"hold"`.
- `opacity` — eased reveal envelope: ramps `0→1` over the `in` window, `1` during
  `hold`, ramps `1→0` over the `out` window. This makes adjacent acts cross-fade at
  their shared band edge (no pop / no hard cut between acts).

Edge handling: empty or missing `acts` → a safe `{ index:0, id:null, local:0,
phase:"hold", opacity:1 }`; single act → always that act; `progress` clamped to
`[0,1]`; weights `<= 0` treated as equal. Pure: no DOM/time/random/IO.

### 2.2 `metricValue(local, from, to, ease = easeOutCubic)`

Scrub-driven count-up: returns the numeric value to display for a Results metric given
that act's `local` (0→1). `local <= 0 → from`, `local >= 1 → to`, eased between. So
numerals climb **as the viewer scrolls** the Results act, not on a timer. Pure;
`easeOutCubic` is a module-private default. Unit-tested at endpoints + midpoint +
clamp + descending ranges.

## 3. Components

### 3.1 `tma-web/components/portfolio-v14/scenes/ChapterScene.jsx`

Generic, data-driven. Props: a `chapter` object (§4 shape). Behavior:

- `useScene({ id: chapter.id, order: chapter.order, viewports: chapter.viewports,
  bleed: chapter.bleed, onProgress: setP })`.
- `const s = actState(p, chapter.plan)` each render.
- Renders the active act (`chapter.acts[s.index]`) with the `s.opacity` envelope and a
  small `translateY` keyed off `s.phase`/`s.local` (in: rise up; out: drift up & away)
  — huge editorial type: act **label** (e.g. "PROBLEM"), **headline**, **body** (deck
  copy; bulleted list for Problem/Solution), brand-accent rule using `chapter.accent`.
- **Bookend imagery:** if the active act's `kind` is `"hook"` or `"results"`, render
  `chapter.image` as a fixed-cover dimmed backdrop (`filter: brightness(.4)`, dark
  gradient scrim) behind the type; `"problem"`/`"solution"`/`"statement"` acts render
  pure type on `chapter.bleed`-ground.
- **Results act:** renders `chapter.acts[results].metrics` as tiles; each tile's
  numeric portion = `metricValue(s.local, m.from, m.to)` formatted by `m.format`
  (e.g. `$Xm`, `X%`, `X,XXX+`), with its static label/suffix. Non-metric prose
  ("recognized as the F&B growth platform…") shown as supporting type.
- Section is `height:100vh` with the scene `data-scene={chapter.id}`; a stable
  `data-act` attribute reflects the active act id (Playwright hook).
- All styling inline (matches the established v14 scene convention; no globals.css).

### 3.2 `tma-web/components/portfolio-v14/scenes/ManifestoScene.jsx`

Thin wrapper over the same core: `useScene({ id:"manifesto", order:30, viewports:4,
bleed:"#07060a", onProgress })`; a `plan` of 4 equal `kind:"statement"` acts; renders
each as one massive centered editorial line via the `actState` envelope. No image, no
metrics. Lines (verbatim Slide-3 phrases):
1. "We don't just create campaigns — we become an extension of your team."
2. "We transform B2B brands into culturally relevant, emotionally engaging
   experiences."
3. "We craft communication that resonates, visuals that convert, strategies that move
   markets."
4. "We build brands with purpose. We create work that matters."

### 3.3 Data files (verbatim deck copy)

`tma-web/components/portfolio-v14/chapters/foodics.js`:
- `id:"foodics"`, `order:40`, `viewports:6`, `bleed:"#150829"`, `accent:"#74D1EA"`,
  `image:"/assets/case-foodics-boundless.png"`.
- `plan.acts` weights: hook .15 / problem .30 / solution .27 / results .28.
- Acts:
  - **hook** — label "FOODICS · BOUNDLESS", headline "Boundless: Launching What's
    Next for F&B".
  - **problem** — label "THE PROBLEM", body bullets: "Evolving from POS provider to a
    complete F&B growth platform — payments, lending, data, marketplaces."; "The
    market still saw them as just a POS system."; "Thousands of restaurant owners
    needed educating on the new tools."; "Clear market leadership had to be
    established as competition intensified."
  - **solution** — label "WHAT WE DID", body bullets: "Created a flagship annual
    stage positioning Foodics as the authority shaping F&B tech."; "Crafted end-to-end
    event narratives — Foodics Pay, Capital, the Marketplace."; "Designed experiences
    that educated and excited: live demos, data, launches."; "Transformed perception
    — no longer a POS provider but the growth engine for F&B."
  - **results** — label "THE RESULTS", metrics:
    `{ label:"Revenue", from:15.4, to:20.8, format:"$%sM", note:"+35.6% YoY" }`,
    `{ label:"Merchants", from:8000, to:32000, format:"%s+", note:"35% Saudi market share" }`,
    `{ label:"Valuation", from:0, to:1, format:"$%sB", note:"unicorn" }`;
    supporting line: "Recognized as the F&B growth platform — fueling the trajectory
    to unicorn status."
`tma-web/components/portfolio-v14/chapters/zid.js`:
- `id:"zid"`, `order:50`, `viewports:6`, `bleed:"#04141c"`, `accent:"#4ED1C5"`,
  `image:"/assets/case-zid-ripple.png"`.
- `plan.acts` weights: hook .15 / problem .27 / solution .30 / results .28.
- Acts:
  - **hook** — label "ZID · RIPPLE 2024", headline "Ripple: Launching the Total
    Commerce Era".
  - **problem** — bullets: "Fragmented systems — merchants juggled separate tools for
    e-commerce, social, and physical retail."; "Scale barriers — logistical
    inefficiencies and disconnected marketing capped growth."; "Perception gap — Zid
    needed to be the unified, future-ready commerce partner, not just a storefront
    builder."
  - **solution** — bullets: "Launched Total Commerce — one ecosystem for e-commerce,
    social, and offline retail."; "Hosted the flagship Ripple event in Diriyah with
    1,000+ merchants and industry leaders."; "Showcased a unified dashboard and
    cross-border logistics from one interface."; "Revealed AI-powered marketing and
    integrations — TikTok, Amazon, Snapchat, Meta."
  - **results** — metrics:
    `{ label:"YoY growth", from:0, to:200, format:"%s%", note:"revitalized brand" }`,
    `{ label:"Active merchants", from:0, to:12000, format:"%s+", note:"+30% in 2024" }`,
    `{ label:"Basket & conversion", from:0, to:50, format:"+%s%", note:"both up" }`,
    `{ label:"GMV", from:0, to:25, format:"+%s%", note:"YoY" }`.

(Number formatting: `format` is a template where `%s` is the `metricValue` output
rounded — integers comma-grouped for ≥1000, one decimal for the revenue figures. The
formatting helper is part of `ChapterScene` and is exercised by the e2e final-value
assertions.)

## 4. Chapter data shape

```
{ id, order, viewports, bleed, accent, image?,
  plan: { acts:[{id,weight}], inFrac, outFrac },
  acts: [
    { id, kind:"hook"|"problem"|"solution"|"results"|"statement",
      label?, headline?, body?: string[], metrics?: [...], support?: string }
  ] }
```
`plan.acts[i].id` must match `acts[i].id` (same order). `ChapterScene` validates this
in dev (`console.warn` once) and otherwise renders defensively (treat missing act as
empty).

## 5. Wiring

`tma-web/components/portfolio-v14/V14Experience.jsx` becomes:
```
<SceneControllerProvider>
  <SmoothScroll />
  <IntroFilmScene />              {/* order 20, unchanged */}
  <ManifestoScene />             {/* order 30 */}
  <ChapterScene chapter={foodics} />  {/* order 40 */}
  <ChapterScene chapter={zid} />      {/* order 50 */}
</SceneControllerProvider>
```
`ProbeSceneA.jsx` and `ProbeSceneB.jsx` deleted. `IntroFilmScene` unchanged (still
order 20, `bleed:"#000"`). `page.jsx` unchanged.

## 6. Reduced motion / errors

- Reduced motion: `useScene` (SP-0 behavior) fires `onProgress(1)` once, no pin/scrub.
  `actState(1, plan)` → the **last act** (Results / final statement line) at full
  `opacity`, `metricValue(1,…)` → final deck values. So each chapter renders its fully
  resolved climax; the page is a normal scroll document; the SP-2A overlay driver
  never starts (already verified). Each chapter is fully readable statically.
- Missing/short `acts` or `plan` mismatch → defensive empty render + one dev
  `console.warn`; never throws into the scroll path.
- Missing `image` → bookend acts fall back to the pure-type ground (no broken img).

## 7. Verification

- **node:test** `v14-chapterActs.test.mjs`: act-band mapping by weight; in/hold/out
  phase + opacity envelope (cross-fade at boundaries; 0 at band-edge handoff); clamp;
  single/empty/zero-weight; `metricValue` endpoints/mid/clamp/descending.
- **Playwright** `tma-web/playwright/tests/v14-chapters.spec.js` on `/portfolio-v14`:
  scrolling reveals Manifesto → Foodics → Zid in order — at expected scroll bands the
  scene's `data-act` advances through `hook→problem→solution→results`; the visible
  headline/label text for each act is present at its band; Foodics & Zid Results
  numerals reach their final deck values (`$20.8M`, `32,000+`, `$1B`; `200%`,
  `12,000+`, `+50%`, `+25%`) by scene end; a `reducedMotion:"reduce"` run shows each
  chapter's Results/final statement resolved and the page fully scrollable with all
  three `data-scene` reachable.
- **Regression (serial, `--workers=1`):** SP-0 `v14-kernel.spec.js`
  (`?frames=procedural`) + `v14-reduced-motion.spec.js`, SP-1 `v14-universe.spec.js`,
  SP-2A `v14-transition.spec.js` all still pass. The transition spec asserts
  `regions >= 2`; with Manifesto/Foodics/Zid added there are now ≥3 seams, so `>= 2`
  still holds (no spec edit needed). Full `npm test` unit suite green.

## 8. Out of scope

Closing/impact/archive (SP-3); WebGL renderer & per-pixel content match-cut (SP-4);
restyling IntroFilm/engine; `/case/*` deep-dive pages; a global v14 stylesheet (scenes
keep the established inline-style convention).

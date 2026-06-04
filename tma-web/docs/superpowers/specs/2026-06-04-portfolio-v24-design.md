# Portfolio V24 — Design Spec (Final Version)

**Date:** 2026-06-04
**Branch:** `feat/obsidian-hero`
**Route:** `/portfolio-v24`
**Status:** Approved design — pending implementation plan

V24 is the **last** portfolio version. It is a self-contained page that reuses the
canonical content + proven plumbing from V20/V22/V23, and adds three new ideas:
(1) works **classified by category** as **50/50 video-vs-stats rows**, (2) a
**brand prismatic gradient** background that swims on scroll, (3) subtle
bidirectional **fade-up / fade-down** reveals on cards and stats.

---

## 1. Goals & non-goals

**Goals**
- Reuse the V23 preloader **exactly** (logo stroke-draw → solid fill → fly into navbar slot).
- Present every work with stats/numbers and a description.
- Group works **by category**; within each category, each work is a row with
  **50% media** on one side and **50% stats + description** on the other, sides alternating.
- Honour the TMA Brand Guidelines V2: **Gotham-substitute typography**, the brand
  **prismatic spectrum gradient**, bold titles + slightly-less-bold sub-text.
- A smooth, immersive **animated gradient background** (the brand hero gradient) that
  drifts/"swims" as the user scrolls.
- Subtle fade-up reveal on scroll-in, fade-down on scroll-out, for grid cards + stats.

**Non-goals**
- No new copywriting with invented numbers. Real KPIs only where the deck provides them.
- No CMS / backend. Content stays in the existing static data modules.
- Not modifying V20–V23. V24 is additive.

---

## 2. Source-of-truth research (locked)

**Brand Guidelines V2 (`TMA Brand Guidelines-V2 copy.pdf`, 22pp):**
- **Typography:** Gotham (Black | Ultra | Bold | Book). Titles use Black/Ultra,
  sub-text uses Bold, body uses Book. Gotham is licensed and **not** in the repo →
  V24 uses **Montserrat** (Google) as the closest free substitute: titles
  Black/ExtraBold (800–900), sub-text Bold/SemiBold (600–700), body Medium (500).
- **Core palette:** Black `#000000`; Blue (Pantone 286C) ≈ `#0033A0`;
  Red (1795C) ≈ `#D22730`; Beige (7527C) ≈ `#D7D2C4`.
- **Hero / signature gradient** (cover + "Where Strategy Meets Bold Storytelling" +
  "Thank You" closing): a diagonal **prismatic spectrum beam on black**. Sampled stops:
  `#02146C` → `#033DA2` → `#027ECA` (blues) → `#24C3DB` cyan → `#4DD4C8` teal →
  `#F8E557` yellow → `#F5A422`/`#F56917` orange → `#DA210C` red → `#C41E5A` magenta.
- **Iridescent fluid blobs** (Flow / Motion / Fluidity) — glassy chromatic liquid
  masses on black; same spectrum.

**Strategy deck (`TMA _ Where Strategy Meets Bold Storytelling.pdf`, 77pp):**
- All 56 project pages scanned. **The only numeric KPIs in the deck are the agency
  stats and the two deep case studies.** Everything else is creative/brand showcase
  (brand guidelines, social, landing pages, TVC keyframes) with no metrics.
- **Agency stats:** Growth **178%** · Clients **30+** · Business created **500+** ·
  Team/experience **29+**.
- **Foodics KPIs:** +35.6% revenue YoY ($15.4M→$20.8M) · 32,000+ merchants (from 8,000) ·
  35% Saudi market share · $1B unicorn valuation.
- **Zid KPIs:** 200% brand growth YoY · +30% active merchants (12,000+) ·
  +50% basket/conversion · +25% GMV.

**Existing data layer (reused verbatim):**
- `components/portfolio-v20/projects.js` — `PROJECTS` (29 entries: slug, client, title,
  category, year, tagline, thumb, hero, gallery, services, deep, intro, problem,
  solution, results). The two deep studies carry `results` (metric+label).
- `components/portfolio-v22/showreel.js` — `SHOWREEL` (real films per flagship project).

---

## 3. Architecture

New route + component package; everything else reused.

```
app/portfolio-v24/page.jsx           ← composition only
components/portfolio-v24/
  v24.css                            ← all V24 styles (scoped under .v24-page)
  data.js                            ← category taxonomy + per-work stat derivation
  V24Preloader.jsx                   ← ported V23 preloader (assets swapped to V24)
  V24Logo.jsx + tmaLogoPaths.js      ← reused from V23 (import or copy)
  V24GradientField.jsx               ← fixed animated background (beam + blobs)
  V24Hero.jsx                        ← title + hero media
  V24StatsBand.jsx                   ← agency stats (178% / 30+ / 500+ / 29+)
  V24Categories.jsx                  ← maps taxonomy → category groups
  V24CategoryGroup.jsx               ← header + list of work rows
  V24WorkRow.jsx                     ← one 50/50 media-vs-stats row (alternating)
  V24Media.jsx                       ← video (autoplay) | Ken-Burns still fallback
  useV24Reveal.js                    ← bidirectional fade-up/down (GSAP ScrollTrigger)
```

**Page composition:**
```
<main class="v24-page">
  <V24Preloader/>
  <V24GradientField/>     (fixed, z-behind, aria-hidden)
  <SmoothScroll/> (reused)  <V23Cursor/> (reused as-is)
  <ClientShell enableScrolledNav/> <Nav/>
  <V24Hero/>
  <V24StatsBand/>
  <V24Categories/>
  <Contact/> <Footer/>
</main>
```

Reused as-is: `components/portfolio/SmoothScroll`, `components/home/{Nav,Contact,Footer}`,
`components/shell/ClientShell`, `components/portfolio-v23/V23Cursor`.

---

## 4. Component contracts

### V24GradientField (background)
- **What:** Fixed full-viewport `<canvas>` rendering the prismatic beam + 1–2 drifting
  iridescent blobs, screen/​lighten-blended over black. **Purpose:** ambient brand motion.
- **Inputs:** none (reads scroll position internally via a passive listener / Lenis).
- **Behaviour:** continuous slow drift (rAF). Scroll progress shifts beam angle/offset and
  blob positions so it "swims" while scrolling. Never overlaps text legibility (low alpha,
  behind content, optional subtle darken vignette).
- **Perf:** throttled to devicePixelRatio≤2, pauses when tab hidden, respects
  `prefers-reduced-motion` (renders a static gradient, no animation).

### V24WorkRow
- **Inputs:** `{ work, index }` where `work = { slug, client, title, tagline, description,
  category, media, stats[] }`.
- **Layout:** CSS grid, two 50% columns. `index` parity decides media-left vs media-right.
  Stacks to single column on mobile (media first).
- **Depends on:** `V24Media`, `useV24Reveal`.

### V24Media
- **Inputs:** `{ film?, image, title }`.
- **Behaviour:** if `film` exists → `<video autoplay muted loop playsinline>` with poster;
  else `<img>` with a CSS Ken-Burns slow zoom/pan. Iris/scale reveal on first entry.

### useV24Reveal (the new motion requirement)
- Registers a GSAP ScrollTrigger per element with **scrub** so the element fades/translates
  **up on enter** and **back down on leave** (bidirectional), tied to scroll position.
- Subtle: opacity 0→1, translateY ~24px→0, short distance. Reduced-motion → no transform.

---

## 5. Data model (`data.js`)

```
CATEGORIES = ordered list of { key, label, slugs[] }
```
Taxonomy (one bucket per project; editable):

| key | label | members (by slug, examples) |
|---|---|---|
| events | Events & Experiences | foodics-boundless, zid-ripple |
| brand | Brand & Identity | brand-identity + brand·product projects |
| social | Social & Campaigns | sol-brand, salasa-2034, social/TVC projects |
| film | Film, TVC & Animation | brand/corporate/product films, animation |
| digital | Digital & Product | landing-page·product, OOH·launch |

Any project not explicitly mapped falls into a sensible bucket via its `category` string,
so no work is dropped.

**Per-work stats derivation (`statsFor(project)`):**
- If `project.results` exists (Foodics, Zid) → use the first 3–4 real `{metric,label}`.
- Else → factual meta-stats only:
  - `{ metric: project.year, label: "Year" }`
  - `{ metric: project.category, label: "Discipline" }`
  - `{ metric: String(project.services.length), label: "Services" }`
  - optional `{ metric: String(project.gallery.length), label: "Deliverables" }`
- **No invented numbers, ever.**

**Media resolution (`mediaFor(project)`):**
- If a `SHOWREEL` entry exists for the slug → its `cardVideo`/first film.
- Else → `cardImage(project)` (deck crop / hero / thumb) rendered with Ken-Burns.

---

## 6. Typography & color tokens (in `v24.css`)

- Load **Montserrat** via `next/font/google` in `app/layout.jsx` → CSS var `--font-montserrat`.
- `.v24-title` Montserrat 800–900, tight tracking, large clamp sizes.
- `.v24-subtitle` Montserrat 700 (visibly bolder than body, lighter than title).
- `.v24-body` Montserrat 500.
- Tokens: `--v24-black:#000`, `--v24-blue:#0033A0`, `--v24-red:#D22730`,
  `--v24-beige:#D7D2C4`, plus `--v24-spectrum-*` stops for accents/gradient.

---

## 7. Preloader (reuse, exact)

Port V23Preloader → V24Preloader **without changing the animation**: logo stroke-draws
top→bottom/left→right with cascade, fills to solid, percentage counter, then flies the
mark into `.v24-page .nav-logo`. Swap `criticalAssets()` to V24's real assets
(hero video, category media posters/films). Same `v24-loading` class gating, same
reduced-motion / `__V24_SKIP_PRELOADER` escape hatches.

---

## 8. Animations summary

| Element | Motion |
|---|---|
| Preloader | identical to V23 |
| Background | prismatic beam + drifting blobs, continuous drift + scroll-coupled swim |
| Work media | iris/scale reveal on entry; Ken-Burns on stills |
| Cards + stats | **fade-up on scroll-in, fade-down on scroll-out** (scrub, subtle) |
| Titles | line/clip reveal on entry |

All motion respects `prefers-reduced-motion`.

---

## 9. Testing (Playwright e2e)

Across mobile / tablet / desktop / wide:
1. Page mounts; preloader runs and reveals (and `__V24_SKIP_PRELOADER` fast path works).
2. `V24GradientField` canvas is present and animating (non-static frame diff) unless reduced-motion.
3. Every category group renders with ≥1 work row; rows alternate media side.
4. Each row shows a media element (video OR img) and a stats block with ≥3 stats.
5. Fade-up/down fires both directions (opacity changes entering and leaving viewport).
6. Reduced-motion: no transforms/animation errors; content fully visible.
7. No console errors; Foodics/Zid show real KPIs.

---

## 10. Risks / open items

- **Gradient legibility:** keep background alpha low + optional vignette so stats text
  stays readable over bright spectrum bands.
- **Video weight:** many rows could autoplay video → lazy-load/pause offscreen videos.
- **Taxonomy fit:** the 5 buckets are a starting point; reviewable in `data.js`.

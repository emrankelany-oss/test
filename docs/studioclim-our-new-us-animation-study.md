# studioclim.com/work/our-new-us — Source & Animation Teardown

A full inspection of Clim Studio's "Our New Us!" rebrand case-study page. Captured live on
2026-06-02 via headless Chromium (DOM probing + bundle source reading + scroll-through
screenshots). This documents the tech stack, every section, and every animation / motion /
transition the page uses, plus the underlying mechanics so the patterns can be reproduced.

---

## 1. Tech stack (what's actually running)

| Concern | Library / approach | Evidence |
|---|---|---|
| Build | **Vite** ES-module bundle, single `assets/main.js` (~162 KB) + `assets/main.css` (~170 KB) | `link[rel=modulepreload]` runtime, hashed-less asset names |
| Animation engine | **anime.js v4** | `anime.createTimeline`, `anime.createTimer`, `anime.createDraggable`, `anime.animate`, `anime.utils.set/wrap`, `anime.engine.timeUnit="s"` |
| Smooth scroll | **Lenis** (minified, class `Li`) | `wheelMultiplier`/`touchMultiplier`, `lenis lenis-stopped` html class, emitter pattern, frame-rate-independent lerp |
| Text splitting | **Splitting.js** (`window.Splitting`) | `Splitting({target, by:"lines"})` and `by:"chars"` |
| Scroll triggers | **Custom `IntersectionObserver`** layer (not ScrollTrigger) | `IOobs = new IntersectionObserver(...)`, probes are 1px `.IO` elements, progress read against `lenis.targetScroll` |
| Page transitions | **Custom SPA router** (barba-style) | fade out `opacity:0` 0.45s → `fetch php/main.php` → `DOMParser` → swap content ("skin" system) |
| Custom cursor | **Hand-rolled** `.mou` element with magnetic lerp | `document.onmousemove`, clones `.mou_el` content into cursor |
| Media | Lazy `<video>` (self-hosted mp4 + Vimeo progressive), device/low-battery gating | 29 `<video>` nodes, most `data-lazy`; `#videoLow` autoplay-capability probe |
| No WebGL | 0 `<canvas>`, no Three.js/Pixi | All motion is DOM transforms, CSS clip-paths, and `<video>` |

**Everything is driven by `data-*` attributes** the engine scans on load:

| Attribute | Purpose |
|---|---|
| `data-anm` | named entrance animation (e.g. `tLine`) |
| `data-word` / `data-splitting` | mark text for Splitting.js line/word/char split |
| `data-cls` | class to toggle on scroll-intersection (e.g. `bar`) |
| `data-cmp` | component to hydrate (`intro`, `carou`, `foot`) |
| `data-crt` | cursor reaction type (`mou_eli`) |
| `data-skin` | page theme/skin (`case`) |
| `data-color` | per-section accent color |
| `data-hov` | hover asset swap (logo → `logogif.webp`) |
| `data-vid` / `data-auto` / `data-lazy` / `data-src` | lazy/auto video loading |
| `data-lenis-prevent` | opt a scroll container out of Lenis |

---

## 2. Page structure (top to bottom)

```
body
├── div#app
│   └── main.case  [data-skin=case]
│       ├── section.CMP.case_intro            ← hero
│       ├── section#infostart.case_info       ← intro block + media grid + "More information"
│       ├── section.case_related              ← draggable "Related Projects" carousel
│       └── footer.CMP.foot                   ← CTA + newsletter + socials
└── div.mou                                   ← custom cursor (global, fixed)
```

Page is ~12,000 px tall. Nav lives in a fixed `.head`.

---

## 3. Global / persistent motion

### 3.1 Lenis smooth scroll
- Inertial wheel + touch scrolling. Frame-rate-independent easing: `value = (1-h)·value + h·target` where
  `h = 1 - exp(-rate·dt)` (same lerp math reused by the cursor and custom value tweens).
- Page starts `lenis-stopped` (locked) during the preloader, then `.start()` releases it.
- Touch gets inertia: release velocity × `touchInertiaMultiplier` becomes a `scrollTo`.

### 3.2 Custom cursor (`.mou`)
- `position:fixed; z-index:120; pointer-events:none`. Visual is a `::before` **16 px dot**,
  `background: var(--acc)` (accent inherits the section's `--light`/`--color`), opacity fades 0.3 s.
- Follows the mouse with a lerp (smoothing factor `s = 0.4` free-moving).
- **Magnetic mode** (`this.mag`): when over a magnet target it snaps toward the element center —
  `pos = center − (center − mouse) · multi`, smoothing tightened to `s = 0.5`. Pull strength `multi`.
- **Content cloning**: elements tagged `data-crt="mou_eli"` (10 on this page) and `.mouEl` swap a
  cloned node (`.mou_el` / `.mou_ar`) *into* the cursor — this is how the carousel shows the
  **"Drag" bubble** (`.mou_el-drag` = small image + "Drag" label) while hovering the slider.

### 3.3 Magnetic buttons
- Buttons listen to their own `mousemove` and publish CSS vars:
  `--xM = (clientX − vw/2)·0.25`, `--yM = (clientY − vh/2)·0.25` → button label drifts toward the
  pointer at 0.25 strength (classic "magnetic button").

### 3.4 Scroll-aware header (`.sll-menu`)
- On scroll the header compacts: `padding` 2 rem, `.head_logo` shrinks (6 rem → 5.6 rem),
  `.head_ops` (the nav links) fade `opacity:0` + `translateY(-4rem)` and become non-interactive.
- Transitions: `0.4 s … cubic-bezier(.55,0,.1,1)` (the site's signature ease, used everywhere).

### 3.5 Animated logo "C"
- Conic-gradient rainbow ring around a "C". `data-hov="/public/media/logogif.webp"` → swaps to an
  animated webp on hover. Logo has a 1px `.IO` probe with `transition-delay:.4s` for staged reveal.

### 3.6 Page transitions (SPA)
- Internal links don't reload. Flow: `anime.animate(page,{opacity:0,duration:.45,ease:"inOut(2)"})`
  → `POST /php/main.php` to fetch the next page's data/"skin" → `DOMParser` builds new DOM → swap →
  re-init components → fade in. Scroll restoration forced to `manual`.

---

## 4. Section-by-section

### 4.1 Hero — `section.case_intro`  (component `intro`)
**Content:** eyebrow "CLIM STUDIO - STUDIO ORIGINAL", giant H1 "Our New Us!".

**Animations (anime.js timeline built from Splitting output):**
- **Line reveal (`data-anm="tLine"`)** — the headline (`.tLine`) is split `by:"lines"`; each line tweens:
  - `y: 50% → 0%`, `duration 0.8 s`, `ease: outExpo`
  - `opacity: 0 → 1`, `duration 0.4 s`, `ease: inOut(2)`
  - **stagger 0.15 s** per line. If >4 lines, everything scales to `0.8×` (faster) so long blocks don't drag.
- **Subtitle (`.tSub`)** offset to the end of the line stagger: `x: 24 → 0` + `opacity 0 → 1`, 0.4 s, `inOut(2)`.
- A **char-split variant** also exists in the engine: `Splitting(by:"chars")`, each char `y: 20% → 0%`,
  0.4 s, cubic ease — used for shorter punchy labels.
- On complete the element gets class `A`.

### 4.2 Info block — `section#infostart.case_info`
Two parts: a **sticky intro card** then a **full-bleed media grid**.

**(a) Scroll-progress bar** — `div.IO.IO-b [data-cls="bar"]`: an `.IO` probe whose intersection toggles
the `bar` class; this drives the thin **rainbow progress line pinned at the top** of the viewport
(visible in every scrolled screenshot).

**(b) Intro card (`.case_info_st`)** — a big **bright-green panel** with a curved/organic bottom edge
(border-radius blob) and **playfully rotated typography** ("New" set on a skew/rotation). Body copy
(`.nfo_t`) and credit lists (`.nfo_ul` — services / roles) reveal as lines on enter (same `tLine` system).

**(c) "More information" expander (`.fil_bt`)** — a persistent pill button (`+ More information`) docked
near the viewport bottom. Click toggles class `AC` on the `.fil` container → accordion open/close of the
detail panel. An anime.js timeline (`autoplay:false`) fades the button + work elements in
(`opacity 0 → 1`, 0.6 s) when the section enters.

**(d) Media grid (`.case_info_els`)** — alternating column spans: `.el.el_2` (wide, 2 media) and
`.el.el_1` (single). Each media cell = `.IO` probe + `.im` reveal wrapper.
- **`.im` reveal = expanding ellipse clip-path**: `clip-path: ellipse(var(--maskX) var(--maskY) at 50% 50%)`
  animated from `0% 0%` outward → media irises open from the center as it scrolls into view.
- A circular variant (`.im_h { border-radius:100%; overflow:hidden }`) clips media into a **circle**.
- `img`/`video` inside are `object-fit:cover`, full-bleed. Videos are lazy (`data-lazy`) and only
  autoplay if the device/battery probe allows.

### 4.3 Related Projects — `section.case_related`  (component `carou`)
**Content:** H3 "Related Projects", a **"Drag" pill** (`.drg span` — pill with `2px` border,
`border-radius:2.8rem`, and a looping CSS `animation:` pulse), and a horizontal track `.carou_h` of 8
`a.carou_el` cards (each `.im` auto-playing video thumb + `.t` title: Nobjects, Helia, Samsung Galaxy A14,
"It's About Time", etc.).

**Animations:**
- **Momentum drag carousel** via **anime.js `createDraggable`**:
  - Pointer drag with **velocity-based inertia** (`velocity`, `lastVelocity`, `direction`) — fling and it
    coasts, then **settles** (`onSettle`).
  - **Infinite loop** through `modifier: anime.utils.wrap(...)` (wraps x so the track is endless), with
    optional **snap** to card positions.
  - `resizeTicker` (150 ms anime timer) recomputes bounds on resize/refresh.
  - On grab (when track wider than 560 px) it adds a grabbing state class; the custom cursor shows the
    **"Drag" bubble** (cloned `.mou_el-drag`).
  - `.flicker` class hints a subtle opacity/visibility flicker treatment on the cards.
- Card video thumbnails autoplay muted/looping (gated by the autoplay probe).

### 4.4 Footer — `footer.foot`
**Content:** "👋 Let's collaborate. Contact Us", newsletter signup, socials (LinkedIn, Instagram…).
- Magnetic CTA button(s) (`--xM/--yM` follow). Line-reveal on the heading. Standard hover underline links.

---

## 5. Hover / micro-interactions

- **Nav links (`.nav_ops a` / `.head_ops a`)** — huge type (8 rem desktop / 6.4 rem mobile),
  `padding-bottom:6px`, each with a distinct **gradient underline** that animates in on hover
  (white / pink / purple / green / red per item, seen in the hero screenshot).
- **Fullscreen nav open** — anime.js timeline animates `.nav_bg div` color bars: per-item the bar's
  `bottom`/`height` are set from `getBoundingClientRect`, producing a **staggered curtain reveal**;
  `onComplete` restarts Lenis and clears the `A-nav` state. Hamburger is 3 stacked colored bars.
- **Magnetic buttons** everywhere (cursor pull at 0.25).
- **Custom-cursor accent** recolors per section (`--acc` ← section `data-color`).

---

## 6. Easing & timing cheat-sheet (the page's "feel")

| Token | Where |
|---|---|
| `outExpo` | line-reveal Y slide (0.8 s) — fast-out decelerate, the headline snap |
| `inOut(2)` | opacity fades, subtitle, page-transition fade (power-2 in/out) |
| `cubic` (~`cubic-bezier`) | char reveals, image opacity |
| `cubic-bezier(.55,0,.1,1)` | **signature CSS ease** — header compaction, logo, layout transitions (0.4–0.45 s) |
| Exponential lerp `1-exp(-rate·dt)` | Lenis scroll, cursor follow, custom value tweens |
| Stagger `0.15 s` (×0.8 if >4 lines) | line reveals |
| `clip-path: ellipse(maskX maskY at 50% 50%)` | media iris-open reveal |

**Design language:** black canvas, oversized clean sans, **vivid single-accent color blocks** (acid green,
gradients), **playful rotated/organic typographic panels**, iris/ellipse media reveals, line-by-line text,
momentum drag, magnetic cursor, and buttery Lenis scroll — motion is confident and snappy (outExpo) rather
than slow/floaty.

---

## 7. How to reproduce the headline patterns (anime.js v4 + Splitting)

```js
import { animate, createTimeline, createDraggable, utils } from 'animejs';
import Splitting from 'splitting';

// 7.1 Line reveal (the "tLine" pattern)
const lines = Splitting({ target: el, by: 'lines' })[0].lines;
const scale = lines.length > 4 ? 0.8 : 1;
const tl = createTimeline({ autoplay: false });
lines.forEach((line, i) => {
  tl.add(line, {
    y:       { from: '50%', to: '0%', duration: 0.8 * scale, ease: 'outExpo' },
    opacity: { from: 0,     to: 1,   duration: 0.4,          ease: 'inOut(2)' },
  }, i * 0.15 * scale);
});
// subtitle rides in after the last line:
tl.add(sub, { x:{from:24,to:0,duration:.4,ease:'inOut(2)'}, opacity:{from:0,to:1,duration:.4} }, lastOffset);
tl.init();

// 7.2 Media iris-reveal — CSS: clip-path: ellipse(var(--maskX) var(--maskY) at 50% 50%)
animate(im, { '--maskX': ['0%','75%'], '--maskY': ['0%','75%'], duration: .8, ease: 'outExpo' });

// 7.3 Infinite momentum carousel
createDraggable(track, {
  x: { snap: cardSnaps, modifier: utils.wrap(minX, maxX) }, // endless loop + snap
  // velocity/inertia + onSettle handled by anime v4
});
```

Trigger 7.1/7.2 from an `IntersectionObserver` (1px probe `.IO`) reading progress against the Lenis
`targetScroll`, exactly as the site does — rather than GSAP ScrollTrigger.

---

---

## 8. Layout & grid system (deep dive)

### 8.1 The fluid 12-column grid
The whole site sits on a **centered 12-column grid** built from CSS custom properties, not CSS Grid:

```css
:root { --padgut: calc(min(1.6rem,16px) + 5.6rem + 60*(100vw-1440px)/(2880-1440)); } /* fluid outer margin */
.grid { --sizegrid: calc(100vw - (var(--padgut) * 2)); width:100%; max-width:var(--sizegrid); margin-inline:auto; }
.cl12 { width: calc(var(--sizegrid) * 1);            padding-inline: var(--gutgrid); }
.cl4  { width: calc(var(--sizegrid) * .33333);       padding-inline: var(--gutgrid); }  /* 4/12 */
/* .cl1 … .cl12 = --sizegrid × n/12, each with --gutgrid inner gutters */
```

- `--padgut` = **fluid outer margin** that scales from ~5.6 rem at 1440 px up to ~11.6 rem at 2880 px (linear interpolation). At 1536 px it's the 78 px left offset every section shares.
- `--sizegrid` = usable content width = viewport − 2 gutters (≈1380 px at 1536 vw).
- `--gutgrid` = inner column gutter (between cells).
- **Breakpoints:** desktop **> 1194 px** → 12 columns; tablet 540–1194 px; mobile **≤ 540 px** → 4-column reference. (Confirmed by the built-in `?` grid-overlay debug tool that injects `.cl12` on desktop / `.cl4` on mobile.)
- Sections don't use literal `grid-template-columns`; they're **flex + explicit `calc()` widths** snapped to the 12-col fractions. The `.grid` class just constrains max-width and centers.

### 8.2 The case-study media grid (`.case_info_els`) — asymmetric editorial + animated reflow
Each media cell is `.el`:
```css
.el   { display:flex; flex-direction:column; align-items:flex-start; }
.el_1 { width:100%; }                               /* full-bleed row, one media */
.el_2 { width: calc(50% - var(--gutgrid)*.5); }     /* half — two sit side-by-side = one row */
@media (≤540px){ .el_2 { width:100%; } }            /* stack on mobile */
```
- **Rhythm:** the grid alternates full-width `el_1` cells with paired half-width `el_2` cells (two side-by-side, confirmed at x=78 and x=776), and **varies aspect ratios per cell** (square 682×682, portrait 682×853, landscape 1380×575 / 1380×776) for an editorial cadence rather than a uniform matrix.
- **Animated reflow (signature interaction):** cells transition their *width*:
  ```css
  .el_2          { transition:.4s width .4s cubic-bezier(.55,0,.1,1), .4s opacity .4s …; }
  .el_1.el-A     { transition:.4s width cubic-bezier(.55,0,.1,1);
                   width: calc(var(--sizegrid)*.41666 - var(--gutgrid)*2); }  /* 5/12 */
  .el-A          { opacity:0; transition:.4s opacity …; }  /* extra captions/claims fade in/out */
  ```
  Toggling **"More information"** adds/removes `.el-A`, so full-width media **animate down to ~5/12-column** and detail blocks cross-fade — the grid physically re-lays-out over 0.4 s.
- Every cell carries a **1 px `.IO` probe pinned to its right edge** (`top:0; right:10px; width:1px; height:100%`) — that's the IntersectionObserver trigger for the cell's clip-path reveal.

### 8.3 Section layout summary
| Section | Layout | Width logic |
|---|---|---|
| `main.case` | block flow | full viewport, children self-gutter |
| Hero `.case_intro` | block, full-bleed media + gutter-aligned text | text at `--padgut`, media 12-col |
| `.case_info_st` (intro card) | flex column, sticky text | `.case_info_sth` ≈ 773 px (≈7/12) left column, right kept open (asymmetric whitespace) |
| `.case_info_els` (media grid) | flex-wrap of `.el` cells | `el_1` 12/12, `el_2` 6/12, `.el-A` 5/12 |
| `.case_related_t` | flex row (space-between) | heading left, "Drag" pill right |
| `.carou_h` (track) | **flex row**, `flex-shrink:0` cards | width = Σ cards (≈5598 px), moved by `transform: translateX()` |
| `footer.foot` | flex | full width |

---

## 9. Video usage (full inventory — 29 `<video>` nodes)

| Location | Count | Source | Loading | Shape / sizing |
|---|---|---|---|---|
| **Hero** `.case_intro .im` | 1 | Vimeo progressive `…/file.mp4` (1080p) | **eager** autoplay | full-bleed 1380×776, `object-fit:cover`, ellipse clip-path reveal |
| **Case media grid** `.case_info .im` | ~12 | self-hosted `/uploads/*.mp4` | **`data-lazy` + `data-auto`** | sized to cell (682², 682×853, 1380×575/776); muted+loop autoplay; ellipse clip reveal |
| **Carousel cards** `.carou_el` | 16 (2 per card ×8) | `CSEGAL…`, `Helia_Thumbnail`, `Samsung_…A145G`, `itsabouttime…` (repeat for loop) | eager + lazy for clones | 668×423 (`aspect-ratio:656/416`), `clip-path: inset(0 round 20px)` rounded corners |

Key facts:
- **Most case-study "images" are actually muted autoplay videos** — there are no static `<img>` posters in the grid; the look-and-feel motion comes from looping footage.
- **Each carousel card stacks two video layers:** `.im` (visible, rounded-rect, pointer-reactive `mouEl`) and `.im_h` (absolute fill underneath). Same `src` — used for a hover/poster swap, and to keep playback seamless across the drag-loop clones.
- **Autoplay gating:** on load a hidden `#videoLow` micro-clip is `.play()`-tested. Success → device flagged autoplay-capable; failure / low-battery (`OPS.lowbat`) → videos fall back to a still frame. This is why videos are also `data-auto`.
- Carousel media has `pointer-events:none` + `-webkit-user-drag:none` so dragging never selects/ghosts the video; while dragging, `html.mou-drag` disables card hit-testing entirely.
- Mobile (≤540 px) carousel media switches to `aspect-ratio:1` with `clip-path: inset(0 round 12px)` (tighter radius).

---

## 10. Hover & pointer interactions (every one)

### 10.1 Header nav links (`.head_ops a`, 3.2 rem) — animated gradient underline
```css
.head_ops a { --xIn:1; --xLine:0; --oIn:1; --acc:black; --trnS:1;
              transform: translateY(calc(3.2rem * var(--xIn))); opacity: calc(1 - var(--oIn)); }
.head_ops a:nth-child(5n+1){--acc:white} (5n+2){--acc:#FDB2FF} (5n+3){--acc:#9544FF}
.head_ops a:nth-child(5n+4){--acc:#00ff49} (5n+5){--acc:#FF0000}
```
- Each link's underline is its own accent in a repeating 5-color cycle: **white / pink `#FDB2FF` / purple `#9544FF` / green `#00ff49` / red `#FF0000`** — exactly the 5 colors under Work·About·Services·Jobs·Contact in the hero.
- The underline (`:before/:after`) **grows `width:100%` from the side on hover** (driven by `--xLine`); the label color transitions `0.45 s cubic-bezier(.55,0,.1,1)`. `.mgn` is a magnetic inner span that drifts toward the cursor.

### 10.2 Fullscreen nav menu (`.nav_ops a`, 8 rem)
- Same 5-color accent cycle. Opening (`html.A-nav`) plays a **staggered curtain** (`.mov` per item, underline sweeps to 100 %, color bars in `.nav_bg div` rise via anime.js). The current page link (`.ALK`) shows a **1 rem round dot** instead of a bar.

### 10.3 Custom-cursor "liquid blob" (`.mou_eli`) — the headline hover effect
```css
.mou_eli   { position:absolute; aspect-ratio:126/80; background:var(--acc); border-radius:100%;
             transform: translate(-50%,60%) rotate(-40deg); width:0; max-height:0; }
.mou_eli.A { width: max(130%,14.6rem); max-height:12rem; transform: translate(-50%,60%) rotate(20deg);
             transition:.4s width cubic-bezier(.76,0,.24,1), .55s max-height cubic-bezier(.76,0,.2…); }
```
- 10 interactive elements are tagged `data-crt="mou_eli"`. On hover a **colored, rounded blob grows and rotates from −40° to +20°** behind the element (accent-tinted) — an organic "liquid reveal" tied to the magnetic cursor. Eases use `cubic-bezier(.76,0,.24,1)` (a punchy in-out).

### 10.4 Carousel "Drag" cursor bubble (`.mou_el`)
```css
.mou_el { width:128px; height:56px; border-radius:48px; background:#fff6;
          backdrop-filter: blur(6px); overflow:hidden; }
```
- A **frosted-glass pill** cloned into the cursor over the slider, showing a thumbnail + "Drag". `html.mou-drag` toggles the grabbing state.

### 10.5 "Drag" pill + scroll/drag hint keyframes
```css
.drg span { border:2px solid var(--light); border-radius:2.8rem;
            animation: drgBtn 3s cubic-bezier(.55,0,.1,1) infinite; }
@keyframes drgBall { 0%{transform:translate(-4rem) scale(0);opacity:0}
                     20%,70%{opacity:1} 50%{transform:translate(0) scale(1);opacity:0}
                     100%{transform:translate(4rem) …} }   /* ball sweeps L→R, drag hint */
@keyframes scBall  { …translateY(-16px)→0→16px… }          /* vertical = scroll hint */
@keyframes scBtn / drgBtn { width & color animate so the word collapses/reveals in sync }
@keyframes gradMove{ 0%{translate(0)} 100%{translate(-200%)} }  /* moving gradient fill */
```
A small ball repeatedly sweeps through the pill (horizontal = drag, vertical = scroll) while the label width/color pulses — a continuous affordance hint.

### 10.6 Magnetic buttons (CTAs, newsletter)
```css
button (.mgn wrapper) { --xM:0; --yM:0; transform: translate(var(--xM), var(--yM)); } /* JS feeds cursor offset ×0.25 */
button:hover:before   { transform: scale(.6 → .8); transition:.45s … cubic-bezier(.55,0,.1,1); }
.foot_nw_el button:hover .grad, .crc { opacity reveal; }
```
- Button label drifts toward the pointer (magnetic, 0.25 strength); the circular `::before` background **scales down on hover** (.6–.8); newsletter button reveals a gradient/circle accent.

### 10.7 "More information" filter button (`.fil_bt`) — plus→close morph
```css
.fil_bt { padding-left:8rem; height:6rem; background:#ffffff24; border-radius:3rem; }
.fil_bt:before { width:4.8rem; height:4.8rem; border-radius:50%; background:var(--dark); } /* icon disc */
.fil.AC .fil_bt_ic:before { transform: translate(-50%,-50%) rotate(-45deg) scaleX(1); }   /* + → × */
.fil.AC .fil_bt_ic:after  { transform: translate(-50%,-50%) rotate(45deg)  scaleX(1); }
.fil.AC .fil_bt_it { opacity:0; }                                                          /* label fades */
```
- The **plus icon rotates into an ×** (the two bars go to ±45°) and the label fades when open; this toggle drives the §8.2 grid reflow.

### 10.8 Media parallax & reveal (`.im`)
```css
.home_intro .im { --maskX:0%; --maskY:0%; clip-path: ellipse(var(--maskX) var(--maskY) at 50% 50%);
                  --xM:0; --yM:0; transform: translate(var(--xM), var(--yM)); }
```
- Each media: **ellipse clip-path iris-open** on scroll-in + a **subtle mouse parallax** (`--xM/--yM` translate). The circular variant `.im_h{border-radius:100%;overflow:hidden}` clips media into a perfect circle.

---

## Screenshots captured
- `clim-01-hero.jpeg` — hero (rainbow C logo, gradient-underline nav, split H1, cookie banner)
- `clim-02-info.jpeg` — green intro panel, rotated "New" type, organic edge, "More information +"
- `clim-03-grid.jpeg` — full-bleed brand media cell (iris reveal), sticky CTA, hamburger nav
- `clim-04-carousel.jpeg` — "Related Projects" draggable carousel + "Drag" pill, video cards
```

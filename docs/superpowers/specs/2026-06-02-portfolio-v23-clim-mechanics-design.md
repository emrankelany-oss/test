# Portfolio V23 — Clim-Mechanics Landing (TMA Blue) — Design Spec

**Date:** 2026-06-02
**Branch:** feat/obsidian-hero (same as v20/v22 work)
**Reference teardown:** `docs/studioclim-our-new-us-animation-study.md`

## Goal
A new `/portfolio-v23` **portfolio landing** page that applies **studioclim.com's exact
mechanics** — grid system, layouts, cards, transitions, hover animations, and video/image
usage — recolored to **TMA's blue brand**. Black canvas + white type retained (true to both
Clim and TMA's dark style). All four Clim motion systems included.

Clim's stack is anime.js + Splitting.js + custom IntersectionObserver + custom drag. This
codebase has **GSAP 3.15 (SplitText, ScrollTrigger, Draggable, InertiaPlugin all present) +
Lenis** — we reproduce the same *behaviour* with those tools.

## Routes & files
- `app/portfolio-v23/page.jsx` — route + metadata + composition
- `components/portfolio-v23/`
  - `v23.css` — scoped under `.v23-page`
  - `V23Cursor.jsx` — magnetic custom cursor (accent blob + frosted "Drag" bubble)
  - `V23Preloader.jsx` — brief monogram/wipe, releases Lenis
  - `V23Hero.jsx` — eyebrow + SplitText line-reveal H1 + full-bleed iris hero video
  - `V23Statement.jsx` — sticky line-reveal intro + rotated-type accent panel + "More information" toggle
  - `V23WorkGrid.jsx` — asymmetric editorial media grid (iris reveals + 0.4s width reflow)
  - `V23Carousel.jsx` — Draggable + Inertia infinite momentum "More Work" carousel
  - `useV23Reveal.js` — small client hook wrapping SplitText + ScrollTrigger reveals
- Reuses: `components/portfolio/SmoothScroll` (Lenis), `components/home/Nav`,
  `components/home/Contact`, `components/home/Footer`, and `PROJECTS` from
  `components/portfolio-v20/projects`.

## Section mapping (Clim → v23)
| Clim section | v23 component | Behaviour |
|---|---|---|
| `case_intro` (hero) | `V23Hero` | eyebrow label + giant SplitText line-reveal title (`y:50%→0%`+opacity, dur .8, ×.8 if >4 lines, `expo.out`, stagger .15); full-bleed autoplay hero video revealed via `clip-path: ellipse(0%→75%)` on load |
| `case_info_st` (intro card) | `V23Statement` | sticky left text column (line reveal); **accent panel** (TMA blue) with one **rotated word**; **"More information"** pill whose `+` morphs to `×` and toggles the grid reflow + a detail block cross-fade |
| `case_info_els` (media grid) | `V23WorkGrid` | flex grid of `.el` cells: `el_1` full-width / `el_2` half-width pairs, **varied aspect ratios** (square/portrait/landscape); **mostly autoplay muted-loop videos + minority images**; each cell **iris-reveals** on scroll (ScrollTrigger); **0.4s `power2.inOut` width reflow** when "More information" is active (full → ~5/12) |
| `case_related` (carousel) | `V23Carousel` | **GSAP Draggable type:"x" + InertiaPlugin**, infinite wrap, rounded-rect video cards (`clip-path: inset(0 round 20px)`), looping **"Drag" pill** hint, frosted **"Drag" cursor bubble** while hovering |
| `foot` | `Contact` + `Footer` | existing components |

## Grid system (faithful port)
```css
.v23-page { --v23-padgut: clamp(20px, 5.6vw, 120px); --v23-gut: clamp(10px, 1.2vw, 24px); }
.v23-grid { width:100%; max-width: calc(100vw - var(--v23-padgut)*2); margin-inline:auto; }
/* cells */
.v23-el        { display:flex; flex-direction:column; align-items:flex-start; }
.v23-el-1      { width:100%; transition:.4s width cubic-bezier(.55,0,.1,1); }
.v23-el-2      { width: calc(50% - var(--v23-gut)*.5); transition:.4s width .4s cubic-bezier(.55,0,.1,1); }
.v23-els.is-open .v23-el-1 { width: calc((100vw - var(--v23-padgut)*2) * .41666 - var(--v23-gut)*2); }
@media (max-width:540px){ .v23-el-2{ width:100%; } }
```
Signature ease `cubic-bezier(.55,0,.1,1)` throughout; durations 0.4–0.45s.

## Motion specs (exact)
- **Line reveal:** `SplitText(el,{type:"lines"})`; per line `y:50%→0%` + `opacity:0→1`,
  `duration: .8 * (lines>4?.8:1)`, `ease:"expo.out"` (Y) / power2 (opacity), `stagger:.15`.
  Fired by ScrollTrigger on enter. Subtitle slides `x:24→0`.
- **Iris media reveal:** CSS var `--mask` 0%→75% animating `clip-path: ellipse(var(--mask) var(--mask) at 50% 50%)`, ScrollTrigger `start:"top 85%"`.
- **Grid reflow:** toggling `.is-open` on `.v23-els` transitions cell widths (CSS transition handles it).
- **Carousel:** `Draggable.create(track,{type:"x", inertia:true, ...})`; infinite via modulo wrap on drag/throa update; cards `flex-shrink:0`; pointer-events off on media; `html.v23-dragging` disables card hits.
- **Magnetic cursor:** dot lerps at 0.22; on `[data-cursor]` hover an **accent blob** (TMA blue, `border-radius:100%`) grows + rotates (`-40°→20°`, `.4s cubic-bezier(.76,0,.24,1)`); over carousel a **frosted blur pill** shows "Drag". Hidden on coarse pointers / reduced-motion.
- **Magnetic buttons:** label translate `(cursorOffset*0.25)` via `--xM/--yM`.
- **TMA-blue nav underline cycle:** 5-item accent cycle in blues (ice `#bfe9ff` / azure `#6fd3ff` / cobalt `#3a86ff` / electric `#2b6bff` / deep `#1746b3`) — applied in v23 scope only (does not alter global Nav elsewhere).

## Video / image usage (mapping to assets)
- **Hero video:** `/assets/videos/hero1.mp4` (or hero2) — eager autoplay, muted, loop, playsInline.
- **Work grid:** projects with a `video` field (`media16`, `voda`, LSC, `media*` etc.) render
  `<video>` (lazy via IntersectionObserver, autoplay when in view); projects without render their
  `hero`/`thumb` image. Target ≈70% video / 30% image to match Clim's video-led feel.
- **Carousel cards:** the production-film projects (those with `video`) as rounded-rect autoplay cards.
- **Autoplay safety:** only play when intersecting + not reduced-motion; pause off-screen.

## Accessibility / fallback
- `prefers-reduced-motion`: no custom cursor, no reveals (content visible at rest), no autoplay,
  static carousel (native scroll). Mirrors v22.
- All videos `muted playsInline`; decorative media `aria-hidden`; cards are real links/buttons.

## Testing
Playwright e2e `playwright/tests/v23-clim.spec.js`, across the standard viewports used by v22:
1. page mounts, no console errors; 2. all five sections present; 3. hero title splits into lines;
4. work-grid cells get the iris reveal (mask grows after scroll); 5. "More information" toggles
`.is-open` (reflow); 6. carousel is draggable (drag changes transform) and wraps; 7. reduced-motion
renders content statically with cursor absent.

## Out of scope (YAGNI)
- SPA page-transition router (Clim's PHP skin system) — Next.js routing handles navigation.
- Clim-style fullscreen nav menu rebuild — reuse existing `Nav`.
- New media production — use existing `/public/assets` videos & imagery.

# Portfolio V22 — Clim-Inspired Design Spec

**Date:** 2026-06-01
**Status:** Approved (design), pending implementation plan
**Route:** `/portfolio-v22`

## 1. Purpose

Build a brand-new single-scroll portfolio page (`V22`) for The Motion Agency,
inspired by the interaction design of [studioclim.com](https://studioclim.com)
but rebuilt with TMA's own brand, content, themes, and fonts. V22 borrows Clim's
*mechanics* — magnetic colored cursor, scroll-scrubbed video, scroll-velocity
marquee, blur/char text reveals, smooth section transitions, drag galleries — and
applies them to a structure that is distinct from the existing v19–v21 pages.

This is **not** a reshuffle of v20. It is a fresh page flow that happens to reuse
the shared project data and a few shared chrome components.

### Source study

A full teardown of studioclim.com informed this spec. Key findings:

- Vite-built vanilla-JS **AJAX SPA**; one `main.js` + `main.css`.
- **Lenis 1.1.13** smooth scroll + **anime.js v4** as the animation engine.
- "ScrollTrigger" replacement: scroll-progress animations authored as a *paused
  anime.js timeline* that is `.seek()`'d to the Lenis scroll position.
- JS↔CSS bridge via **CSS custom properties** (`--prog`, `--x`, `--rotate`, clip).
- Effects: magnetic blend-mode cursor with color-cycling trail; scroll-velocity
  marquee (`playbackRate = 1 + scrollSpeed + mouseVelocity`); Splitting.js
  line/char reveals (blur-in + bounce); scroll-scrubbed `<video>`; Web-Worker
  image preloading; per-section color "skins"; drag galleries.
- No WebGL/canvas — pure DOM + CSS + video.

TMA already ships the equivalent toolset, so we map Clim's anime.js engine onto
**GSAP + ScrollTrigger** (the project's existing animation library) and Clim's
Lenis onto the project's existing Lenis integration.

## 2. Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Visual direction | **TMA-branded** — Clim mechanics in TMA's cool-blue filament identity (option B), not Clim's pure-black rainbow skin. |
| Scope | **Single long-scroll page** with a **brand-new structure**, distinct from v19–v21. |
| Theme | Accent `#6fd3ff` (`--v22-lit`) on a near-black radial-gradient canvas. |
| Fonts | Inter Tight (display), Space Grotesk + JetBrains Mono (labels/eyebrows), Caveat (handwritten accents) — already wired in `app/layout.jsx`. |
| Dependencies | **No new dependencies.** Lenis, GSAP (+ ScrollTrigger, SplitText, Draggable), framer-motion, three are already installed. |

## 3. Page structure

Top-to-bottom, single scroll:

| # | Section | Clim mechanic borrowed |
|---|---|---|
| 0 | **Preloader** | TMA monogram draw-in + 0→100 counter; wipes away to reveal hero (quiet Clim intro; reuses v19 preloader DNA). |
| 1 | **Hero** — "Where strategy meets bold storytelling" | Blur + char-reveal headline; magnetic **"Showreel"** button floating in a scattered **dot-field** (dots tinted in the blue palette); animated logo mark. |
| 2 | **Velocity marquee** | Strip of client names / disciplines ("END-TO-END PRODUCTION · BRAND · EVENTS") whose speed scales with `lenis.velocity` and drifts with the cursor. |
| 3 | **Featured work** (3–5 hero projects) | Large media tiles with hover-play / scroll-scrubbed video, magnetic tilt, **"See Project"** cursor label, per-char title reveals. |
| 4 | **Capabilities — the 3 C's** | Creativity · Collaboration · Craftsmanship (TMA pillars); clip-path reveal + char-stagger on entry; section accent-color skin shift. |
| 5 | **Work archive — drag gallery** | All ~28 projects in a drag-scrollable horizontal rail with a magnetic **"+ Filters"** pill; cursor switches to a "drag" state. |
| 6 | **Impact / numbers** | +35.6% revenue · 32,000+ merchants · $1B valuation — count-up on reveal, scroll-pinned. |
| 7 | **Contact — "Let's Talk" + footer** | Big magnetic CTA; cursor reads "How can we help?". Reuses existing `Contact` + `Footer`. |

Cross-cutting: Lenis smooth scroll, global magnetic cursor, GSAP ScrollTrigger
progress, reduced-motion fallback throughout.

## 4. Architecture

Self-contained folder, mirroring the v20 convention so the version stays isolated
and easy to reason about.

```
app/portfolio-v22/page.jsx          # server component; metadata + section assembly
components/portfolio-v22/
  V22Preloader.jsx
  V22Hero.jsx
  V22DotField.jsx                    # scattered magnetic dot-field behind the Showreel CTA
  V22Cursor.jsx                      # global magnetic blend-mode cursor
  V22Marquee.jsx                     # scroll-velocity marquee
  V22FeaturedWork.jsx
  V22Capabilities.jsx
  V22WorkArchive.jsx                 # GSAP Draggable rail + filters
  V22Impact.jsx                      # count-up stats
  V22ProjectModal.jsx                # adapted from V20ProjectModal
  projects.js                        # re-exports shared roster (single source of truth)
  hooks/useMagnetic.js               # magnetic pull for [data-magnetic] elements
  hooks/useScrubVideo.js             # ties video.currentTime/playback to scroll/velocity
  hooks/useSplitReveal.js            # GSAP SplitText + ScrollTrigger reveal wrapper
  usePrefersReducedMotion.js
  v22.css                            # theme tokens + section styles
```

**Reused as-is:** `components/home/Nav`, `components/home/Contact`,
`components/home/Footer`, `components/portfolio/SmoothScroll`,
`components/shell/ClientShell`.

### Component responsibilities

- **page.jsx** — server component; sets metadata, assembles sections in order,
  imports `v22.css`. Mounts client islands (`V22Cursor`, `V22ProjectModal`,
  `V22Preloader`, `SmoothScroll`) alongside the section components.
- **V22Cursor** — single global cursor element using `mix-blend-mode`. Reads
  `data-cursor="view|drag|sound"` on hovered elements to set its label, and
  applies magnetic pull to `[data-magnetic]`. Disabled on touch / reduced-motion;
  native cursor restored.
- **V22DotField** — renders the scattered dots; each dot is magnetic and tinted
  from a small blue palette. Pure DOM + transforms (no canvas).
- **V22Marquee** — duplicated track translated each RAF tick; speed =
  `base + |lenis.velocity| * k`, plus a small cursor-driven offset.
- **V22FeaturedWork** — tiles from `FEATURED`. Each tile lazy-loads its video
  (`preload="none"`, poster fallback). Default behavior: muted **play-on-hover**
  for grid tiles; the single **lead tile additionally scroll-scrubs** its
  `currentTime` via `useScrubVideo` (Clim's signature effect, used sparingly to
  keep it performant).
- **V22Capabilities** — three pillars; clip-path + char reveals on enter; sets a
  CSS skin variable that shifts the section accent.
- **V22WorkArchive** — horizontal rail of all projects via GSAP Draggable
  (with inertia); a magnetic "+ Filters" pill toggles category filtering.
- **V22Impact** — count-up numbers sourced from the deep case studies; pinned
  via ScrollTrigger.
- **V22ProjectModal** — adapted from `V20ProjectModal`; opened from tiles via a
  small context/store (same pattern as v20's `useProjectDrawer`).

### Data flow

- `components/portfolio-v22/projects.js` re-exports the existing shared
  `PROJECTS` roster (the v20 source of truth) — no copy of project content.
- `FEATURED` = `PROJECTS.filter(p => p.deep)` plus a curated handful of
  high-recognition brands; **archive** = all projects.
- Project selection flows through a small client context: a tile dispatches
  `openProject(slug)`; `V22ProjectModal` subscribes and renders the matching
  project. URL/state handling matches the v20 modal pattern.

### Scroll integration

ScrollTrigger is driven off the existing Lenis instance: on Lenis `scroll`, call
`ScrollTrigger.update()`, and drive Lenis from GSAP's ticker (`gsap.ticker.add`)
so the two share one RAF loop. Velocity-reactive components read `lenis.velocity`.
This wiring lives in / extends `SmoothScroll`.

## 5. Accessibility & reduced motion

`usePrefersReducedMotion` gates motion globally:

- Videos show poster frames; no autoplay/scrub.
- Text reveals snap to final state (no blur/stagger).
- Marquee renders static.
- Custom cursor disabled; native cursor + standard focus rings restored.
- All interactive elements remain real `<a>` / `<button>` with visible focus and
  accessible names; the Showreel and Filters controls are keyboard-operable.

## 6. Testing

Playwright e2e, matching how v19/v20 were verified:

- One smoke spec per section (mounts, key text present, no thrown errors) across
  the standard viewport set.
- A reduced-motion pass asserting fallbacks (static marquee, poster videos,
  cursor off).
- A console-clean assertion (no errors/warnings) on load and after a full scroll.

## 7. Build sequence

1. Scaffold folder + route + `v22.css` theme tokens; wire Lenis↔ScrollTrigger.
2. `V22Cursor` (magnetic, blend-mode, labels, drag state) + `useMagnetic`.
3. `V22Preloader` + `V22Hero` + `V22DotField`.
4. `V22Marquee` (velocity-reactive).
5. `V22FeaturedWork` + `useScrubVideo` + `useSplitReveal`.
6. `V22Capabilities` (clip + char reveals, skin shift).
7. `V22WorkArchive` (Draggable rail + filters).
8. `V22Impact` (count-up, pinned).
9. Wire `V22ProjectModal`, `Contact`, `Footer`, `Nav`, `ClientShell`.
10. Reduced-motion fallbacks + Playwright e2e; console-clean verification.

## 8. Out of scope (YAGNI)

- Multi-route mini-site / AJAX page transitions between routes (V22 is one page).
- Web-Worker image preloader (Clim's optimization; revisit only if perf demands).
- Replacing the global site nav or affecting other portfolio versions.
- New project content or assets beyond the existing shared roster.

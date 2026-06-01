# V22 Showreel — Pinned Orbit Selected-Work Section

**Date:** 2026-06-02
**Status:** Approved (design), pending implementation plan
**Route:** `/portfolio-v22` (replaces the current `V22FeaturedWork` "Selected work" section)

## 1. Purpose

Replace V22's simple "Selected work" tile section with a cinematic, scroll-pinned
sequence that showcases the two flagship case studies — **Foodics (Boundless)**
and **Zid (Ripple)** — one at a time. Each project starts as a single card, then
"produces" its films, which spiral out and settle into a ring around the
shrinking card. Foodics plays first; it then collapses and hands the stage to Zid,
which was hidden behind it.

Keeps V22's established Clim tone (pure black, white light type, white small-caps
labels, single cyan accent), the TMA shell, fonts, and the existing project modal.

## 2. Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Tile media | The exact films V20 assigned to each project (see §3). |
| Arrangement | **Orbit / ring** — films settle evenly around the centered card. |
| Scroll mechanic | **Pinned + scrubbed** (GSAP ScrollTrigger, reversible). |
| Foodics→Zid handoff | **Foodics clears, then Zid takes the stage** (one project on stage at a time). |
| Engine | GSAP `ScrollTrigger` pinned master timeline, scrubbed by scroll. No new deps. |
| Component | New `V22Showreel` replaces `V22FeaturedWork` in the page. |

## 3. Content (from V20 `V20FeaturedWork.jsx`)

Card posters are the home-page case PNGs.

**Foodics — card `/assets/case-foodics-boundless.png` — 7 films:**

| # | Title | Group label | Kind | Source |
|---|---|---|---|---|
| 1 | Boundless 2022 | Event Film | youtube | `ZqrF7NYuXHU` |
| 2 | Boundless 2023 | Event Film | youtube | `uzd9os9G1d8` |
| 3 | Café Spot | TV Commercial | mp4 | `/assets/videos/media1.mp4` (poster `posters/media1.jpg`) |
| 4 | Living-Room Spot | TV Commercial | mp4 | `/assets/videos/media5.mp4` (poster `posters/media5.jpg`) |
| 5 | Self-Order Kiosk | Product Film | mp4 | `/assets/videos/media6.mp4` (poster `posters/media6.jpg`) |
| 6 | POS + Printer | Product Film | mp4 | `/assets/videos/media22.mp4` (poster `posters/media22.jpg`) |
| 7 | App — New Version | Product Film | mp4 | `/assets/videos/hero1.mp4` (poster `posters/hero1.jpg`) |

**Zid — card `/assets/case-zid-ripple.png` — 2 films:**

| # | Title | Group label | Kind | Source |
|---|---|---|---|---|
| 1 | Ripple 2024 | Event Film | youtube | `GSSS71zV5HI` |
| 2 | Strategy Film | Brand Film | mp4 | `/assets/videos/Zid%20-%20Strategy.MP4` (poster `posters/Zid---Strategy.jpg`) |

This content (cards + film arrays) lives in a new module
`components/portfolio-v22/showreel.js` (so the component stays presentational).
A film's "tile face" is always its **poster image** during motion; YouTube films
use the poster + a play badge. (If a poster is missing, the tile shows a solid
`--v22-panel` panel with the title — no broken image.)

## 4. Choreography (scrubbed by scroll progress 0 → 1)

The section pins for a scroll distance of **~5.5 viewport-heights** (`end: "+=550%"`,
tunable). Progress `p` (0–1) drives one master timeline. Phase boundaries:

| Phase | p range | What animates |
|---|---|---|
| 0 · Intro | 0.00–0.12 | Two **portrait** cards (Foodics left, Zid right), centered with a gap, each with a caption below. Both fade/rise in. |
| 1 · Morph + stack | 0.12–0.24 | Both cards tween from portrait → **landscape**; Zid translates to center and drops **behind** Foodics (lower z, slightly scaled down, dimmed). |
| 2 · Foodics fan-out | 0.24–0.46 | Foodics card scales down toward center; its **7 film tiles** animate from behind the card (scale 0.6, opacity 0, at card center) out to **precomputed ring positions**, staggered, each with its title+group label fading in as it "takes its place." |
| 3 · Foodics hold | 0.46–0.54 | Composed orbit holds. Settled mp4 tiles autoplay muted-loop; youtube tiles show play badge. (Hold = timeline has no movement across this range, so scrolling feels like a beat.) |
| 4 · Collapse + handoff | 0.54–0.66 | Foodics tiles retract to card center (reverse of fan-out) and fade; Foodics card shrinks + fades out, revealing the Zid card beneath. |
| 5 · Zid emerge + fan-out | 0.66–0.92 | Zid card moves from its stacked position **down to center**, scales up to "lead" size, then fans its **2 tiles** into the ring (same motion as Foodics). |
| 6 · Zid hold + release | 0.92–1.00 | Zid orbit holds briefly; then the section unpins and the page continues to Capabilities. |

**Ring geometry:** for N tiles, tile `i` sits at angle `θ_i = -90° + i·(360°/N)` on an
ellipse of radius `(rx, ry)` sized to the viewport (`rx ≈ 34vw`, `ry ≈ 32vh`), so
tiles frame the centered card. Tile size shrinks slightly with N (Foodics 7 tiles
smaller than Zid's 2). Positions are computed in JS from the viewport on mount and
on resize; the timeline animates `x/y/scale/opacity` to those targets.

**Reversibility:** because it's a single scrubbed timeline, scrolling up rewinds
every phase exactly.

## 5. Interactivity (settled state only)

- Hovering a settled **mp4** tile plays it (muted); leaving pauses. Clicking it opens
  the film in a lightweight **film lightbox** (mp4 `<video controls>` centered on a
  scrim, Escape/scrim to close) — a small addition local to this section.
- Clicking a **youtube** tile opens the same lightbox with a privacy-friendly
  `youtube-nocookie.com/embed/<id>` iframe.
- Clicking the **center card** opens the existing `V22ProjectModal` for that project
  (`openProject(slug)`), reusing the store from Task 4 of the prior build.
- During motion (not in a hold) tiles are not interactive (pointer-events off) to
  avoid mis-clicks mid-scrub.

## 6. Reduced motion & mobile/touch fallback

No pin, no scrub. The section renders a **static stacked gallery**:
for each project — the card (landscape) + its title, followed by a simple
responsive **grid of its film tiles** (poster + title + group label), each tile
keeping the same click-to-lightbox / modal behavior. This is what
`(prefers-reduced-motion: reduce)` **or** `(pointer: coarse)` / viewport < 860px
gets. It is fully usable, has no pinned scroll, and is what the e2e mobile
viewports assert against.

## 7. Architecture

```
components/portfolio-v22/
  showreel.js            # data: SHOWREEL = [{slug, client, title, poster, films:[...]}]
  V22Showreel.jsx        # the section: pinned timeline (desktop) / static gallery (fallback)
  V22FilmLightbox.jsx    # shared mp4/youtube lightbox + its own tiny store (useFilmLightbox.js)
  useFilmLightbox.js     # external store (mirrors useProjectModal pattern)
  hooks/useOrbitTimeline.js  # builds the GSAP pinned master timeline from refs + ring geometry
  v22.css                # APPEND showreel + lightbox styles
app/portfolio-v22/page.jsx   # swap <V22FeaturedWork/> → <V22Showreel/>; mount <V22FilmLightbox/>
```

- `V22FeaturedWork.jsx` and `playwright/tests/v22-featured.spec.js` are **removed**
  (superseded). A new `playwright/tests/v22-showreel.spec.js` covers the new section.
- The `V22Showreel` section root **keeps `id="v22-featured"`** so the hero's
  "Watch the reel" anchor and the existing `v22-assembly.spec.js` (`#v22-featured`
  visible) both continue to work. It also carries `className="v22-section v22-showreel"`.
- `useOrbitTimeline` owns all GSAP/ScrollTrigger setup and teardown (one place to
  reason about the pin + scrub; killed on unmount). The component stays declarative:
  it renders refs (cards, tiles) and calls the hook.
- Ring positions computed in a pure helper `ringPositions(count, viewport)` inside
  `useOrbitTimeline` (testable independent of the DOM).

## 8. Testing (Playwright, repo convention)

`playwright/tests/v22-showreel.spec.js`:
- **Desktop (laptop-1440):** section mounts (`.v22-showreel`); both cards present;
  it pins (scrolling within the section keeps the stage in view while progress
  advances — assert the pinned stage stays visible across a scroll step, and that
  Foodics' tiles reach `opacity:1`/in-ring after scrolling into Phase 2); clicking
  a settled tile opens `[role="dialog"]` (the film lightbox); Escape closes it.
- **Reduced motion (`emulateMedia reduce`):** no pin; the static gallery shows all
  Foodics + Zid tiles in the DOM (count ≥ 9), each with a title; lightbox still opens.
- **Mobile-375 / tablet-768:** static fallback renders, all tiles present, no thrown
  errors.
- **Console-clean:** extend/keep `v22-console.spec.js` green (no errors on load +
  full scroll through the pinned section).
- Full `v22-` suite stays green across mobile-375, tablet-768, laptop-1440,
  desktop-1920.

## 9. Out of scope (YAGNI)

- No new video files; reuse the exact V20 sources.
- No autoplay of YouTube during the orbit (badge only; plays in lightbox on click).
- No per-tile scroll-scrubbed playback (tiles are posters in motion; the prior
  `useScrubVideo` lead-tile behavior goes away with `V22FeaturedWork`).
- The other V22 sections (hero, marquee, capabilities, archive, impact, preloader)
  are unchanged.

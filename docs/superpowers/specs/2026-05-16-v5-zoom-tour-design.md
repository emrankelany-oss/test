# V5 Zoom-Tour — scroll-driven "dive into each featured project" sequence

**Date:** 2026-05-16
**Status:** Approved (design) — pending spec review
**Scope:** `/portfolio-v5`, a new section after the featured-work grid. First **2** projects only this round.

## Goal

After the deck→grid Layout-C featured section lands, continued scrolling runs
a pinned, scroll-scrubbed "tour": the Layout-C grid is the persistent home;
the focused project's image **lifts out of its exact grid slot** to a
full-bleed view with a curated case panel, then **settles back into the same
slot**, then the next project does the same. Reads as "diving into the
project, reading it, pulling back out, on to the next."

This round: projects **01 Foodics — Boundless** and **02 Zid — Ripple 2024**
(the first two in the Layout-C order — slot 0 and slot 1). Built to extend to
the remaining projects in a later round.

## Confirmed decisions

- Sequence per project: **grid home → image scales up out of its slot →
  full-bleed image + curated content panel (held) → image scales back down
  into the same slot → grid whole again → next project**. All scrubbed by
  scroll (no clicks, no autoplay).
- The Layout-C grid (all 5 cards) is the persistent backdrop/home of the
  tour. While one card is "out", the other four stay in their slots, dimmed.
- Content per project = **curated short version**, real copy lifted/condensed
  from the existing case pages (no new authoring, no placeholders).
- Panel sits on the **right** over the full-bleed image (per approved
  storyboard v2).
- Tech: **port to the project's stack** — JSX + plain CSS in `globals.css`.
  No Tailwind, no TypeScript, no shadcn, no `@/lib/utils`. `framer-motion`
  (^12, already used by `V5Card`) and `lenis` (^1.3, already global via
  `SmoothScroll`) are reused — **no new npm dependencies**, and **no second
  Lenis** and **no GSAP/ScrollTrigger** (avoids any pin conflict with
  `V5Stage`).
- **Zero changes to `V5Stage.jsx` or its GSAP** — fully isolated new section.
- Mobile (≤720px): gentler zoom, panel stacks below the image; same
  sequence.

## Architecture

New isolated component + data + CSS, wired into the page after `V5Stage`.

### Files

| File | Responsibility |
|---|---|
| `tma-web/data/featured-zoom.js` (new) | The 2 curated project entries (data only). |
| `tma-web/components/portfolio-v5/V5ZoomTour.jsx` (new) | The pinned scroll-scrubbed tour: grid replica home + per-project lift/return + content panel. |
| `tma-web/app/globals.css` (modify) | New `.v5-zt-*` rules; reuse the existing Layout-C grid template for the replica. |
| `tma-web/app/portfolio-v5/page.jsx` (modify) | Render `<V5ZoomTour/>` after `<V5Stage/>`, before `<V5OurWork/>`. |

### Mechanic

- A tall scroll container (height ≈ `(N*2 + 1) * 100vh`, N = number of
  projects = 2 → ~`500vh`) wrapping a `position: sticky; top:0; height:100vh`
  stage. This is the same sticky-scroll technique as the source
  `ZoomParallax` (no GSAP pin needed).
- `framer-motion` `useScroll({ target: containerRef, offset: ['start
  start','end end'] })` → `scrollYProgress` 0..1.
- The stage renders a **replica of the Layout-C grid**: 5 image tiles using
  the **existing** `.v5-grid-inner` 12×6 template and the existing
  `.v5-grid-slot[data-slot-index=N]` placements (reused, scoped under
  `.v5-zt-grid`), so slot geometry matches the real grid exactly. Tiles show
  the 5 featured images (`featuredWork.slice(0,5)` image fields). Only slots 0
  and 1 are "active" (have a tour segment) this round; tiles 2–4 are static
  context.
- `scrollYProgress` (0..1) is split into **equal per-project segments**:
  with 2 projects, project 1 owns `[0, 0.5]`, project 2 owns `[0.5, 1.0]`.
  The fractions below (0.30 / 0.70) are **within each project's own
  segment** (i.e. local progress = `(scrollYProgress - segStart) /
  segLength`). For project *i* (slot rect measured at runtime via
  `getBoundingClientRect`, recomputed on resize — same pattern used by the
  preloader fly and `V5Stage.compute()`):
  - **lift (segment start → 0.30):** the focused tile's image element
    interpolates a `transform: translate()+scale()` from its slot rect to
    cover the full viewport; other tiles fade to ~0.25 opacity.
  - **hold (0.30 → 0.70):** image stays full-bleed; the curated panel
    (`opacity`/`y`) eases in on the right.
  - **return (0.70 → 1.0):** panel eases out; image interpolates the same
    transform back into its exact slot rect; other tiles fade back to 1.
  - Segments are sequential, so project 2 begins lifting only after project
    1 has fully returned.
- Transform math mirrors existing repo code (preloader `fly()` /
  `V5Stage.compute()`): measure slot center & size vs viewport, derive
  `--scale`/translate; `transform-origin: center`. Deterministic, recomputed
  on resize.

### Data — `tma-web/data/featured-zoom.js`

Array of 2 entries (real copy condensed from `/case/foodics-boundless` and
`/case/zid-ripple`):

```
[
  {
    id: "foodics-boundless", slotIndex: 0, num: "01",
    client: "Foodics", project: "Boundless 22 · 23",
    image: "/assets/case-foodics-boundless.png",
    headline: "Launching what’s next for F&B.",
    intro: "Two flagship product events that turned the stage into a launchpad. We unveiled Foodics Pay, Capital, and the Marketplace — and reframed Foodics from POS provider to the growth engine of F&B across the GCC.",
    metrics: [
      { v: "+35.6%", l: "YoY revenue ’24" },
      { v: "32K+",   l: "Active merchants" },
      { v: "35%",    l: "KSA market share" },
      { v: "$1B",    l: "Unicorn valuation" },
    ],
    quote: "TMA didn’t deliver an event. They delivered the moment Foodics stopped being a POS company and started being a platform.",
    quoteBy: "Senior leadership, Foodics",
    href: "/case/foodics-boundless",
  },
  {
    id: "zid-ripple", slotIndex: 1, num: "02",
    client: "Zid", project: "Ripple 2024",
    image: "/assets/case-zid-ripple.png",
    headline: "Launching the Total Commerce era.",
    intro: "A flagship moment in Diriyah for 1,000+ merchants. We unveiled Zid’s unified Total Commerce platform — e-commerce, social, in-store, and cross-border — and rewired how the region thinks about merchant growth.",
    metrics: [
      { v: "+200%", l: "YoY growth" },
      { v: "12K+",  l: "Active merchants" },
      { v: "+50%",  l: "Basket size lift" },
      { v: "1K+",   l: "Merchants on-site" },
    ],
    quote: "Ripple wasn’t an event — it was the moment our merchants understood what we’d actually become.",
    quoteBy: "Senior leadership, Zid",
    href: "/case/zid-ripple",
  },
]
```

### Panel contents (per project, right side, over the full-bleed image)

`num` + `client` · `project` (mono kicker) → `headline` → `intro` → 4
`metrics` (value + label) → `quote` + `quoteBy` → "View full case" link to
`href` (normal `<Link>`; opens the real case page).

## Out of scope

- Projects 3–5 (next round).
- Any change to `V5Stage`, the deck→grid animation, the preloader, or the
  case pages themselves.
- New case copy — only condensed reuse of existing case content.
- Tailwind/TypeScript/shadcn setup.

## Risks / mitigations

- **Slot-rect measurement** depends on the replica grid being laid out
  before scroll math runs → measure in `useLayoutEffect`, recompute on
  resize (existing repo pattern).
- **Transition from V5Stage's grid into the tour's replica grid:** V5Stage's
  grid scrolls away when its pin ends; the tour opens on its own identical
  replica. Acceptable for this round; a seamless hand-off can be a later
  polish item (noted, not built now).
- **Scroll length:** ~500vh added; verify the page total feels right and
  "Our Work"/footer still reachable.

## Verification

On the dev server (`/portfolio-v5`), after the preloader and the deck→grid:
1. Scrolling past the grid pins the tour (sticky stage holds for its scroll
   length).
2. Project 1 image lifts from slot 0 → full-bleed; panel shows the exact
   Foodics curated content (4 metrics `+35.6% / 32K+ / 35% / $1B`, quote,
   working "View full case" → `/case/foodics-boundless`).
3. Continued scroll returns project 1 into slot 0; grid whole; other cards
   un-dim.
4. Project 2 lifts from slot 1 → full-bleed; Zid panel (`+200% / 12K+ /
   +50% / 1K+`, quote, link `/case/zid-ripple`); returns to slot 1.
5. Scrolling out continues to "Our Work"; no console errors;
   `prefers-reduced-motion` degrades to simple fades (no large zoom).
6. `V5Stage` deck→grid behavior unchanged; no second Lenis; no GSAP added.

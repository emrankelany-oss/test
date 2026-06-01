# V21 — "The Continuum" Full Redesign

**Date:** 2026-06-01
**Target:** `/portfolio-v21` only (V20 stays untouched as the stable fallback)
**Status:** Design approved; phased implementation plans pending

---

## Problem

V21 reads as **compacted and non-premium**: sections butt together with no breathing room, dense grids, tight type, snappy reveals, and `100vh` boxing (see audit in the brainstorm). The atmosphere/comet pass added connection but not comfort. The agency wants a **full redesign** that feels **gentle, premium, comfortable, and like one soul** — not a respacing of the old layout.

## Goal & principles

A single, continuous, **calm** scroll experience — "The Continuum" — that lets the **work carry it** with minimal copy and maximum craft:

- **One soul, connected** — the existing filament spine + atmosphere bloom + comet + flow-field thread the entire page as one line of light.
- **Gentle & comfortable** — generous spacing, one focal idea per screen, weighted Lenis scroll, slow luxurious reveals. Never cramped.
- **Premium through craft, not copy** — cinematic full-bleed media, oversized editorial type, depth/parallax, grain, custom cursor, hover-to-play, slow transitions. Minimal words.
- **Pacing: hybrid set-pieces** — calm flowing scroll is the backbone; a few deliberate slow **pinned** moments provide impact.

## Structure (top → bottom)

`SmoothScroll · Atmosphere · Filament(+comet) · FlowField · Nav` then:

1. **Hero (Identity)** — type-first editorial.
2. **Featured** — a few standout works, large & cinematic.
3. **Gallery** — a separate section: the full set of works, browsable.
4. **Contact** — calm closing.
5. **Footer.**

Generous `--space-act` gaps separate these. (No verbose storytelling, manifesto copy, before→after, case-study text, or capabilities blocks — explicitly cut per direction.)

---

## Foundations

### Spacing & rhythm tokens (the core "comfort" fix)
CSS custom properties drive the whole page:
- `--space-act: clamp(180px, 20vw, 320px)` — the large breath **between** sections.
- `--space-block: clamp(72px, 9vw, 140px)` — within a section, between beats.
- `--gutter: clamp(24px, 6vw, 120px)` — side padding; content never hugs edges.
- `--measure: min(1280px, 92vw)` — max content width.
- Sections are sized by content + margins; **drop `min-height:100vh` boxing** except the deliberate hero/pinned set-pieces.
- One focal idea per viewport.

### Calm scroll (Lenis)
Tune the existing `SmoothScroll`/Lenis to a weighted premium feel: `lerp ≈ 0.08`, `duration ≈ 1.3`, single shared RAF with the GSAP ticker, `lagSmoothing(0)`, native touch. (If the current SmoothScroll already mounts Lenis, adjust its options; do not add a second instance.)

### Type system
- **Display:** an editorial serif (Fraunces or the project's existing display serif) for headlines + a grotesk (Space Grotesk / Inter Tight) for UI/meta.
- Loosened for comfort: display `letter-spacing: -0.01em`, headings `line-height: ~1.0–1.12`, body `1.6`, meta mono uppercase `letter-spacing: 0.18–0.22em`.
- Big, confident, airy.

### Color / atmosphere
Matte near-black canvas (`#060708`), cool cyan accent (`#6fd3ff`), soft white ink. The `V21Atmosphere` bloom (palette C) persists; a faint **grain** overlay adds material richness. Atmosphere warms slightly at Contact.

### The soul (reused, threaded across the new layout)
`V21Atmosphere`, `V21Filament` (+ comet), `V21FlowField` carry over and span the new sections so the journey is literally one connected line of light. The filament's wipe/draw anchors update to the new section title elements.

---

## Section designs

### 1. Hero (Identity) — type-first editorial
- Near-black, minimal nav (wordmark left, calm menu right).
- Oversized headline in display serif (e.g. "Where strategy meets **bold** storytelling", accent word in cyan), revealed **line-by-line** (mask + slow rise, blur→0).
- The **showreel as a framed inset** (not full-bleed) — muted autoplay, play affordance, subtle scale on hover; click opens full reel.
- Meta row (mono): showreel year, est., locations; a gentle scroll cue.
- Filament begins here; comet rides in.
- This is one of the calm, spacious screens — not pinned.

### 2. Featured — standout works, cinematic
- A small set (≈3) of flagship works (Foodics, Zid, + one) as **large full-bleed cinematic tiles**, **one per breath** (generous `--space-block` between), each near-full-width.
- Each tile: cover media (poster image → **hover/scroll plays the cut**, slow `0.9s` crossfade), an **oversized serif title overlapping the media** with a soft scrim, and a **minimal caption** (client · sector · year). No body copy.
- Premium devices: slow scale-in on scroll reveal, **parallax depth** on the media (scrub), hover zoom, custom-cursor "play/▶" state over media.
- A quiet, reused **"MOTION MATTERS" filament beat** sits as a pinned divider just before Featured (reuses the existing verified set-piece + flow-field, reinforcing the soul) — kept minimal so it reads as a calm breath, not added density. The first featured tile also scales up gently as it enters.

### 3. Gallery — the full works, separate section
- A distinct section with its own calm header ("The work" / "Gallery").
- The **full set of works**, browsable and **crafted** (not a flat dense grid). **Default: an airy 2-up editorial grid** with generous gaps (`--space-block`) and a staggered/parallax vertical offset between columns; a horizontal **drag-reel** is the considered alternative we'll visually confirm at the start of Phase 3. Gentle reveal-on-scroll, hover zoom, custom cursor; click opens the existing project modal/drawer.
- Big gaps, restrained columns — the opposite of today's tight 3-up wall.

### 4. Contact — calm closing
- Generous space, one confident line ("Let's build bold stories."), email / CTA, socials. Atmosphere warms slightly; the filament/comet resolve.
- Reuse the existing `Contact`/`Footer` where it fits the calm tone, restyled to the system.

---

## Motion system (GSAP + Lenis)

- **One reveal grammar everywhere:** `blur(8px)→0 + y:32→0 + opacity`, `ease: power3.out`, `duration 0.9–1.3s`, stagger `0.08–0.12`, trigger `top 82%`, one-shot (`toggleActions: play`). Slow and gentle.
- **Parallax:** scrubbed (`scrub: 2.5`) on media/background layers; symmetric formula, GPU transforms only.
- **Pinned set-pieces (few):** the reel/hero moment and the "MOTION MATTERS" beat; soft pin handoffs (`anticipatePin: 1`).
- **Custom cursor:** a small lerp-followed dot that grows to a "▶" over playable media and a label over links — a key premium cue.
- **Velocity-reactive soul:** the comet/atmosphere already react to `--atmo-vel`; the new sections inherit this.
- All ScrollTriggers created in a `gsap.context()` and reverted on unmount.

## Reduced motion
`prefers-reduced-motion: reduce` → no Lenis smoothing, no parallax/pins, no comet, static atmosphere, media shows poster only, content fully visible. Calm still page. (Follows the existing soul modules' reduced paths.)

## Component architecture (clean-sheet, V21 only)
- `app/portfolio-v21/page.jsx` — recomposed to the new structure.
- **New:** `V21Hero.jsx` (replaces existing), `V21Featured.jsx` (+ `V21FeaturedItem.jsx`), `V21Gallery.jsx`, `V21Cursor.jsx` (custom cursor), and a tokens/base block in `v21.css`.
- **Reused:** `V21Atmosphere`, `V21Filament` (+comet), `V21FlowField`, `SmoothScroll`, `Nav`, project modal/drawer, `Contact`, `Footer`, `projects.js`, `mmGlyphs.js`, hooks.
- **Retired from the page (files kept on disk):** old `V21FeaturedWork`, `V21OurWork`, `V21MotionMatters` (its set-piece may be reused), `V21Preloader` (kept), `V21Hero` (replaced).
- V20 files untouched.

## Phased delivery (each phase = its own plan, build, review)
- **Phase 1 — Foundation + Hero:** spacing/token system, calm Lenis tuning, type system, grain, custom cursor, scroll-spine wiring to the new layout, and the type-first Hero. Working, testable slice.
- **Phase 2 — Featured:** the cinematic featured works (full-bleed, hover-to-play, parallax, big type), plus the optional "MOTION MATTERS" pinned divider.
- **Phase 3 — Gallery + Contact + polish:** the gallery section (final layout chosen with a visual check), the calm contact close, atmosphere warm, and a full-page pacing/polish pass.

## Testing (per phase, Playwright e2e across the 6 viewports)
- Structure/mount, spacing tokens applied (generous gaps present), reduced-motion fallback, no console errors across a full scroll, custom cursor present (and absent/!pointer on touch/reduced), hover-to-play toggles media, gentle-reveal elements reach final state, and V20 remains unchanged (no `portfolio-v20` diffs).

## Success criteria
- The page feels **calm, spacious, and premium** — never compacted; one focal idea per screen with large breaths between.
- It reads as **one connected soul** (filament/atmosphere/comet) end to end.
- Work is the hero; copy is minimal.
- 60fps; reduced-motion correct; no console errors; V20 untouched.

# V12 — "Launch Sequence" Cinematic Portfolio — Design

**Date:** 2026-05-15
**Status:** Approved (pending written-spec review)
**Codename:** V12
**Route:** `/portfolio-v12` (new parallel route; existing `/portfolio` keeps rendering v11)

---

## 1. Goal

A premium, immersive, scroll-driven "Launch Sequence" cinematic for **The Motion Agency** — an Awwwards-caliber digital launch experience, not a conventional portfolio. The scroll is the narrative engine: it evolves like a film (mysterious → acceleration → emotional climax).

All projects, copy, stats, logos, and contact details are the **real** material from the agency's Google Slides deck, captured verbatim in auto-memory `tma_portfolio_deck.md`. **No invented projects or marketing copy.**

## 2. Locked Scoping Decisions

| Decision | Choice |
|---|---|
| Featured-project depth | Foodics + Zid get full arcs (Intro/Challenge/Transformation/Impact from deck). Burger King, Salasa, LSC, InvoiceQ get lighter single-beat chapters (real frame + one real positioning line, **no invented Challenge/Impact**). Remaining ~35 brands appear in the Motion Reel. |
| Rendering | **Hybrid.** GSAP + Lenis + Framer Motion drive all scroll choreography. Exactly **one** R3F scene (Section 3 ecosystem). Opening + atmosphere use a 2D Canvas particle field + CSS. No other WebGL. |
| Opening asset | **Generative only** — Canvas particles + CSS smoke/gradients + kinetic type. No video, no frame sequence. |
| Sound | Opt-in cinematic audio via Howler. Mute toggle **defaults OFF** (no autoplay). |
| Routing | New parallel route `/portfolio-v12`, components in `components/portfolio-v12/`. `/portfolio` unchanged. |
| Scroll architecture | **Approach B** — isolated section modules, each owning its own ScrollTrigger, unified by a shared `LaunchSequenceContext` progress/phase that drives a global escalating atmosphere layer. |

## 3. Architecture

Mirrors the existing `portfolio-vN` pattern.

```
app/portfolio-v12/page.jsx          # metadata + <V12ClientRoot/>
components/portfolio-v12/
  V12ClientRoot.jsx                 # 'use client' root; Lenis + context provider
  V12Experience.jsx                 # composes the 9 sections in order
  LaunchSequenceContext.jsx         # shared scroll progress (0->1) + derived phase
  useLaunchScroll.js                # Lenis <-> GSAP ScrollTrigger wiring + rAF
  AtmosphereLayer.jsx               # fixed full-viewport 2D Canvas particles + CSS glow
  AudioController.jsx               # Howler bed + whooshes; mute toggle (default OFF)
  HUD.jsx                           # fixed minimal altitude/velocity telemetry
  sections/
    01-OpeningSequence.jsx
    02-Philosophy.jsx
    03-Ecosystem.jsx                # the single R3F scene
    04-FeaturedProjects.jsx         # orchestrates project chapters
    ProjectChapter.jsx              # reusable: deep vs mid variant
    05-MotionReel.jsx
    06-BehindTheMotion.jsx
    07-SocialProof.jsx
    08-Climax.jsx
    09-FinalCTA.jsx
  v12.css                           # scoped tokens + section styles
data/portfolio-v12.js               # single source of truth, all real deck content
```

### Shared infrastructure (the continuity thread)

- **`LaunchSequenceContext`** — holds `progress` (0→1 over the whole page) and derived `phase`:
  - `ignition` 0–0.15 · `liftoff` 0.15–0.35 · `ascent` 0.35–0.7 · `orbit` 0.7–0.88 · `climax` 0.88–1.
  - One page-level ScrollTrigger updates it. Sections/global layers subscribe via a selector hook to avoid re-render storms. `phase` derivation is a **pure function** (unit-tested).
- **`AtmosphereLayer`** — one fixed 2D Canvas ember/particle field + CSS radial-gradient glow + vignette. Particle count, drift speed, glow hue, and vignette interpolate off `phase` so the background literally accelerates and heats up while descending. This is the glue that makes isolated sections read as one continuous launch.
- **`HUD`** — tiny corner telemetry ("ALT 00.0 KM / VEL ↑") ticking with progress. Transform-only, GPU-cheap.
- **`AudioController`** — Howler ambient bed + phase-keyed transition whooshes; starts muted; fixed-corner toggle.
- **`data/portfolio-v12.js`** — positioning manifesto, the 4 stats, Foodics & Zid full arcs, the 4 mid projects, client roster, contact — all lifted verbatim from deck memory.

**Data flow (one-way):** `useLaunchScroll` → `LaunchSequenceContext` → (atmosphere, HUD, audio, sections). Each section also owns its **own** local ScrollTrigger for internal choreography, so it is independently tunable and testable.

## 4. The 9 Sections

Every string/image originates from deck memory.

1. **Opening Sequence** (`ignition`) — Black, faint upward ember particles, low rumble (if unmuted). Masked kinetic reveal: **"We don't build brands."** → beat → **"We launch them."** Subhead: *"A creative powerhouse with offices in Amman and Riyadh."* Slow zoom + igniting scroll cue.
2. **The Philosophy** (`liftoff`) — Pinned. Giant sequential statements with scale+blur swaps, derived from the Slide 3 manifesto: **"Motion creates emotion." → "Emotion creates memory." → "We don't just create campaigns — we become an extension of your team."** Particles tilt into upward streaks.
3. **The Ecosystem** (`ascent` start) — *The single R3F scene.* Glowing TMA core; 8 real service nodes orbit in 3D (Brand Strategy, Brand Design, Go-to-Market, Growth Marketing, Event & Experience, Product Marketing, Social & Community, Content Studio). Auto-orbit + pointer parallax; scroll pulls camera through. Hover/tap surfaces the real one-line service description. Mobile/reduced-motion → static CSS-orbit fallback.
4. **Featured Projects** (`ascent`) — `ProjectChapter.jsx` sequence:
   - **FOODICS** (deep): fullscreen `case-foodics-boundless.png` reveal → pinned scrub: Intro → Challenge (perceived as just POS) → Transformation (Boundless stage, end-to-end narratives) → Impact (animated counters: $15.4M→$20.8M, 8,000→32,000+, 35% market share, $1B unicorn). Purple `#4E008E` wash.
   - **ZID / RIPPLE 2024** (deep): `case-zid-ripple.png`, same structure, real copy (fragmented systems → Total Commerce → 200% growth, 30%+ merchants, 50% basket/conversion, 25% GMV). Teal wash.
   - **BURGER KING, SALASA, LSC, INVOICEQ** (mid): each a single pinned beat — fullscreen real `slide-*.jpg` + one real positioning line + the deck's factual hook. No invented Challenge/Impact.
5. **Motion Reel** (`ascent`→`orbit`) — Rapid-cut full-bleed slices of real campaign slides (Burger King "Royal Taste", Foodics Vancouver, LG, Almarai, Electrolux, …) + kinetic type flashes + logo strobes, scroll-scrubbed. The remaining ~35 brands live here as a trailer, not a grid.
6. **Behind the Motion** (`orbit`) — Horizontal scroll-pinned filmstrip: Strategy → Design → Production → Animation & Post, using real Animation/Production keyframes (slides 47, 50, 54, 55, 56, 57) + concise process copy.
7. **Social Proof** (`orbit`) — **No fake testimonials** (deck has none). Floating, parallaxed client-logo cards from the 24 real logos on a dark field + one large manifesto pull-quote from Slide 3. Stats band: 178% growth · 30+ clients · 500+ businesses created · **29+ years combined experience** (safe phrasing for the flagged ambiguous stat).
8. **The Climax** (`climax`) — Pure typography, max scale, peak particles: **"The future belongs to brands that move." → "Static brands disappear."** Audio silence beat then swell.
9. **Final CTA** — **"Ready for liftoff?"** Primary button **INITIATE PROJECT** → `mailto:info@themotionagency.net`. Footer: real Amman + Riyadh addresses, phones, themotionagency.net.

## 5. Motion & Visual System

**Color tokens** (scoped in `v12.css`):
`--v12-black:#050506` · `--v12-graphite:#111114` · `--v12-silver:#9aa0a8` · `--v12-white:#f4f5f7` · `--v12-blue:#2e6bff` · `--v12-glow:#ff6a1a`. Per-chapter brand washes (Foodics `#4E008E`, Zid teal, …) as low-opacity overlays only.

**Typography:** Display = Clash Display (Space Grotesk fallback); body/HUD = Space Grotesk. Self-hosted via `next/font/local` (no CDN). Fluid `clamp()`, headlines up to ~14vw.

**Motion language:** single shared `--ease-launch` cubic-bezier (slow-in/fast-out). Section seams cross-fade atmosphere intensity via `LaunchSequenceContext` so isolated modules read continuous. All scroll-bound animation via GSAP ScrollTrigger + Lenis; no scroll-jacking; native scroll preserved.

**Performance budget (hard requirement):**
- Atmosphere = single 2D Canvas, capped particle count, clamped `devicePixelRatio`, paused via `IntersectionObserver`/`document.hidden`.
- One R3F canvas only (Section 3), lazy-mounted via `next/dynamic` + `IntersectionObserver`, unmounted off-screen, `frameloop="demand"`.
- Images via `next/image`, responsive sizes, lazy except opening; reuse existing 42 slide JPGs (not regenerated).
- Transform/opacity-only animation; no layout thrash. Target 60fps desktop, graceful mid-range.
- Every section code-split; heavy R3F + reel chunks load on approach.

**Accessibility & fallbacks:**
- `prefers-reduced-motion`: disables scrub/parallax/particles; R3F → static image; content becomes clean readable scroll. Nothing gated behind motion.
- Keyboard: focusable nodes/CTA, skip-to-content link, semantic per-section headings.
- Audio strictly opt-in (default muted).
- Mobile: simplified atmosphere, R3F → CSS orbit, reduced particle counts, tap instead of hover.

## 6. Content Integrity Rules

- Source of truth = deck memory `tma_portfolio_deck.md`. No invented copy/projects/numbers.
- **No testimonials** section (deck has none) — replaced by manifesto pull-quote + logo field.
- "Social Media & Community Building" service: do **not** reuse the deck's GTM-duplicated blurb — use a concise fresh one-liner consistent with deck voice.
- Stat "EMPLOYEES 29+" → rendered as **"29+ years combined experience"** (deck-flagged ambiguity).
- Deck title-bar typos (Zid slides mislabeled "Foodics Boundless"; stray "Canvas Templates" line) are **not** carried over.

## 7. Testing & Verification

1. **Data integrity (test-first):** assert Foodics/Zid arc strings + stat numbers match deck; no placeholder/lorem; every referenced asset path exists on disk; flagged caveats handled.
2. **Component/structure:** `phase` pure-function boundary tests; each section renders without throwing from the data module; exactly 9 sections in order; reduced-motion keeps content in DOM with effects disabled.
3. **Build & lint gate:** `next build` clean; no console errors. **Before writing route/font/dynamic-import code, read the relevant guide in `node_modules/next/dist/docs/`** (per repo AGENTS.md — this Next version has breaking changes).
4. **Playwright visual + behavior smoke:** scroll 0→100%, screenshot at each phase boundary for visual review; assert opening type at top, Foodics/Zid Impact counters reached, CTA mailto present, no horizontal overflow, perf-trace sanity (no long-task storm); mobile viewport pass (CSS orbit, no overflow).
5. **Definition of done:** data tests green · build clean · reduced-motion verified · Playwright phase screenshots captured & visually reviewed by user · no console errors desktop+mobile.

## 8. Out of Scope (YAGNI)

- No CMS / dynamic data — static `data/portfolio-v12.js`.
- No video assets (deck has none; not sourcing externally for v1).
- No real testimonials (none exist; not soliciting for v1).
- Not promoting `/portfolio` to V12 (parallel route only).
- No i18n/Arabic mirror (Arabic strings shown as authentic campaign artifacts within images only).

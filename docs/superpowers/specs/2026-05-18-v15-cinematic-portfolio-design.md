# V15 — Cinematic Immersive Portfolio — Design Spec

**Date:** 2026-05-18
**Status:** Approved (pending written-spec review)
**Owner:** The Motion Agency web

## 1. Purpose

Build a brand-new immersive scrolling portfolio page, **V15**, for The Motion
Agency: a cinematic, motion-led, editorial single-page journey. It is the
"heart of the experience" — atmospheric hero, a scroll-controlled featured
project scale gallery, a cinematic text bridge, a spatial 3D project library,
and a premium final CTA. The page must feel like one continuous film, never a
template or a section stack.

This is a self-contained build. It does **not** reuse the v12/v14 scene engine
and does **not** follow the `portfolio-vN` route convention — it lives at
`/v15` per the originating brief.

## 2. Locked Decisions

These were resolved with the user during brainstorming and are fixed:

1. **Stack:** TypeScript + Tailwind (literal spec), not the repo's
   JSX/vanilla-CSS convention. Route is `/app/v15/page.tsx`.
2. **Hero background:** React Three Fiber (R3F) atmospheric scene — fog +
   depth particles + slow electric-blue volumetric light.
3. **Engine:** Standalone V15 scroll engine. No coupling to v14
   `SceneController`/`useScene`.
4. **Content:** Real Foodics + Zid cases mapped from `tma-web/data/portfolio-v12.js`;
   remaining featured + library slots are clearly-named placeholders with a
   single easily-swappable data array.
5. **Featured gallery control model:** **Model A — scroll is the master
   timeline.** Scroll position is the single source of truth; arrows and
   autoplay tween the page via `lenis.scrollTo()` so all inputs flow through
   the same timeline (no index/scroll desync).

## 3. Repository Context

- Next.js App Router app lives under `tma-web/`. Repo root holds `docs/`.
- Project is otherwise **JavaScript-only** (`.jsx`), vanilla CSS + CSS vars,
  no Tailwind, no `tsconfig.json`. TypeScript and Tailwind are introduced
  **additively and scoped to V15** so existing portfolio pages are untouched.
- Installed deps (from `tma-web/package.json`): `next ^16.2.4`,
  `react ^19.2.5`, `gsap ^3.15.0`, `lenis ^1.3.23`,
  `framer-motion ^12.38.0`, `three ^0.169.0`, `@react-three/fiber ^9.6.1`,
  `@react-three/drei ^10.7.7`.
- Proven Lenis+GSAP wiring exists in
  `tma-web/components/portfolio/SmoothScroll.jsx` (RAF → `lenis.raf(t*1000)`,
  `gsap.ticker.lagSmoothing(0)`, `ScrollTrigger.update` on Lenis scroll). V15
  re-implements this pattern as a typed hook.
- Real case data source: `tma-web/data/portfolio-v12.js` → `deepCases`
  (`foodics`, `zid`) with `client`, `project`, `wash`, `cover`, `intro`,
  `challenge[]`, `transformation[]`, `impact[]`).

## 4. Stack Integration Details

### 4.1 TypeScript (additive)
- Add `tma-web/tsconfig.json` (Next.js default, `strict: true`,
  `paths: { "@/*": ["./*"] }` matching existing `@/` alias) and
  `tma-web/next-env.d.ts`.
- Add devDeps: `typescript`, `@types/react`, `@types/react-dom`,
  `@types/node`, `@types/three`.
- Existing `.jsx` pages keep working — Next compiles JS and TS side by side.

### 4.2 Tailwind v4 (scoped, preflight OFF)
- Add `tailwindcss`, `@tailwindcss/postcss`, `postcss`.
- **Preflight (Tailwind global base reset) is disabled** to prevent it
  bleeding into the heavy vanilla-CSS portfolio pages. A scoped reset is
  written manually under `.v15-root`.
- Tailwind directives + `@theme` tokens live in a V15-only stylesheet
  (`tma-web/app/v15/v15.css`) imported **only** from `tma-web/app/v15/layout.tsx`.
- PostCSS config: if a repo-wide `postcss.config.*` does not already exist,
  add one enabling `@tailwindcss/postcss`. Tailwind utilities are opt-in by
  class name, so other routes that never use those classes are unaffected;
  the only global risk (preflight) is eliminated by disabling it.
- **Verification gate:** after adding Tailwind, load an existing page
  (e.g. `/portfolio-v14`) and confirm zero visual regression before
  continuing. If preflight isolation proves leaky, fall back to scoping all
  Tailwind under a `@layer` wrapped in `.v15-root &` and document it.

### 4.3 Fonts
- `tma-web/app/v15/layout.tsx` loads `Space_Grotesk` + `Inter` via
  `next/font/google`, exposed as CSS vars (`--font-space-grotesk`,
  `--font-inter`) scoped to the V15 subtree. Does not modify root
  `app/layout.jsx`.

### 4.4 Design tokens (V15 `@theme`)
`matte-black #050506`, `graphite #0e0f12` / `#16181d`, soft-white `#f4f5f7`,
electric-blue accent `#4BB7FF`, plus grain opacity, blur scale, and
cinematic spacing scale. Per-project `accentColor` overrides the blue where
specified in data.

## 5. Component Architecture

```
tma-web/app/v15/
  layout.tsx                  fonts + v15.css (scoped Tailwind), .v15-root wrapper
  page.tsx                    metadata + <V15Experience/>
  v15.css                     Tailwind directives, @theme tokens, scoped reset, grain

tma-web/components/v15/
  V15Experience.tsx           Lenis provider, section orchestration, ScrollTrigger.refresh
  V15Hero.tsx                 hero shell, title reveal, scroll indicator, pin-out
  hero/AtmosphereScene.tsx    R3F canvas: fog, instanced particles, blue light, vignette
  FeaturedProjectScaleGallery.tsx
  CinematicTextSection.tsx
  ProjectLibrary3DGrid.tsx
  ProjectModal.tsx
  V15CTA.tsx
  engine/
    LenisProvider.tsx         creates one Lenis, context exposes lenisRef + scrollTo
    useV15Lenis.ts            RAF/ticker wiring, lagSmoothing(0), ScrollTrigger.update
    usePinnedTimeline.ts      typed ScrollTrigger pin+scrub helper; gsap.context cleanup
    useReducedMotion.ts       matchMedia('(prefers-reduced-motion: reduce)')
    useMagnetic.ts            cursor-follow magnetic transform (pointer-fine only)
  data/
    projects.ts               typed FeaturedProject/LibraryProject arrays + helpers
```

### 5.1 Data layer (`data/projects.ts`)

```ts
export interface FeaturedProject {
  id: string;
  title: string;
  category: string;        // e.g. "Brand Film / Social Campaign"
  year: string;
  description: string;     // short cinematic story
  services: string[];
  image: string;           // /projects/*.jpg or real /assets/*.png
  accentColor: string;     // hex; overrides --v15-accent
  href: string;            // "View Case" target (contact anchor / placeholder)
}

export interface LibraryProject {
  id: string;
  title: string;
  category: string;
  year: string;
  tag: string;
  image: string;
  size?: 'sm' | 'md' | 'lg'; // editorial rhythm
}

export const featuredProjects: FeaturedProject[]; // 5 items
export const libraryProjects: LibraryProject[];   // 18 items
export function getProjectImage(src: string): string; // fallback to gradient data-URI
```

- **Foodics** and **Zid** entries are derived from `deepCases` in
  `tma-web/data/portfolio-v12.js` (cover → `image`, `wash`/brand → `accentColor`,
  `intro` → `description`, derived `services`/`category`/`year`). Both appear
  in `featuredProjects`; both also appear in `libraryProjects`.
- Remaining 3 featured + 16 library entries are placeholders referencing
  `/projects/placeholder-NN.jpg`. `getProjectImage()` returns a deterministic
  CSS-gradient `data:` URI if the file is absent so nothing renders broken.
- Counts: **5 featured**, **18 library** (locked with user).

## 6. Section Specifications

Each section defines: layout, scroll behavior, animation, mobile, and
reduced-motion / no-WebGL fallback. All GSAP work is wrapped in
`gsap.context()` and reverted on unmount.

### 6.1 V15Hero + AtmosphereScene

- **Layout:** 100vh. R3F `<Canvas>` at z0; CSS grain + radial blue glow
  overlay at z1; nav + headline stack at z2.
- **R3F scene:** dark exponential fog; ~600 instanced points drifting on a
  slow noise field; one soft electric-blue point/volumetric light orbiting a
  slow Lissajous path; vignette via post or radial gradient overlay.
  `dpr={[1, 1.5]}` cap; pause render when hero scrolled out of view.
- **Mouse parallax:** pointer → damped (lerp) tilt of particle group and a
  subtle CSS translate of the headline. Disabled on touch.
- **Load reveal (GSAP, on mount, after fonts):** background fades/scales in;
  then line-by-line mask reveal of `THE MOTION AGENCY`; then
  `SELECTED WORKS IN MOTION`; then supporting line
  `A cinematic archive of brands, campaigns, and stories built to move.`;
  then scroll indicator.
- **Scroll-out (pinned, scrubbed):** hero scales `1 → 1.08`, opacity → 0,
  blur → 8px, handing off into the gallery with no hard cut.
- **Fallback (reduced-motion OR no WebGL):** no canvas; static layered
  matte-black→graphite radial gradient + grain; text appears immediately;
  no parallax; no scroll scale.

### 6.2 FeaturedProjectScaleGallery (Model A)

- **Structure:** outer section pinned for `(N + 1) * 100vh`
  (`N = featuredProjects.length`). One master GSAP timeline with
  `scrub: true` bound to a `ScrollTrigger`. Timeline progress →
  `activeFloat ∈ [0, N-1]`.
- **Per-card stack (perspective z-stack):**
  - Active card: scale → near-fullscreen, image inner-zoom `1 → 1.15`,
    overlay gradient opacity `0 → 1`, slight perspective tilt
    (`rotateX/Y` a few deg), info reveal line-by-line tied to local
    progress: `title → category → description → services → year → "View Case"`.
  - Neighbor cards: scale down, `blur(4–8px)`, depth offset (translateZ /
    translateX) with parallax differing per ring.
- **Arrows + autoplay:** prev/next buttons and a 4s autoplay interval call
  `lenisRef.scrollTo(anchorScrollForIndex(i), { duration })`. They never set
  React index directly — scroll position drives index via the timeline, so
  there is exactly one source of truth.
- **Autoplay rules:** pauses on manual wheel/drag/arrow/hover; resumes after
  ~3s idle; cleared on unmount.
- **"View Case":** links to `project.href` (contact anchor / placeholder
  route — no new case-study pages built; locked with user).
- **Mobile (≤768 or coarse pointer):** pin distance shortened; depth stack
  flattened to a vertical snap-scrubbed sequence; autoplay off; blur reduced;
  arrows still work via `scrollTo`.
- **Reduced-motion:** static stacked cards at rest state; arrows perform
  instant `scrollTo` with `duration: 0`; no scrub, zoom, or blur.

### 6.3 CinematicTextSection (bridge)

- **Layout:** pinned, matte-black, centered, no images/cards. Soft blue
  ambient glow element behind text, slow breathing scale/opacity.
- **Copy (3 couplets, exact):**
  1. `WE DON'T SHOW PROJECTS.` / `WE REVEAL MOMENTUM.`
  2. `EVERY BRAND HAS A BEFORE.` / `OUR WORK IS THE AFTER.`
  3. `MOTION IS NOT DECORATION.` / `IT IS THE MEMORY ENGINE.`
- **Animation:** labeled GSAP timeline, scrubbed. Each line transitions
  `blur(8px)→0` + y-rise + opacity `0→1`; once passed, dims to ~0.25 and
  recedes slightly (translateZ/scale). Smooth pin-release into grid.
- **Reduced-motion:** all lines visible, statically stacked, no blur/scrub.

### 6.4 ProjectLibrary3DGrid + ProjectModal

- **Layout:** `perspective` container, `transform-style: preserve-3d`.
  18 cards, slight `size` variation (sm/md/lg) for editorial rhythm.
- **Enter:** cards animate from `translateZ(-400px)` + opacity 0 into place,
  staggered (ScrollTrigger batch).
- **Scroll parallax:** rows assigned differing `yPercent` scrub speeds.
- **Hover (pointer-fine):** hovered card `translateZ` forward + scale 1.05 +
  sharpen, image inner-zoom, title/category/year/tag overlay reveals;
  siblings dim to opacity ~0.5; magnetic cursor-follow via `useMagnetic`.
- **Click → ProjectModal:** cinematic scale-in over backdrop blur;
  focus-trapped; closes on ESC, scrim click, or close button; restores
  focus and scroll on close. In-page only — no routing.
- **Exit:** grid recedes into depth (opacity + translateZ back) as section
  scrolls out.
- **Mobile/touch:** flat 2-column grid, no 3D/hover/magnetism; tap opens
  modal. **Reduced-motion:** static grid, no enter/parallax/hover.

### 6.5 V15CTA

- **Layout:** dark; slow-shifting radial electric-blue ambient glow;
  optional sparse particles (CSS/canvas, lightweight, off on mobile).
- **Copy:** headline `READY TO MOVE YOUR BRAND?`; supporting line
  `Let's build the next story people remember.`; button `START A PROJECT`.
- **Animation:** on scroll-in section rises from depth (translateZ/opacity);
  headline reveals **word-by-word** (GSAP); supporting line fades; blue glow
  pulses behind the button; button is **magnetic** (Framer Motion spring).
  Page settles calmly afterward — no residual motion.
- **Button target:** existing contact route/anchor (no new page). Magnetism
  disabled on touch / reduced-motion.

## 7. Performance & Accessibility

- All card imagery via `next/image`, lazy, with blur placeholder.
- Animate only `transform`, `opacity`, `filter`. Never `width/height/top/left`.
- `ScrollTrigger.refresh()` after webfonts ready and after hero canvas
  mounts; debounced resize refresh.
- Every GSAP effect created inside `gsap.context(scope)` and reverted on
  unmount; all ScrollTriggers killed; autoplay interval cleared; R3F canvas
  and geometries/materials disposed on unmount; single shared Lenis
  instance destroyed on unmount.
- `prefers-reduced-motion` and no-WebGL code paths defined for **every**
  section (specified per-section above).
- Particle count, blur radius, and parallax intensity reduced on
  small/touch viewports. R3F `dpr` capped; render paused off-screen.
- No layout thrash: read/measure before write in scroll handlers; use
  ScrollTrigger callbacks, not manual scroll listeners.

## 8. Out of Scope (YAGNI)

- No CMS / data fetching. No real case-study detail pages ("View Case" and
  "START A PROJECT" link to existing contact anchor or placeholder hrefs).
- No analytics, no i18n, no backend/API changes.
- Modal is in-page only (no route).
- No changes to root `app/layout.jsx`, `globals.css`, or any existing
  portfolio page. Tailwind/TS are additive and V15-scoped.

## 9. Testing & Verification

- **Build:** `npm run build` (or project build script) under `tma-web/`
  succeeds with the new `.tsx` + Tailwind toolchain.
- **Regression gate:** `/portfolio-v14` (and `/`) render with zero visual
  change after TS + scoped-Tailwind introduction — verified in browser
  before V15 sections are considered done.
- **V15 functional checks (Playwright / manual):**
  - Hero text reveals in order; reduced-motion shows static hero, no canvas.
  - Featured gallery: scrolling advances active card; arrows and autoplay
    move scroll and stay in sync (no desync after rapid input); autoplay
    pauses on interaction and resumes after idle.
  - Text bridge reveals all three couplets in order.
  - Library: cards enter from depth; hover pop-out works on pointer-fine;
    modal opens/closes with ESC and scrim; mobile shows flat grid.
  - CTA headline reveals word-by-word; magnetic button responds; reduced
    motion disables magnetism.
  - `prefers-reduced-motion: reduce` emulation: no scrubbed/transform
    animations run; page fully usable and readable.
- No console errors; no GSAP/ScrollTrigger leak warnings on route change;
  no broken images (gradient fallback covers missing placeholders).

## 10. Build Sequence (for the implementation plan)

1. TS + scoped Tailwind toolchain + regression gate.
2. V15 route shell, layout, fonts, tokens, Lenis provider + engine hooks.
3. `data/projects.ts` with real Foodics/Zid mapping + placeholders.
4. V15Hero + AtmosphereScene (+ fallbacks).
5. FeaturedProjectScaleGallery (Model A) (+ mobile/reduced-motion).
6. CinematicTextSection.
7. ProjectLibrary3DGrid + ProjectModal.
8. V15CTA.
9. Performance/a11y pass + full verification.

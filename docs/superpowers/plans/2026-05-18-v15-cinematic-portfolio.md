# V15 Cinematic Immersive Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, cinematic, scroll-led portfolio page at `/v15` for The Motion Agency, with an R3F atmospheric hero, a scroll-master featured scale gallery, a text bridge, a 3D project library, and a magnetic CTA.

**Architecture:** Self-contained TypeScript + scoped Tailwind v4 page under `tma-web/app/v15/`. One shared Lenis instance drives GSAP ScrollTrigger (RAF→ticker, `lagSmoothing(0)`). Pure logic (project data, gallery index/scroll math) is extracted into framework-free modules with `node --test` unit coverage; animation/interaction is verified with Playwright e2e (the v14 precedent). No coupling to the v14 scene engine; no changes to existing pages.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 (preflight off, scoped), GSAP 3 + ScrollTrigger, Lenis 1.3, Framer Motion 12, three 0.169 + @react-three/fiber 9 + drei 10. Tests: `node:test` (unit, via `tsx`), `@playwright/test` (e2e).

**Reference spec:** `docs/superpowers/specs/2026-05-18-v15-cinematic-portfolio-design.md`

**Working dir for all commands:** `tma-web/` (the Next app). All `git` commands run from repo root or `tma-web/` — paths below are repo-relative; prefix with `tma-web/` where shown.

---

## File Structure

**Created:**
- `tma-web/tsconfig.json` — TS config (additive; coexists with existing `.jsx`)
- `tma-web/next-env.d.ts` — Next TS ambient types
- `tma-web/postcss.config.mjs` — enables `@tailwindcss/postcss`
- `tma-web/app/v15/v15.css` — Tailwind directives + `@theme` tokens + scoped reset + grain (imported only by v15 layout)
- `tma-web/app/v15/layout.tsx` — fonts + `v15.css` + `.v15-root` wrapper + metadata
- `tma-web/app/v15/page.tsx` — renders `<V15Experience/>`
- `tma-web/components/v15/engine/lenis-context.ts` — typed Lenis context
- `tma-web/components/v15/engine/LenisProvider.tsx` — single Lenis + GSAP wiring
- `tma-web/components/v15/engine/useReducedMotion.ts`
- `tma-web/components/v15/engine/usePinnedTimeline.ts`
- `tma-web/components/v15/engine/useMagnetic.ts`
- `tma-web/components/v15/engine/galleryMath.ts` — pure scroll↔index math
- `tma-web/components/v15/data/projects.ts` — typed featured/library data + helpers
- `tma-web/components/v15/V15Experience.tsx` — section orchestration
- `tma-web/components/v15/V15Hero.tsx`
- `tma-web/components/v15/hero/AtmosphereScene.tsx`
- `tma-web/components/v15/FeaturedProjectScaleGallery.tsx`
- `tma-web/components/v15/CinematicTextSection.tsx`
- `tma-web/components/v15/ProjectLibrary3DGrid.tsx`
- `tma-web/components/v15/ProjectModal.tsx`
- `tma-web/components/v15/V15CTA.tsx`
- `tma-web/test/v15-data.test.mjs` — unit (data integrity)
- `tma-web/test/v15-galleryMath.test.mjs` — unit (gallery math)
- `tma-web/playwright/tests/v15-smoke.spec.js`
- `tma-web/playwright/tests/v15-gallery.spec.js`
- `tma-web/playwright/tests/v15-sections.spec.js`
- `tma-web/playwright/tests/v15-reduced-motion.spec.js`

**Modified:**
- `tma-web/package.json` — add devDeps + `test:v15` script (existing `test` script untouched)

**Untouched (verify zero regression):** `tma-web/app/layout.jsx`, `tma-web/app/globals.css`, every `tma-web/app/portfolio-v*/` route.

---

## Conventions for every task

- Run all `npm`/`node`/`npx` commands from `tma-web/`.
- Unit tests are `.mjs` in `tma-web/test/`, run via the new `test:v15` script (uses `tsx` so `.ts` imports work without changing the existing `npm test`).
- Playwright specs go in `tma-web/playwright/tests/`. Run them against a local server:
  - Terminal A: `npm run dev` (serves `http://localhost:3000`)
  - Terminal B: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/<spec> --project=desktop-1920`
  - (PowerShell: `$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npx playwright test ...`)
- Commit after every task with the exact message shown.
- `@/` resolves to `tma-web/` (existing alias; mirrored into `tsconfig.json`).

---

## Task 1: TypeScript + scoped Tailwind toolchain + regression gate

**Files:**
- Create: `tma-web/tsconfig.json`, `tma-web/next-env.d.ts`, `tma-web/postcss.config.mjs`
- Modify: `tma-web/package.json`

- [ ] **Step 1: Install dependencies**

```bash
npm install -D typescript @types/react @types/react-dom @types/node @types/three tailwindcss @tailwindcss/postcss postcss tsx
```

Expected: installs succeed; `package.json` devDependencies now include those packages.

- [ ] **Step 2: Add the isolated v15 unit-test script**

Edit `tma-web/package.json` `"scripts"` — add ONE line, leave `"test"` unchanged:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --test test/**/*.test.mjs",
    "test:v15": "node --import tsx --test test/v15-*.test.mjs",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Create `tma-web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `tma-web/next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

- [ ] **Step 5: Create `tma-web/postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

- [ ] **Step 6: Regression gate — existing pages unaffected**

Run: `npm run build`
Expected: build SUCCEEDS. (`postcss.config.mjs` is present but no file imports Tailwind yet, so existing pages get no Tailwind base/preflight. TS config is additive.)

Then in two terminals:
- A: `npm run dev`
- B: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/smoke.spec.js --project=desktop-1920`

Expected: existing smoke tests PASS (no regression on existing routes).

- [ ] **Step 7: Commit**

```bash
git add tma-web/tsconfig.json tma-web/next-env.d.ts tma-web/postcss.config.mjs tma-web/package.json tma-web/package-lock.json
git commit -m "build(v15): add scoped TS + Tailwind v4 toolchain (additive, no regression)"
```

---

## Task 2: Pure gallery math module + unit tests

This is the heart of Model A: scroll progress is the single source of truth. These pure functions map between scroll progress, the floating active index, and per-card scroll anchors. No DOM, no React — fully unit-testable.

**Files:**
- Create: `tma-web/components/v15/engine/galleryMath.ts`
- Test: `tma-web/test/v15-galleryMath.test.mjs`

- [ ] **Step 1: Write the failing test**

`tma-web/test/v15-galleryMath.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  progressToActiveFloat,
  activeIndexFromFloat,
  anchorProgressForIndex,
  cardLocalProgress,
  clamp01,
} from "../components/v15/engine/galleryMath.ts";

test("clamp01 bounds", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(0.5), 0.5);
  assert.equal(clamp01(2), 1);
});

test("progressToActiveFloat maps 0..1 across N cards", () => {
  // 5 cards => float range 0..4
  assert.equal(progressToActiveFloat(0, 5), 0);
  assert.equal(progressToActiveFloat(1, 5), 4);
  assert.equal(progressToActiveFloat(0.5, 5), 2);
});

test("activeIndexFromFloat rounds and clamps", () => {
  assert.equal(activeIndexFromFloat(0, 5), 0);
  assert.equal(activeIndexFromFloat(2.4, 5), 2);
  assert.equal(activeIndexFromFloat(2.6, 5), 3);
  assert.equal(activeIndexFromFloat(99, 5), 4);
  assert.equal(activeIndexFromFloat(-1, 5), 0);
});

test("anchorProgressForIndex is inverse of progressToActiveFloat", () => {
  for (const i of [0, 1, 2, 3, 4]) {
    const p = anchorProgressForIndex(i, 5);
    assert.equal(activeIndexFromFloat(progressToActiveFloat(p, 5), 5), i);
  }
  assert.equal(anchorProgressForIndex(0, 5), 0);
  assert.equal(anchorProgressForIndex(4, 5), 1);
});

test("cardLocalProgress is 1 at own index, 0 one card away, clamped", () => {
  assert.equal(cardLocalProgress(2, 2.0), 1);
  assert.equal(cardLocalProgress(2, 1.0), 0);
  assert.equal(cardLocalProgress(2, 3.0), 0);
  assert.equal(cardLocalProgress(2, 2.5), 0.5);
  assert.equal(cardLocalProgress(2, 10), 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:v15`
Expected: FAIL — cannot find module `galleryMath.ts`.

- [ ] **Step 3: Implement `tma-web/components/v15/engine/galleryMath.ts`**

```ts
/**
 * Pure math for the scroll-master featured gallery (Model A).
 * Scroll progress (0..1 over the pinned section) is the single source of truth.
 */

export function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Scroll progress 0..1 -> floating active index in [0, count-1]. */
export function progressToActiveFloat(progress: number, count: number): number {
  if (count <= 1) return 0;
  return clamp01(progress) * (count - 1);
}

/** Floating index -> nearest real card index, clamped to [0, count-1]. */
export function activeIndexFromFloat(float: number, count: number): number {
  if (count <= 0) return 0;
  const i = Math.round(float);
  if (i < 0) return 0;
  if (i > count - 1) return count - 1;
  return i;
}

/** Scroll progress 0..1 at which a given card index is exactly active. */
export function anchorProgressForIndex(index: number, count: number): number {
  if (count <= 1) return 0;
  return clamp01(index / (count - 1));
}

/**
 * Per-card local emphasis: 1 when float === index, fading linearly to 0
 * one card-step away in either direction. Drives scale/zoom/text reveal.
 */
export function cardLocalProgress(index: number, float: number): number {
  const d = Math.abs(float - index);
  return d >= 1 ? 0 : 1 - d;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:v15`
Expected: PASS — all `v15-galleryMath` tests green.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/v15/engine/galleryMath.ts tma-web/test/v15-galleryMath.test.mjs
git commit -m "feat(v15): pure scroll<->index gallery math + unit tests"
```

---

## Task 3: Project data layer + unit tests

Real Foodics/Zid mapped from `tma-web/data/portfolio-v12.js` (`deepCases`), plus placeholders. Pure data + a missing-image fallback helper.

**Files:**
- Create: `tma-web/components/v15/data/projects.ts`
- Test: `tma-web/test/v15-data.test.mjs`
- Read for reference: `tma-web/data/portfolio-v12.js` (do not modify)

- [ ] **Step 1: Confirm the real-data source shape**

Run: `node -e "const m=require('./data/portfolio-v12.js'); const c=m.deepCases.find(x=>x.id==='foodics'); console.log(Object.keys(c)); console.log(c.cover, '|', c.client)"`
Expected: prints keys including `id, client, project, wash, cover, intro, challenge, transformation, impact` and a `/assets/...png` cover path. Use the printed `cover`/`client` values in Step 3 (Foodics/Zid). If a field name differs, adjust Step 3 to match the printed keys.

- [ ] **Step 2: Write the failing test**

`tma-web/test/v15-data.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  featuredProjects,
  libraryProjects,
  getProjectImage,
} from "../components/v15/data/projects.ts";

test("featured has exactly 5 projects with required fields", () => {
  assert.equal(featuredProjects.length, 5);
  for (const p of featuredProjects) {
    for (const k of ["id", "title", "category", "year", "description", "services", "image", "accentColor", "href"]) {
      assert.ok(p[k] !== undefined && p[k] !== "", `featured.${p.id} missing ${k}`);
    }
    assert.ok(Array.isArray(p.services) && p.services.length > 0);
    assert.match(p.accentColor, /^#[0-9a-fA-F]{6}$/);
  }
});

test("library has exactly 18 projects with required fields", () => {
  assert.equal(libraryProjects.length, 18);
  for (const p of libraryProjects) {
    for (const k of ["id", "title", "category", "year", "tag", "image"]) {
      assert.ok(p[k] !== undefined && p[k] !== "", `library.${p.id} missing ${k}`);
    }
  }
});

test("real Foodics and Zid are wired into featured and library", () => {
  const fIds = featuredProjects.map((p) => p.id);
  assert.ok(fIds.includes("foodics"));
  assert.ok(fIds.includes("zid"));
  const foodics = featuredProjects.find((p) => p.id === "foodics");
  assert.ok(foodics.image.startsWith("/assets/"));
  const lIds = libraryProjects.map((p) => p.id);
  assert.ok(lIds.includes("foodics"));
  assert.ok(lIds.includes("zid"));
});

test("unique ids within each collection", () => {
  assert.equal(new Set(featuredProjects.map((p) => p.id)).size, 5);
  assert.equal(new Set(libraryProjects.map((p) => p.id)).size, 18);
});

test("getProjectImage returns real path unchanged, gradient data-URI for placeholder", () => {
  assert.equal(getProjectImage("/assets/case-foodics-boundless.png"), "/assets/case-foodics-boundless.png");
  const ph = getProjectImage("/projects/placeholder-03.jpg");
  assert.ok(ph.startsWith("data:image/svg+xml") || ph === "/projects/placeholder-03.jpg");
});
```

- [ ] **Step 3: Implement `tma-web/components/v15/data/projects.ts`**

Use the real `cover` paths printed in Step 1 (the values below match the repo's known assets `/assets/case-foodics-boundless.png` and `/assets/case-zid-ripple.png`; replace if Step 1 printed different paths).

```ts
export interface FeaturedProject {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  services: string[];
  image: string;
  accentColor: string;
  href: string;
}

export interface LibraryProject {
  id: string;
  title: string;
  category: string;
  year: string;
  tag: string;
  image: string;
  size?: "sm" | "md" | "lg";
}

const CONTACT_ANCHOR = "/#contact";

export const featuredProjects: FeaturedProject[] = [
  {
    id: "foodics",
    title: "Foodics — Boundless",
    category: "Brand Platform / Flagship Event",
    year: "2023",
    description:
      "We shaped Foodics' brand reputation and built Boundless — a flagship annual stage that turned a POS provider into the F&B growth platform.",
    services: ["Strategy", "Creative Direction", "Motion", "Production"],
    image: "/assets/case-foodics-boundless.png",
    accentColor: "#74D1EA",
    href: CONTACT_ANCHOR,
  },
  {
    id: "zid",
    title: "Zid — Ripple",
    category: "Brand Film / Launch Campaign",
    year: "2023",
    description:
      "Launching the Total Commerce era for Zid with Ripple — a cinematic identity moment that moved merchants and market alike.",
    services: ["Strategy", "Creative Direction", "Motion", "Film"],
    image: "/assets/case-zid-ripple.png",
    accentColor: "#9B8CFF",
    href: CONTACT_ANCHOR,
  },
  {
    id: "aurora-systems",
    title: "Aurora Systems — Signal",
    category: "Product Film / Social Campaign",
    year: "2025",
    description:
      "A cinematic product narrative built to make a complex platform feel inevitable, fluid, and human.",
    services: ["Concept", "Art Direction", "3D / Motion", "Sound"],
    image: "/projects/placeholder-01.jpg",
    accentColor: "#4BB7FF",
    href: CONTACT_ANCHOR,
  },
  {
    id: "monolith-studio",
    title: "Monolith — Origin",
    category: "Brand Film / Identity",
    year: "2024",
    description:
      "An origin film for a design studio: restrained, monumental, and built around a single recurring motif of momentum.",
    services: ["Brand Strategy", "Creative Direction", "Motion"],
    image: "/projects/placeholder-02.jpg",
    accentColor: "#FF8A5B",
    href: CONTACT_ANCHOR,
  },
  {
    id: "halcyon-labs",
    title: "Halcyon Labs — Drift",
    category: "Campaign / Series",
    year: "2025",
    description:
      "A serialized campaign engineered for momentum across channels — each cut a continuation, never a repeat.",
    services: ["Campaign Strategy", "Motion", "Production"],
    image: "/projects/placeholder-03.jpg",
    accentColor: "#5BE0B0",
    href: CONTACT_ANCHOR,
  },
];

const PLACEHOLDER_TAGS = ["Motion", "Film", "Campaign", "Identity", "3D", "Social"];
const PLACEHOLDER_CATS = [
  "Brand Film",
  "Social Campaign",
  "Product Film",
  "Identity System",
  "Title Sequence",
  "Launch Film",
];
const SIZES: Array<LibraryProject["size"]> = ["md", "sm", "lg", "md", "sm", "lg"];

function makePlaceholders(start: number, count: number): LibraryProject[] {
  return Array.from({ length: count }, (_, k) => {
    const n = start + k;
    return {
      id: `lib-${String(n).padStart(2, "0")}`,
      title: `Selected Work ${String(n).padStart(2, "0")}`,
      category: PLACEHOLDER_CATS[n % PLACEHOLDER_CATS.length],
      year: `${2023 + (n % 3)}`,
      tag: PLACEHOLDER_TAGS[n % PLACEHOLDER_TAGS.length],
      image: `/projects/placeholder-${String(n).padStart(2, "0")}.jpg`,
      size: SIZES[n % SIZES.length],
    };
  });
}

export const libraryProjects: LibraryProject[] = [
  {
    id: "foodics",
    title: "Foodics — Boundless",
    category: "Brand Platform",
    year: "2023",
    tag: "Event",
    image: "/assets/case-foodics-boundless.png",
    size: "lg",
  },
  {
    id: "zid",
    title: "Zid — Ripple",
    category: "Brand Film",
    year: "2023",
    tag: "Film",
    image: "/assets/case-zid-ripple.png",
    size: "lg",
  },
  ...makePlaceholders(1, 16),
];

/**
 * Returns the source path for real assets; for missing placeholder paths
 * returns a deterministic inline SVG gradient so nothing renders broken.
 * Real assets under /assets are always returned unchanged.
 */
export function getProjectImage(src: string): string {
  if (src.startsWith("/assets/")) return src;
  // Placeholder: derive a stable hue from the filename.
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0' stop-color='hsl(${h} 45% 12%)'/>
<stop offset='1' stop-color='hsl(${(h + 40) % 360} 60% 22%)'/>
</linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/>
<circle cx='${300 + (h % 600)}' cy='400' r='220' fill='hsl(${(h + 200) % 360} 70% 55% / 0.18)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:v15`
Expected: PASS — both `v15-data` and `v15-galleryMath` suites green.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/v15/data/projects.ts tma-web/test/v15-data.test.mjs
git commit -m "feat(v15): typed project data (real Foodics/Zid + placeholders) + unit tests"
```

---

## Task 4: Lenis provider + engine hooks

Single Lenis instance wired to the GSAP ticker (mirrors the proven `tma-web/components/portfolio/SmoothScroll.jsx` pattern), exposed via context so the gallery can drive scroll. Plus reduced-motion, pinned-timeline, and magnetic hooks.

**Files:**
- Create: `tma-web/components/v15/engine/lenis-context.ts`, `LenisProvider.tsx`, `useReducedMotion.ts`, `usePinnedTimeline.ts`, `useMagnetic.ts`

- [ ] **Step 1: `tma-web/components/v15/engine/useReducedMotion.ts`**

```ts
"use client";
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: `tma-web/components/v15/engine/lenis-context.ts`**

```ts
"use client";
import { createContext, useContext } from "react";
import type Lenis from "lenis";

export const LenisContext = createContext<{ lenis: Lenis | null }>({ lenis: null });

export function useLenis(): Lenis | null {
  return useContext(LenisContext).lenis;
}
```

- [ ] **Step 3: `tma-web/components/v15/engine/LenisProvider.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LenisContext } from "./lenis-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // native scroll; ScrollTrigger still works without Lenis

    const l = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    lenisRef.current = l;
    setLenis(l);

    const onScroll = () => ScrollTrigger.update();
    l.on("scroll", onScroll);

    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      l.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      l.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={{ lenis }}>{children}</LenisContext.Provider>;
}
```

- [ ] **Step 4: `tma-web/components/v15/engine/usePinnedTimeline.ts`**

```ts
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PinnedOptions {
  /** Pin length in viewport heights (e.g. 6 => end "+=600%"). */
  viewports: number;
  /** Called every scrub frame with progress 0..1. */
  onProgress?: (progress: number) => void;
  /** When true: no ScrollTrigger; fire onProgress(1) once (reduced motion). */
  disabled?: boolean;
  enablePin?: boolean;
}

/**
 * Attaches a pinned, scrubbed ScrollTrigger to the returned ref's element.
 * All GSAP work is created inside a gsap.context scoped to the element and
 * reverted on unmount (kills the ScrollTrigger, no leaks).
 */
export function usePinnedTimeline({
  viewports,
  onProgress,
  disabled = false,
  enablePin = true,
}: PinnedOptions) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (disabled) {
      cb.current?.(1);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: `+=${viewports * 100}%`,
        pin: enablePin,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => cb.current?.(self.progress),
      });
    }, el);

    return () => ctx.revert();
  }, [viewports, disabled, enablePin]);

  return ref;
}
```

- [ ] **Step 5: `tma-web/components/v15/engine/useMagnetic.ts`**

```ts
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Magnetic cursor-follow for buttons/cards. No-ops on coarse pointers and
 * when reduced motion is requested. Reverts cleanly on unmount.
 */
export function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const qx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const qy = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * strength);
      qy((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      qx(0);
      qy(0);
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [strength]);

  return ref;
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors in `components/v15/engine/*`. (Pre-existing `.jsx` files are `allowJs` and may emit unrelated warnings only if typed — none expected since they have no type errors surfaced under `checkJs:false`.) If errors appear only in non-v15 legacy files, they are out of scope — confirm all reported paths are under `components/v15/`.

- [ ] **Step 7: Commit**

```bash
git add tma-web/components/v15/engine/
git commit -m "feat(v15): Lenis provider + reduced-motion/pinned-timeline/magnetic hooks"
```

---

## Task 5: V15 route shell, scoped Tailwind theme, experience skeleton + smoke e2e

**Files:**
- Create: `tma-web/app/v15/v15.css`, `tma-web/app/v15/layout.tsx`, `tma-web/app/v15/page.tsx`, `tma-web/components/v15/V15Experience.tsx`
- Create: `tma-web/playwright/tests/v15-smoke.spec.js`

- [ ] **Step 1: `tma-web/app/v15/v15.css` (scoped Tailwind + tokens + reset + grain)**

```css
@import "tailwindcss" prefix(v15);
/* Disable Tailwind's global Preflight so it cannot bleed into the rest of
   the (vanilla-CSS) app. A scoped reset under .v15-root replaces it. */
@layer base {
}

@theme {
  --color-matte: #050506;
  --color-graphite: #0e0f12;
  --color-graphite-2: #16181d;
  --color-soft: #f4f5f7;
  --color-electric: #4bb7ff;
  --font-display: var(--font-space-grotesk), "Inter Tight", system-ui, sans-serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
}

/* Scoped reset (replaces Preflight, only inside the V15 subtree). */
.v15-root,
.v15-root * ,
.v15-root *::before,
.v15-root *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.v15-root {
  background: var(--color-matte);
  color: var(--color-soft);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.v15-root h1,
.v15-root h2,
.v15-root h3 {
  font-family: var(--font-display);
  line-height: 0.95;
  letter-spacing: -0.02em;
}
.v15-root img {
  display: block;
  max-width: 100%;
}
.v15-root button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
}

/* Cinematic film grain overlay. */
.v15-grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  opacity: 0.06;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>");
}
@media (max-width: 768px) {
  .v15-grain { opacity: 0.04; }
}
@media (prefers-reduced-motion: reduce) {
  .v15-root * { animation: none !important; transition: none !important; }
}
```

> Note: `@import "tailwindcss" prefix(v15)` (Tailwind v4) namespaces utilities as `v15:flex` etc. and, combined with the empty `@layer base`, ships **no Preflight**. If the installed Tailwind v4 minor rejects `prefix(...)`, fall back to `@import "tailwindcss/theme"; @import "tailwindcss/utilities";` (omit `preflight`) and use unprefixed utilities — document whichever is used in a comment at the top of this file.

- [ ] **Step 2: `tma-web/app/v15/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./v15.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "V15 — The Motion Agency",
  description: "A cinematic archive of brands, campaigns, and stories built to move.",
};

export default function V15Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`v15-root ${spaceGrotesk.variable} ${inter.variable}`}>
      {children}
      <div className="v15-grain" aria-hidden />
    </div>
  );
}
```

- [ ] **Step 3: `tma-web/components/v15/V15Experience.tsx` (skeleton with section anchors)**

```tsx
"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LenisProvider } from "./engine/LenisProvider";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function V15Experience() {
  useEffect(() => {
    // Recompute pin positions once fonts settle.
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);
    const t = window.setTimeout(refresh, 600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <LenisProvider>
      <main>
        <section data-v15-section="hero" style={{ minHeight: "100vh" }}>
          <h1 style={{ padding: "40vh 6vw", fontSize: "clamp(2.5rem,9vw,8rem)" }}>
            THE MOTION AGENCY
          </h1>
        </section>
        <section data-v15-section="featured" style={{ minHeight: "100vh" }} />
        <section data-v15-section="bridge" style={{ minHeight: "100vh" }} />
        <section data-v15-section="library" style={{ minHeight: "100vh" }} />
        <section data-v15-section="cta" style={{ minHeight: "100vh" }} />
      </main>
    </LenisProvider>
  );
}
```

- [ ] **Step 4: `tma-web/app/v15/page.tsx`**

```tsx
import V15Experience from "@/components/v15/V15Experience";

export default function V15Page() {
  return <V15Experience />;
}
```

- [ ] **Step 5: Write the smoke e2e**

`tma-web/playwright/tests/v15-smoke.spec.js`:

```js
import { test, expect } from "@playwright/test";

test.describe("v15 smoke", () => {
  test("page loads with hero title and five section anchors", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/v15", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /THE MOTION AGENCY/i })).toBeVisible();
    for (const id of ["hero", "featured", "bridge", "library", "cta"]) {
      await expect(page.locator(`[data-v15-section="${id}"]`)).toHaveCount(1);
    }
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
```

- [ ] **Step 6: Run smoke + regression**

Build first: `npm run build` — Expected: SUCCEEDS (Tailwind now imported, but only inside `/v15`).

Then with `npm run dev` running:
```
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-smoke.spec.js playwright/tests/smoke.spec.js --project=desktop-1920
```
Expected: v15-smoke PASS and existing smoke.spec PASS (no regression — confirms scoped Tailwind didn't leak).

- [ ] **Step 7: Commit**

```bash
git add tma-web/app/v15/ tma-web/components/v15/V15Experience.tsx tma-web/playwright/tests/v15-smoke.spec.js
git commit -m "feat(v15): route shell, scoped Tailwind theme, experience skeleton + smoke e2e"
```

---

## Task 6: V15Hero + R3F AtmosphereScene (+ fallbacks)

**Files:**
- Create: `tma-web/components/v15/hero/AtmosphereScene.tsx`, `tma-web/components/v15/V15Hero.tsx`
- Modify: `tma-web/components/v15/V15Experience.tsx` (swap placeholder hero for `<V15Hero/>`)

- [ ] **Step 1: `tma-web/components/v15/hero/AtmosphereScene.tsx`**

```tsx
"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const target = useRef({ x: 0, y: 0 });

  const positions = useMemo(() => {
    const n = 600;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const m = state.pointer;
    target.current.x += (m.y * 0.12 - target.current.x) * 0.05;
    target.current.y += (m.x * 0.18 - target.current.y) * 0.05;
    if (ref.current) {
      ref.current.rotation.x = target.current.x;
      ref.current.rotation.y += delta * 0.02 + (target.current.y - ref.current.rotation.y) * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#9fc7ff"
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function MovingLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.position.set(Math.sin(t * 0.18) * 5, Math.cos(t * 0.13) * 3, 2.5);
    }
  });
  return <pointLight ref={ref} color="#4bb7ff" intensity={26} distance={16} />;
}

export default function AtmosphereScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#050506"]} />
      <fog attach="fog" args={["#050506", 6, 16]} />
      <ambientLight intensity={0.15} />
      <MovingLight />
      <ParticleField />
    </Canvas>
  );
}
```

- [ ] **Step 2: `tma-web/components/v15/V15Hero.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./engine/useReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const AtmosphereScene = dynamic(() => import("./hero/AtmosphereScene"), { ssr: false });

function webglSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function V15Hero() {
  const reduced = useReducedMotion();
  const [canvasOk, setCanvasOk] = useState(false);
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setCanvasOk(!reduced && webglSupported());
  }, [reduced]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
      if (reduced) {
        gsap.set(lines, { yPercent: 0, opacity: 1 });
        return;
      }
      gsap
        .timeline({ delay: 0.15 })
        .from(lines, { yPercent: 110, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.14 })
        .from("[data-hero-scroll]", { opacity: 0, y: 12, duration: 0.6 }, "-=0.3");

      gsap.to(el, {
        scale: 1.08,
        opacity: 0,
        filter: "blur(8px)",
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true, pin: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      data-v15-section="hero"
      style={{ position: "relative", height: "100vh", overflow: "hidden" }}
    >
      {canvasOk ? (
        <AtmosphereScene />
      ) : (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(75,183,255,0.16), transparent 70%), linear-gradient(180deg,#050506,#0e0f12)",
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(50% 50% at 50% 45%, rgba(75,183,255,0.10), transparent 75%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 6vw",
        }}
      >
        <h1 style={{ fontSize: "clamp(2.6rem,9vw,8.5rem)", textTransform: "uppercase" }}>
          <span style={{ display: "block", overflow: "hidden" }}>
            <span data-hero-line style={{ display: "block" }}>The Motion</span>
          </span>
          <span style={{ display: "block", overflow: "hidden" }}>
            <span data-hero-line style={{ display: "block" }}>Agency</span>
          </span>
        </h1>
        <p
          data-hero-line
          style={{ marginTop: "1.5rem", letterSpacing: "0.35em", fontSize: "clamp(.7rem,1.1vw,1rem)", color: "#4bb7ff" }}
        >
          SELECTED WORKS IN MOTION
        </p>
        <p
          data-hero-line
          style={{ marginTop: "1rem", maxWidth: 520, opacity: 0.7, fontSize: "clamp(.9rem,1.3vw,1.1rem)" }}
        >
          A cinematic archive of brands, campaigns, and stories built to move.
        </p>
        <span
          data-hero-scroll
          style={{ position: "absolute", bottom: "5vh", left: "6vw", letterSpacing: "0.3em", fontSize: ".7rem", opacity: 0.6 }}
        >
          SCROLL ↓
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Wire into `V15Experience.tsx`**

Replace the placeholder hero `<section>` with the component. Final `V15Experience.tsx` return:

```tsx
import V15Hero from "./V15Hero";
// ...inside <main>:
<V15Hero />
<section data-v15-section="featured" style={{ minHeight: "100vh" }} />
<section data-v15-section="bridge" style={{ minHeight: "100vh" }} />
<section data-v15-section="library" style={{ minHeight: "100vh" }} />
<section data-v15-section="cta" style={{ minHeight: "100vh" }} />
```

(Add `import V15Hero from "./V15Hero";` at the top; remove the old inline hero `<section>` and its `<h1>`.)

- [ ] **Step 4: Extend smoke e2e for hero text order**

Append to `tma-web/playwright/tests/v15-smoke.spec.js`:

```js
test("hero shows title, kicker, and supporting line", async ({ page }) => {
  await page.goto("/v15", { waitUntil: "networkidle" });
  await expect(page.getByText("SELECTED WORKS IN MOTION")).toBeVisible();
  await expect(page.getByText(/cinematic archive of brands/i)).toBeVisible();
});
```

- [ ] **Step 5: Verify**

Build: `npm run build` → SUCCEEDS.
With dev server up:
```
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-smoke.spec.js --project=desktop-1920
```
Expected: PASS. Manually open `http://localhost:3000/v15`: hero canvas animates, title reveals line-by-line, scroll pins/zooms the hero out. Toggle OS reduced-motion (or run `--project=desktop-1920` with `page.emulateMedia`) and confirm static gradient + instant text path renders without a canvas.

- [ ] **Step 6: Commit**

```bash
git add tma-web/components/v15/V15Hero.tsx tma-web/components/v15/hero/ tma-web/components/v15/V15Experience.tsx tma-web/playwright/tests/v15-smoke.spec.js
git commit -m "feat(v15): R3F atmospheric hero with reduced-motion/no-WebGL fallback"
```

---

## Task 7: FeaturedProjectScaleGallery (Model A — scroll is master)

Scroll position is the single source of truth (via `galleryMath`). Arrows + 4s autoplay call `lenis.scrollTo()` (or native `scrollTo` when Lenis is absent) at the anchor for the target index — no direct index state mutation.

**Files:**
- Create: `tma-web/components/v15/FeaturedProjectScaleGallery.tsx`
- Modify: `tma-web/components/v15/V15Experience.tsx`
- Create: `tma-web/playwright/tests/v15-gallery.spec.js`

- [ ] **Step 1: `tma-web/components/v15/FeaturedProjectScaleGallery.tsx`**

```tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { featuredProjects, getProjectImage } from "./data/projects";
import {
  progressToActiveFloat,
  activeIndexFromFloat,
  anchorProgressForIndex,
  cardLocalProgress,
} from "./engine/galleryMath";
import { usePinnedTimeline } from "./engine/usePinnedTimeline";
import { useReducedMotion } from "./engine/useReducedMotion";
import { useLenis } from "./engine/lenis-context";

const COUNT = featuredProjects.length;
const AUTOPLAY_MS = 4000;
const IDLE_RESUME_MS = 3000;

export default function FeaturedProjectScaleGallery() {
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const [float, setFloat] = useState(0);
  const sectionTopRef = useRef(0);
  const sectionHeightRef = useRef(1);
  const pausedUntil = useRef(0);

  const ref = usePinnedTimeline({
    viewports: COUNT + 1,
    disabled: reduced,
    onProgress: (p) => setFloat(progressToActiveFloat(p, COUNT)),
  });

  // Cache the pinned section's scroll geometry for anchor math.
  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      sectionTopRef.current = window.scrollY + rect.top;
      // Pinned length === (COUNT+1) viewport heights of scrollable distance.
      sectionHeightRef.current = window.innerHeight * (COUNT + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ref]);

  const goToIndex = useCallback(
    (i: number, viaUser: boolean) => {
      const idx = Math.max(0, Math.min(COUNT - 1, i));
      const targetY =
        sectionTopRef.current + anchorProgressForIndex(idx, COUNT) * sectionHeightRef.current;
      if (viaUser) pausedUntil.current = Date.now() + IDLE_RESUME_MS;
      if (reduced) {
        window.scrollTo({ top: targetY });
        setFloat(idx); // no ScrollTrigger in reduced mode; drive state directly
      } else if (lenis) {
        lenis.scrollTo(targetY, { duration: 1.1 });
      } else {
        window.scrollTo({ top: targetY, behavior: "smooth" });
      }
    },
    [lenis, reduced, ref]
  );

  const active = activeIndexFromFloat(float, COUNT);

  // Autoplay: advances by scrolling; pauses on recent user interaction.
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      goToIndex((active + 1) % COUNT, false);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [active, goToIndex, reduced]);

  const pauseFromUser = () => {
    pausedUntil.current = Date.now() + IDLE_RESUME_MS;
  };

  return (
    <section
      ref={ref}
      data-v15-section="featured"
      onWheel={pauseFromUser}
      onPointerDown={pauseFromUser}
      style={{ position: "relative", height: "100vh", overflow: "hidden", background: "#050506" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: "1600px",
          display: "grid",
          placeItems: "center",
        }}
      >
        {featuredProjects.map((p, i) => {
          const local = cardLocalProgress(i, float); // 1 active -> 0 neighbor
          const offset = i - float;
          const isActive = i === active;
          const scale = 0.62 + local * 0.38;
          const blur = (1 - local) * 7;
          const x = offset * 26; // vw, depth parallax
          const z = local * 60 - 60;
          const imgZoom = 1 + local * 0.15;
          return (
            <article
              key={p.id}
              aria-hidden={!isActive}
              style={{
                position: "absolute",
                width: "min(78vw, 1100px)",
                height: "min(74vh, 680px)",
                transform: `translateX(${x}vw) translateZ(${z}px) scale(${scale}) rotateY(${offset * -3}deg)`,
                filter: `blur(${blur}px)`,
                opacity: 0.25 + local * 0.75,
                zIndex: Math.round(local * 10),
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: `0 40px 120px rgba(0,0,0,0.6)`,
                transition: reduced ? "none" : "filter .2s linear",
              }}
            >
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <Image
                  src={getProjectImage(p.image)}
                  alt={p.title}
                  fill
                  sizes="78vw"
                  priority={i === 0}
                  style={{ objectFit: "cover", transform: `scale(${imgZoom})`, transformOrigin: "center" }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(180deg, transparent 35%, rgba(5,5,6,${0.4 + local * 0.5}) 100%)`,
                }}
              />
              <div style={{ position: "absolute", left: 40, bottom: 40, right: 40 }}>
                {[
                  <span key="cat" style={{ letterSpacing: "0.25em", fontSize: ".75rem", color: p.accentColor }}>
                    {p.category} · {p.year}
                  </span>,
                  <h2 key="title" style={{ fontSize: "clamp(1.6rem,4vw,3.4rem)", margin: ".4rem 0" }}>
                    {p.title}
                  </h2>,
                  <p key="desc" style={{ maxWidth: 560, opacity: 0.8, fontSize: "clamp(.85rem,1.2vw,1.05rem)" }}>
                    {p.description}
                  </p>,
                  <p key="svc" style={{ marginTop: ".8rem", fontSize: ".8rem", letterSpacing: ".15em", opacity: 0.65 }}>
                    {p.services.join("  ·  ")}
                  </p>,
                  <a
                    key="cta"
                    href={p.href}
                    style={{
                      display: "inline-block",
                      marginTop: "1.2rem",
                      padding: ".7rem 1.4rem",
                      border: `1px solid ${p.accentColor}`,
                      borderRadius: 999,
                      color: p.accentColor,
                      fontSize: ".8rem",
                      letterSpacing: ".15em",
                    }}
                  >
                    VIEW CASE
                  </a>,
                ].map((node, li) => (
                  <div
                    key={li}
                    style={{
                      opacity: isActive ? Math.max(0, Math.min(1, (local - 0.15) * 1.4 - li * 0.04)) : 0,
                      transform: `translateY(${isActive ? (1 - local) * 18 : 18}px)`,
                    }}
                  >
                    {node}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 20,
          zIndex: 20,
        }}
      >
        <button
          aria-label="Previous project"
          data-v15-prev
          onClick={() => goToIndex(active - 1, true)}
          style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999 }}
        >
          ←
        </button>
        <span data-v15-active aria-live="polite" style={{ alignSelf: "center", letterSpacing: ".2em", fontSize: ".8rem" }}>
          {String(active + 1).padStart(2, "0")} / {String(COUNT).padStart(2, "0")}
        </span>
        <button
          aria-label="Next project"
          data-v15-next
          onClick={() => goToIndex(active + 1, true)}
          style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999 }}
        >
          →
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `V15Experience.tsx`**

Add `import FeaturedProjectScaleGallery from "./FeaturedProjectScaleGallery";` and replace the `featured` placeholder `<section>` with `<FeaturedProjectScaleGallery />`.

- [ ] **Step 3: Write the gallery e2e**

`tma-web/playwright/tests/v15-gallery.spec.js`:

```js
import { test, expect } from "@playwright/test";

test.describe("v15 featured gallery (Model A)", () => {
  test("scroll advances the active card index", async ({ page }) => {
    await page.goto("/v15", { waitUntil: "networkidle" });
    const section = page.locator('[data-v15-section="featured"]');
    await section.scrollIntoViewIfNeeded();
    const counter = page.locator("[data-v15-active]");
    const before = await counter.textContent();
    // Scroll well into the pinned range.
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(900);
    const after = await counter.textContent();
    expect(after).not.toEqual(before);
  });

  test("next/prev arrows change the active index and stay in sync", async ({ page }) => {
    await page.goto("/v15", { waitUntil: "networkidle" });
    await page.locator('[data-v15-section="featured"]').scrollIntoViewIfNeeded();
    const counter = page.locator("[data-v15-active]");
    const start = await counter.textContent();
    await page.locator("[data-v15-next]").click();
    await page.waitForTimeout(1500);
    const next = await counter.textContent();
    expect(next).not.toEqual(start);
    await page.locator("[data-v15-prev]").click();
    await page.waitForTimeout(1500);
    expect(await counter.textContent()).toEqual(start);
  });
});
```

- [ ] **Step 4: Verify**

`npm run test:v15` → still PASS (no logic regressions).
Build: `npm run build` → SUCCEEDS.
Dev server up, then:
```
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-gallery.spec.js --project=desktop-1920
```
Expected: both gallery tests PASS. Manually confirm: active card scales near-fullscreen, neighbors blur/recede, text reveals progressively, autoplay advances every ~4s and pauses ~3s after a wheel/arrow interaction.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/v15/FeaturedProjectScaleGallery.tsx tma-web/components/v15/V15Experience.tsx tma-web/playwright/tests/v15-gallery.spec.js
git commit -m "feat(v15): scroll-master featured scale gallery with synced arrows + autoplay"
```

---

## Task 8: CinematicTextSection (bridge)

**Files:**
- Create: `tma-web/components/v15/CinematicTextSection.tsx`
- Modify: `tma-web/components/v15/V15Experience.tsx`

- [ ] **Step 1: `tma-web/components/v15/CinematicTextSection.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { usePinnedTimeline } from "./engine/usePinnedTimeline";
import { useReducedMotion } from "./engine/useReducedMotion";

const LINES: Array<[string, string]> = [
  ["WE DON'T SHOW PROJECTS.", "WE REVEAL MOMENTUM."],
  ["EVERY BRAND HAS A BEFORE.", "OUR WORK IS THE AFTER."],
  ["MOTION IS NOT DECORATION.", "IT IS THE MEMORY ENGINE."],
];

export default function CinematicTextSection() {
  const reduced = useReducedMotion();
  const [p, setP] = useState(0);
  const ref = usePinnedTimeline({
    viewports: LINES.length + 1,
    disabled: reduced,
    onProgress: setP,
  });

  // Map progress 0..1 across the couplets; one couplet "owns" its slice.
  const seg = 1 / LINES.length;

  return (
    <section
      ref={ref}
      data-v15-section="bridge"
      style={{ position: "relative", height: "100vh", overflow: "hidden", background: "#050506" }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(45% 45% at 50% 50%, rgba(75,183,255,0.12), transparent 70%)",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "1.6rem",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 6vw",
        }}
      >
        {LINES.map((couplet, i) => {
          const center = (i + 0.5) * seg;
          const dist = Math.abs(p - center);
          const focus = reduced ? 1 : Math.max(0, 1 - dist / seg); // 1 when centered
          const passed = !reduced && p > center + seg * 0.5;
          return (
            <div
              key={i}
              style={{
                opacity: reduced ? 1 : passed ? 0.25 : 0.15 + focus * 0.85,
                filter: reduced ? "none" : `blur(${(1 - focus) * 8}px)`,
                transform: reduced ? "none" : `translateY(${(1 - focus) * 26}px) scale(${0.96 + focus * 0.04})`,
              }}
            >
              <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem,5vw,4rem)", lineHeight: 1.05 }}>
                {couplet[0]}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.6rem,5vw,4rem)",
                  lineHeight: 1.05,
                  color: "#4bb7ff",
                }}
              >
                {couplet[1]}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `V15Experience.tsx`**

Add `import CinematicTextSection from "./CinematicTextSection";` and replace the `bridge` placeholder `<section>` with `<CinematicTextSection />`.

- [ ] **Step 3: Add bridge coverage to sections e2e**

Create `tma-web/playwright/tests/v15-sections.spec.js`:

```js
import { test, expect } from "@playwright/test";

test("bridge section renders all three couplets", async ({ page }) => {
  await page.goto("/v15", { waitUntil: "networkidle" });
  for (const t of [
    "WE DON'T SHOW PROJECTS.",
    "WE REVEAL MOMENTUM.",
    "EVERY BRAND HAS A BEFORE.",
    "OUR WORK IS THE AFTER.",
    "MOTION IS NOT DECORATION.",
    "IT IS THE MEMORY ENGINE.",
  ]) {
    await expect(page.getByText(t, { exact: true })).toBeAttached();
  }
});
```

- [ ] **Step 4: Verify**

Build → SUCCEEDS. Dev up, then:
```
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-sections.spec.js --project=desktop-1920
```
Expected: PASS. Manually scroll the bridge: each couplet sharpens from blur as it centers and dims after passing.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/v15/CinematicTextSection.tsx tma-web/components/v15/V15Experience.tsx tma-web/playwright/tests/v15-sections.spec.js
git commit -m "feat(v15): cinematic text-bridge with scroll-scrubbed couplet reveal"
```

---

## Task 9: ProjectLibrary3DGrid + ProjectModal

**Files:**
- Create: `tma-web/components/v15/ProjectModal.tsx`, `tma-web/components/v15/ProjectLibrary3DGrid.tsx`
- Modify: `tma-web/components/v15/V15Experience.tsx`

- [ ] **Step 1: `tma-web/components/v15/ProjectModal.tsx`**

```tsx
"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { getProjectImage } from "./data/projects";
import type { LibraryProject } from "./data/projects";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: LibraryProject | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!project) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus();
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            background: "rgba(3,3,4,0.7)",
            backdropFilter: "blur(14px)",
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            style={{ width: "min(86vw,960px)", borderRadius: 18, overflow: "hidden", background: "#0e0f12" }}
          >
            <div style={{ position: "relative", aspectRatio: "16/9" }}>
              <Image src={getProjectImage(project.image)} alt={project.title} fill style={{ objectFit: "cover" }} />
            </div>
            <div style={{ padding: "1.6rem 2rem 2rem" }}>
              <p style={{ letterSpacing: ".25em", fontSize: ".75rem", color: "#4bb7ff" }}>
                {project.category} · {project.year} · {project.tag}
              </p>
              <h3 style={{ fontSize: "clamp(1.5rem,3vw,2.4rem)", marginTop: ".5rem" }}>{project.title}</h3>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.3)",
              }}
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: `tma-web/components/v15/ProjectLibrary3DGrid.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { libraryProjects, getProjectImage } from "./data/projects";
import type { LibraryProject } from "./data/projects";
import { useReducedMotion } from "./engine/useReducedMotion";
import ProjectModal from "./ProjectModal";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const SPAN: Record<NonNullable<LibraryProject["size"]>, number> = { sm: 1, md: 1, lg: 2 };

export default function ProjectLibrary3DGrid() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState<LibraryProject | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-lib-card]");
      gsap.from(cards, {
        z: -420,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: { each: 0.05, grid: "auto", from: "start" },
        scrollTrigger: { trigger: el, start: "top 75%" },
      });
      gsap.utils.toArray<HTMLElement>("[data-lib-row]").forEach((row, i) => {
        gsap.to(row, {
          yPercent: i % 2 === 0 ? -8 : -16,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
      gsap.to(el, {
        z: -260,
        opacity: 0.4,
        ease: "none",
        scrollTrigger: { trigger: el, start: "bottom 80%", end: "bottom top", scrub: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  // Chunk into rows of 4 for differential parallax.
  const rows: LibraryProject[][] = [];
  for (let i = 0; i < libraryProjects.length; i += 4) rows.push(libraryProjects.slice(i, i + 4));

  return (
    <section
      ref={root}
      data-v15-section="library"
      style={{
        position: "relative",
        background: "#050506",
        padding: "16vh 5vw",
        perspective: "1400px",
      }}
    >
      <h2 style={{ fontSize: "clamp(1.4rem,4vw,3rem)", marginBottom: "6vh", opacity: 0.85 }}>
        THE ARCHIVE
      </h2>
      <div style={{ transformStyle: "preserve-3d", display: "flex", flexDirection: "column", gap: "2vh" }}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            data-lib-row
            style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.4vw" }}
          >
            {row.map((p) => (
              <button
                key={p.id}
                data-lib-card
                onClick={() => setOpen(p)}
                onMouseEnter={(e) => {
                  if (reduced) return;
                  gsap.to(e.currentTarget, { z: 70, scale: 1.05, duration: 0.4, ease: "power3.out" });
                }}
                onMouseLeave={(e) => {
                  if (reduced) return;
                  gsap.to(e.currentTarget, { z: 0, scale: 1, duration: 0.5, ease: "power3.out" });
                }}
                style={{
                  gridColumn: `span ${SPAN[p.size ?? "md"]}`,
                  position: "relative",
                  aspectRatio: p.size === "lg" ? "16/9" : "4/5",
                  borderRadius: 14,
                  overflow: "hidden",
                  transformStyle: "preserve-3d",
                  textAlign: "left",
                }}
              >
                <Image
                  src={getProjectImage(p.image)}
                  alt={p.title}
                  fill
                  sizes="(max-width:768px) 50vw, 25vw"
                  loading="lazy"
                  style={{ objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg,transparent 45%,rgba(5,5,6,.85))",
                  }}
                />
                <div style={{ position: "absolute", left: 16, bottom: 14, right: 16 }}>
                  <p style={{ fontSize: ".7rem", letterSpacing: ".2em", color: "#4bb7ff" }}>
                    {p.tag} · {p.year}
                  </p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(.9rem,1.4vw,1.3rem)" }}>
                    {p.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </section>
  );
}
```

- [ ] **Step 3: Wire into `V15Experience.tsx`**

Add `import ProjectLibrary3DGrid from "./ProjectLibrary3DGrid";` and replace the `library` placeholder `<section>` with `<ProjectLibrary3DGrid />`.

- [ ] **Step 4: Add library e2e to sections spec**

Append to `tma-web/playwright/tests/v15-sections.spec.js`:

```js
test("library renders 18 cards and opens/closes a modal", async ({ page }) => {
  await page.goto("/v15", { waitUntil: "networkidle" });
  await page.locator('[data-v15-section="library"]').scrollIntoViewIfNeeded();
  await expect(page.locator("[data-lib-card]")).toHaveCount(18);
  await page.locator("[data-lib-card]").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
```

- [ ] **Step 5: Verify**

Build → SUCCEEDS. Dev up, then:
```
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-sections.spec.js --project=desktop-1920
```
Expected: PASS. Manually: cards animate in from depth, rows parallax at different speeds, hover pops a card forward, click opens cinematic modal, ESC/scrim closes and restores scroll.

- [ ] **Step 6: Commit**

```bash
git add tma-web/components/v15/ProjectLibrary3DGrid.tsx tma-web/components/v15/ProjectModal.tsx tma-web/components/v15/V15Experience.tsx tma-web/playwright/tests/v15-sections.spec.js
git commit -m "feat(v15): 3D project library grid + cinematic modal"
```

---

## Task 10: V15CTA (magnetic final landing)

**Files:**
- Create: `tma-web/components/v15/V15CTA.tsx`
- Modify: `tma-web/components/v15/V15Experience.tsx`

- [ ] **Step 1: `tma-web/components/v15/V15CTA.tsx`**

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./engine/useReducedMotion";
import { useMagnetic } from "./engine/useMagnetic";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const HEADLINE = "READY TO MOVE YOUR BRAND?".split(" ");

export default function V15CTA() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement | null>(null);
  const btn = useMagnetic(0.4);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>("[data-cta-word]");
      if (reduced) {
        gsap.set([words, "[data-cta-sub]", "[data-cta-btn]"], { opacity: 1, y: 0 });
        return;
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 70%" },
      });
      tl.from(el, { z: -240, opacity: 0, duration: 1, ease: "power3.out" })
        .from(words, { yPercent: 110, opacity: 0, stagger: 0.08, duration: 0.7, ease: "power4.out" }, "-=0.4")
        .from("[data-cta-sub]", { opacity: 0, y: 16, duration: 0.6 }, "-=0.2")
        .from("[data-cta-btn]", { opacity: 0, scale: 0.9, duration: 0.5 }, "-=0.1");
      gsap.to("[data-cta-glow]", {
        opacity: 0.55,
        scale: 1.15,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      data-v15-section="cta"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        background: "linear-gradient(180deg,#050506,#0b0c10)",
        overflow: "hidden",
      }}
    >
      <div
        data-cta-glow
        aria-hidden
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(75,183,255,0.25), transparent 65%)",
          opacity: 0.3,
        }}
      />
      <div style={{ position: "relative", padding: "0 6vw" }}>
        <h2 style={{ fontSize: "clamp(2rem,7vw,6rem)", lineHeight: 1 }}>
          {HEADLINE.map((w, i) => (
            <span key={i} style={{ display: "inline-block", overflow: "hidden" }}>
              <span data-cta-word style={{ display: "inline-block", marginRight: "0.25em" }}>
                {w}
              </span>
            </span>
          ))}
        </h2>
        <p data-cta-sub style={{ marginTop: "1.4rem", opacity: 0.7, fontSize: "clamp(.95rem,1.4vw,1.2rem)" }}>
          Let&apos;s build the next story people remember.
        </p>
        <a
          data-cta-btn
          ref={btn as React.RefObject<HTMLAnchorElement>}
          href="/#contact"
          style={{
            display: "inline-block",
            marginTop: "2.4rem",
            padding: "1rem 2.4rem",
            borderRadius: 999,
            background: "#4bb7ff",
            color: "#050506",
            fontWeight: 600,
            letterSpacing: ".12em",
          }}
        >
          START A PROJECT
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `V15Experience.tsx`**

Add `import V15CTA from "./V15CTA";` and replace the `cta` placeholder `<section>` with `<V15CTA />`. `V15Experience.tsx` now renders, in order: `<V15Hero/>`, `<FeaturedProjectScaleGallery/>`, `<CinematicTextSection/>`, `<ProjectLibrary3DGrid/>`, `<V15CTA/>` — no placeholder `<section>`s remain.

- [ ] **Step 3: Add CTA e2e to sections spec**

Append to `tma-web/playwright/tests/v15-sections.spec.js`:

```js
test("CTA headline, subline, and button are present and linked", async ({ page }) => {
  await page.goto("/v15", { waitUntil: "networkidle" });
  await page.locator('[data-v15-section="cta"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: /READY TO MOVE YOUR BRAND/i })).toBeAttached();
  await expect(page.getByText(/next story people remember/i)).toBeAttached();
  const btn = page.getByRole("link", { name: /START A PROJECT/i });
  await expect(btn).toHaveAttribute("href", "/#contact");
});
```

- [ ] **Step 4: Verify**

Build → SUCCEEDS. Dev up, then:
```
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-sections.spec.js --project=desktop-1920
```
Expected: PASS. Manually: headline reveals word-by-word, glow pulses, button magnetically follows the cursor (fine pointer only).

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/v15/V15CTA.tsx tma-web/components/v15/V15Experience.tsx tma-web/playwright/tests/v15-sections.spec.js
git commit -m "feat(v15): magnetic cinematic final CTA"
```

---

## Task 11: Performance / a11y pass + reduced-motion e2e + final verification

**Files:**
- Modify: `tma-web/components/v15/V15Experience.tsx` (ScrollTrigger refresh after hero canvas + resize)
- Create: `tma-web/playwright/tests/v15-reduced-motion.spec.js`

- [ ] **Step 1: Harden `V15Experience.tsx` refresh + resize**

Replace the `useEffect` in `V15Experience.tsx` with:

```tsx
useEffect(() => {
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts?.ready) document.fonts.ready.then(refresh);
  const t1 = window.setTimeout(refresh, 600);
  const t2 = window.setTimeout(refresh, 1600); // after hero canvas mounts
  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(refresh);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    window.removeEventListener("resize", onResize);
    cancelAnimationFrame(raf);
  };
}, []);
```

- [ ] **Step 2: Write the reduced-motion e2e**

`tma-web/playwright/tests/v15-reduced-motion.spec.js`:

```js
import { test, expect } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test.describe("v15 reduced motion", () => {
  test("all content readable, no canvas, no console errors", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/v15", { waitUntil: "networkidle" });

    await expect(page.getByText("SELECTED WORKS IN MOTION")).toBeVisible();
    // Hero R3F canvas must NOT be rendered in reduced motion.
    await expect(page.locator('[data-v15-section="hero"] canvas')).toHaveCount(0);

    // Bridge couplets present without scrubbing.
    await expect(page.getByText("IT IS THE MEMORY ENGINE.", { exact: true })).toBeAttached();

    // Library still interactive.
    await page.locator('[data-v15-section="library"]').scrollIntoViewIfNeeded();
    await expect(page.locator("[data-lib-card]")).toHaveCount(18);

    // Arrows still work (instant scroll in reduced mode).
    await page.locator('[data-v15-section="featured"]').scrollIntoViewIfNeeded();
    const counter = page.locator("[data-v15-active]");
    const start = await counter.textContent();
    await page.locator("[data-v15-next]").click();
    await page.waitForTimeout(400);
    expect(await counter.textContent()).not.toEqual(start);

    expect(errors, errors.join("\n")).toEqual([]);
  });
});
```

- [ ] **Step 3: Full unit + build + e2e gate**

Run, expecting all PASS:
```bash
npm run test:v15
npm run build
```
Then with dev server up:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-*.spec.js --project=desktop-1920
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-gallery.spec.js playwright/tests/v15-sections.spec.js --project=tablet-768
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v15-sections.spec.js --project=mobile-375
```
Expected: all v15 specs PASS at desktop, tablet, and mobile.

- [ ] **Step 4: Regression gate — existing app untouched**

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/smoke.spec.js playwright/tests/v14-chapters.spec.js --project=desktop-1920
```
Expected: PASS — existing routes unaffected by the scoped TS/Tailwind addition. Manually load `/portfolio-v14` and `/` and confirm zero visual change (no Tailwind preflight bleed). If any bleed is observed, apply the `prefix(v15)` / split-import fallback noted in Task 5 Step 1 and re-run this gate.

- [ ] **Step 5: Manual performance check**

Open `http://localhost:3000/v15` with DevTools Performance. Confirm: scroll stays ~60fps on desktop; only `transform`/`opacity`/`filter` animate (no layout in the Performance "Rendering" / no purple "Layout" bars during scroll); R3F canvas disposed on route change (navigate away and back — no WebGL context warning, no detached-canvas growth). Reduce particle/blur already handled by mobile media query — verify on `mobile-375`.

- [ ] **Step 6: Commit**

```bash
git add tma-web/components/v15/V15Experience.tsx tma-web/playwright/tests/v15-reduced-motion.spec.js
git commit -m "perf(v15): ScrollTrigger refresh hardening + reduced-motion e2e + full verification"
```

---

## Self-Review (completed during plan authoring)

- **Spec coverage:** Hero R3F + fallback (Task 6, spec §6.1) · Featured Model A scroll-master + arrows + autoplay (Tasks 2,7, §6.2) · Text bridge couplets (Task 8, §6.3) · 3D library + modal (Task 9, §6.4) · Magnetic CTA (Task 10, §6.5) · TS+scoped-Tailwind+regression gate (Tasks 1,5,11, §4) · Real Foodics/Zid + placeholders + image fallback (Task 3, §5.1) · Lenis single-instance + ticker wiring + cleanup (Task 4, §3,§7) · reduced-motion every section (Tasks 6–11, §7) · perf transform/opacity-only + refresh + dispose (Task 11, §7). All spec sections mapped.
- **Placeholder scan:** No "TBD/TODO/implement later" — every code step is complete and runnable.
- **Type/name consistency:** `FeaturedProject`/`LibraryProject`/`getProjectImage` (Task 3) used identically in Tasks 7/9. `usePinnedTimeline({viewports,onProgress,disabled})` signature (Task 4) matches all call sites (Tasks 7,8). `galleryMath` exports (Task 2) match imports in Task 7. `useLenis()`/`LenisProvider` (Task 4) match Task 7 usage. Section `data-v15-section` ids consistent across components and specs.
- **Scope:** Single cohesive page, one plan; build sequence is incremental and each task is independently verifiable.

# V12 "Launch Sequence" Cinematic Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/portfolio-v12` — a 9-section, scroll-driven "Launch Sequence" cinematic for The Motion Agency using only real deck content.

**Architecture:** Approach B from the spec — isolated section modules each owning their own GSAP ScrollTrigger, unified by a shared `LaunchSequenceContext` (scroll progress 0→1 + derived phase) that drives a global escalating atmosphere layer, HUD, and synthesized audio. Hybrid rendering: GSAP + Lenis + Framer Motion everywhere; exactly one lazy R3F scene (Section 3).

**Tech Stack:** Next.js 16 (app router), React 19, GSAP 3.15 + ScrollTrigger, Lenis 1.3, Framer Motion 12, @react-three/fiber 9 + drei 10 + three 0.169, Web Audio API (synthesized — no binary audio assets), Node built-in test runner (`node --test`), Playwright 1.59.

**Spec:** `docs/superpowers/specs/2026-05-15-v12-launch-sequence-portfolio-design.md`

---

## Testing Philosophy (read before starting)

Three tiers, matched to installed tooling — **no new test dependencies**:

1. **Logic / data (strict TDD):** `data/portfolio-v12.js` and the `phaseFor()` pure function are tested with Node's built-in runner via `.test.mjs` files under `tma-web/test/`. Write test → see it fail → implement → see it pass → commit.
2. **`next build` gate:** after each phase, `npm run build` must pass with no errors. This is the type/compile safety net for React/Next code (there is no RTL/jsdom in this repo — do not add one).
3. **Visual / behavior (Playwright):** one spec `playwright/tests/v12.spec.js` run against a local dev server captures phase screenshots and asserts DOM/behavior. Built incrementally; full run is Phase 8.

**Important repo constraint (from `tma-web/AGENTS.md`):** This Next.js version has breaking changes vs. training data. **Before writing the route, font, or any `next/dynamic` code (Task 1, Task 16), read `node_modules/next/dist/docs/01-app` index and the relevant guide.** Heed deprecation notices.

**Documented deviations from spec (intentional, scope-safe):**
- **Fonts:** Use `next/font/google` **Space Grotesk** (Next self-hosts at build time — no runtime CDN, satisfies the "self-hosted, no CDN" intent). Clash Display binaries do not exist in the repo; Space Grotesk is in the spec's approved font list. A hook is left to add `ClashDisplay.woff2` later via `next/font/local`.
- **Audio:** No audio binary assets exist. `AudioController` uses the **Web Audio API** to *synthesize* the ambient rumble + transition whoosh (oscillator + filtered noise). Howler is not used (it only plays files; YAGNI here). The opt-in/default-OFF behavior from the spec is unchanged.

All commands below assume CWD `tma-web/` unless stated. Shell is PowerShell — examples use generic syntax; the executing engineer adapts (`;` not `&&` for chaining in PowerShell).

---

## File Structure

```
tma-web/
  app/portfolio-v12/page.jsx                    # route metadata + <V12ClientRoot/>
  components/portfolio-v12/
    V12ClientRoot.jsx                           # 'use client' root: Lenis + provider + layers
    V12Experience.jsx                           # composes 9 sections in order
    LaunchSequenceContext.jsx                   # context + useLaunchPhase/useLaunchProgress hooks
    phase.js                                    # phaseFor(progress) pure function (PHASES table)
    useLaunchScroll.js                           # Lenis<->GSAP ScrollTrigger wiring + progress writer
    AtmosphereLayer.jsx                         # fixed 2D canvas particles + CSS glow
    HUD.jsx                                      # fixed telemetry readout
    AudioController.jsx                         # Web Audio synth + mute toggle (default OFF)
    EcosystemScene.jsx                          # R3F scene (lazy, client-only)
    ProjectChapter.jsx                          # reusable deep/mid chapter
    sections/
      01-OpeningSequence.jsx
      02-Philosophy.jsx
      03-Ecosystem.jsx                          # wraps lazy EcosystemScene + CSS fallback
      04-FeaturedProjects.jsx
      05-MotionReel.jsx
      06-BehindTheMotion.jsx
      07-SocialProof.jsx
      08-Climax.jsx
      09-FinalCTA.jsx
    v12.css                                     # scoped tokens + section styles
  data/portfolio-v12.js                         # single source of truth (real deck content)
  test/
    portfolio-v12-data.test.mjs                 # data integrity
    phase.test.mjs                              # phaseFor() boundaries
  playwright/tests/v12.spec.js                  # visual + behavior smoke
```

---

## Phase 0 — Scaffold, data, test infra

### Task 1: Route scaffold + read Next docs

**Files:**
- Read: `node_modules/next/dist/docs/01-app/index.md` (+ any routing/metadata guide it links)
- Create: `tma-web/app/portfolio-v12/page.jsx`
- Create: `tma-web/components/portfolio-v12/V12ClientRoot.jsx` (temporary stub)

- [ ] **Step 1: Read the Next docs**

Run: open and read `node_modules/next/dist/docs/01-app/index.md`. Note any changes to: `metadata` export, `'use client'`, `next/dynamic`, `next/font`. Do not skip — APIs may differ from training data.

- [ ] **Step 2: Create the temporary client root stub**

`tma-web/components/portfolio-v12/V12ClientRoot.jsx`:

```jsx
"use client";

export default function V12ClientRoot() {
  return (
    <main data-v12-root style={{ minHeight: "100vh", background: "#050506", color: "#f4f5f7" }}>
      <h1>V12 scaffold</h1>
    </main>
  );
}
```

- [ ] **Step 3: Create the route**

`tma-web/app/portfolio-v12/page.jsx`:

```jsx
import V12ClientRoot from "@/components/portfolio-v12/V12ClientRoot";

export const metadata = {
  title: "Launch Sequence — The Motion Agency",
  description:
    "A cinematic launch sequence. We don't build brands — we launch them. Foodics, Zid and the studio floor, scrolled like a film.",
  openGraph: {
    title: "Launch Sequence — The Motion Agency",
    description:
      "Ignition to orbit: Foodics and Zid deep cases, a motion reel of real campaigns, built across Amman and Riyadh.",
    images: [{ url: "/assets/case-foodics-boundless.png", width: 1920, height: 1080 }],
  },
};

export default function PortfolioV12Page() {
  return <V12ClientRoot />;
}
```

- [ ] **Step 4: Verify it renders**

Run: `npm run dev` then open `http://localhost:3000/portfolio-v12`. Expected: black page, "V12 scaffold". Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add tma-web/app/portfolio-v12 tma-web/components/portfolio-v12/V12ClientRoot.jsx
git commit -m "feat(v12): scaffold /portfolio-v12 route"
```

---

### Task 2: Test runner wiring

**Files:**
- Modify: `tma-web/package.json` (scripts)

- [ ] **Step 1: Add test scripts**

In `tma-web/package.json`, change the `"scripts"` block to:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --test test/",
    "test:e2e": "playwright test"
  },
```

- [ ] **Step 2: Verify the runner works (empty pass)**

Create a throwaway `tma-web/test/_smoke.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
test("runner works", () => assert.equal(1, 1));
```

Run: `npm test`
Expected: 1 test passing.

- [ ] **Step 3: Delete the smoke file**

Delete `tma-web/test/_smoke.test.mjs`.

- [ ] **Step 4: Commit**

```bash
git add tma-web/package.json
git commit -m "chore(v12): add node --test and playwright test scripts"
```

---

### Task 3: Data module (TDD — data integrity first)

**Files:**
- Test: `tma-web/test/portfolio-v12-data.test.mjs`
- Create: `tma-web/data/portfolio-v12.js`

Source of truth for every string/number below is auto-memory `tma_portfolio_deck.md`. Do not paraphrase the case copy.

- [ ] **Step 1: Write the failing data-integrity test**

`tma-web/test/portfolio-v12-data.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as data from "../data/portfolio-v12.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

test("opening + manifesto copy present", () => {
  assert.equal(data.opening.line1, "We don't build brands.");
  assert.equal(data.opening.line2, "We launch them.");
  assert.match(data.opening.sub, /Amman and Riyadh/);
  assert.equal(data.philosophy.length, 3);
  assert.match(data.philosophy[0], /Motion creates emotion/i);
});

test("8 real services", () => {
  assert.equal(data.services.length, 8);
  const names = data.services.map((s) => s.name);
  assert.ok(names.includes("Brand Strategy & Positioning"));
  assert.ok(names.includes("Content Studio & Campaign Production"));
  // Social Media copy must NOT be the GTM duplicate from the deck bug
  const social = data.services.find((s) => s.name.startsWith("Social Media"));
  assert.ok(social && !/go-to-market blueprints|launch playbooks/i.test(social.desc));
});

test("Foodics deep case exact numbers", () => {
  const f = data.deepCases.find((c) => c.id === "foodics");
  assert.ok(f);
  assert.match(f.intro, /\$2M funding stage/);
  assert.match(f.challenge.join(" "), /just a POS system|POS provider/);
  assert.deepEqual(
    f.impact.map((i) => i.value),
    ["$20.8M", "32,000+", "35%", "$1B"]
  );
});

test("Zid deep case exact numbers", () => {
  const z = data.deepCases.find((c) => c.id === "zid");
  assert.ok(z);
  assert.match(z.intro, /Ripple 2024/);
  assert.deepEqual(
    z.impact.map((i) => i.value),
    ["200%", "30%+", "50%", "25%"]
  );
});

test("4 mid chapters, no invented challenge/impact", () => {
  const ids = data.midCases.map((m) => m.id).sort();
  assert.deepEqual(ids, ["burger-king", "invoiceq", "lsc", "salasa"]);
  for (const m of data.midCases) {
    assert.ok(typeof m.line === "string" && m.line.length > 0);
    assert.ok(!("challenge" in m) && !("impact" in m));
  }
});

test("stats use safe 'years combined experience' phrasing", () => {
  const emp = data.stats.find((s) => /experience/i.test(s.label));
  assert.ok(emp, "must phrase 29+ as years combined experience");
  assert.equal(emp.value, "29+");
  assert.ok(!data.stats.some((s) => /employees/i.test(s.label)));
});

test("contact is the real deck contact", () => {
  assert.equal(data.contact.email, "info@themotionagency.net");
  assert.equal(data.contact.site, "themotionagency.net");
  assert.ok(data.contact.offices.some((o) => o.city === "Amman"));
  assert.ok(data.contact.offices.some((o) => o.city === "Riyadh"));
});

test("no placeholder strings anywhere", () => {
  const blob = JSON.stringify(data);
  for (const bad of ["lorem", "TODO", "TBD", "PLACEHOLDER", "FIXME"]) {
    assert.ok(!new RegExp(bad, "i").test(blob), `found "${bad}"`);
  }
});

test("every referenced asset exists on disk", () => {
  const paths = new Set();
  const walk = (v) => {
    if (typeof v === "string" && v.startsWith("/assets/")) paths.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(data);
  for (const p of paths) {
    assert.ok(existsSync(join(ROOT, p)), `missing asset: ${p}`);
  }
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../data/portfolio-v12.js'`.

- [ ] **Step 3: Create the data module**

`tma-web/data/portfolio-v12.js` — copy verbatim from deck memory. Use existing on-disk assets only (`public/assets/portfolio/slide-*.jpg`, `public/assets/case-*.png`, `public/assets/logos/*.png`, `public/assets/team/*.png`).

```js
export const opening = {
  line1: "We don't build brands.",
  line2: "We launch them.",
  sub: "A creative powerhouse with offices in Amman and Riyadh, delivering bold ideas and meaningful results across the GCC.",
};

export const philosophy = [
  "Motion creates emotion.",
  "Emotion creates memory.",
  "We don't just create campaigns — we become an extension of your team.",
];

export const services = [
  { name: "Brand Strategy & Positioning", desc: "We uncover crucial insights and craft compelling strategies that set the stage for brand growth, category leadership, and market expansion." },
  { name: "Brand Design & Experience", desc: "From identity systems to brand guidelines, we design brands that don't just look great — they build equity, drive consistency, and deliver ROI." },
  { name: "Go-to-Market & Growth Strategy", desc: "We develop complete GTM blueprints, launch playbooks, and marketing architectures that accelerate adoption and open new markets." },
  { name: "Growth Marketing & Reputation", desc: "Performance-driven campaigns that convert, alongside storytelling that puts your brand at the heart of cultural conversations — demand and trust in equal measure." },
  { name: "Event & Experience Marketing", desc: "We bring brands to life through flagship events and immersive experiences that forge deep connections and build industry authority." },
  { name: "Product Marketing & Innovation", desc: "From concept to rollout, we help define, position, and launch products — turning big ideas into sales-driving realities." },
  { name: "Social Media & Community Building", desc: "We turn channels into communities — always-on content, cultural relevance, and engagement that compounds brand affinity over time." },
  { name: "Content Studio & Campaign Production", desc: "Our global content engine covers it all: editorial, film, design, animation, and transcreation — standout campaigns across every channel." },
];

export const deepCases = [
  {
    id: "foodics",
    client: "Foodics",
    project: "Boundless 2022 · 2023",
    wash: "#4E008E",
    cover: "/assets/case-foodics-boundless.png",
    intro:
      "We shaped Foodics' brand reputation and positioning from its early $2M funding stage, building a solid strategy and comprehensive brand guidelines that anchored it as the F&B tech leader. We created and executed the flagship Boundless events (2022 & 2023) from scratch, establishing them as premier annual product showcases.",
    challenge: [
      "Foodics was evolving from POS provider to a complete F&B growth platform — payments, lending, data, marketplaces.",
      "The market still perceived them as just a POS system.",
      "Thousands of restaurant owners needed educating about the new tools.",
      "Clear market leadership had to be established as competition intensified.",
    ],
    transformation: [
      "Created a flagship annual stage positioning Foodics as the authority shaping the future of F&B tech.",
      "Crafted end-to-end event narratives — from payments (Foodics Pay) to financing (Foodics Capital) to scaling via Marketplace.",
      "Designed experiences that educated and excited: live demos, case studies, data insights, launches.",
      "Transformed perception — Foodics seen as the growth engine for F&B businesses, not a POS provider.",
    ],
    impact: [
      { value: "$20.8M", label: "2024 revenue, +35.6% YoY (from $15.4M)" },
      { value: "32,000+", label: "businesses, up from 8,000" },
      { value: "35%", label: "Saudi market share" },
      { value: "$1B", label: "unicorn valuation" },
    ],
  },
  {
    id: "zid",
    client: "Zid",
    project: "Ripple 2024",
    wash: "#1f7a73",
    cover: "/assets/case-zid-ripple.png",
    intro:
      "We restructured Zid's marketing department, launched new brand guidelines and a dynamic website, and conceptualized and delivered Ripple 2024 — Zid's first-ever product event — positioning the brand as the leading total commerce platform for merchants.",
    challenge: [
      "Fragmented systems: merchants juggled separate tools for e-commerce, social, and physical outlets.",
      "Scale barriers: logistical inefficiencies and disconnected marketing limited merchant growth.",
      "Perception gap: Zid needed to be the unified, future-ready commerce partner — not just a storefront builder.",
    ],
    transformation: [
      "Launched \"Total Commerce\" as Zid's core product — one ecosystem for e-commerce, social, and offline retail.",
      "Hosted a flagship event in Diriyah with 1,000+ merchants, industry leaders, and government figures.",
      "Showcased a unified dashboard and logistics: inventory, fulfillment, cross-border ops from one interface.",
      "Revealed AI-powered marketing tools and integrations: TikTok, Amazon, Snapchat, Meta + predictive analytics.",
    ],
    impact: [
      { value: "200%", label: "growth last year" },
      { value: "30%+", label: "active merchant growth (12,000+ users)" },
      { value: "50%", label: "increase in basket size & conversion" },
      { value: "25%", label: "YoY GMV growth" },
    ],
  },
];

export const midCases = [
  { id: "burger-king", client: "Burger King", line: "Royal taste, made unmissable — OOH and campaign work where taste is king.", image: "/assets/portfolio/slide-24.jpg" },
  { id: "salasa", client: "Salasa", line: "25+ shipping partners, one solution to fulfill every order.", image: "/assets/portfolio/slide-37.jpg" },
  { id: "lsc", client: "LSC", line: "Saudi Arabia's logistics industry is on the rise — and we positioned the brand for it.", image: "/assets/portfolio/slide-39.jpg" },
  { id: "invoiceq", client: "InvoiceQ", line: "A v1.0 brand system and product UI for compliant e-invoicing.", image: "/assets/portfolio/slide-34.jpg" },
];

export const reel = [
  "/assets/portfolio/slide-22.jpg", "/assets/portfolio/slide-23.jpg", "/assets/portfolio/slide-25.jpg",
  "/assets/portfolio/slide-26.jpg", "/assets/portfolio/slide-27.jpg", "/assets/portfolio/slide-28.jpg",
  "/assets/portfolio/slide-29.jpg", "/assets/portfolio/slide-31.jpg", "/assets/portfolio/slide-33.jpg",
  "/assets/portfolio/slide-35.jpg", "/assets/portfolio/slide-64.jpg", "/assets/portfolio/slide-65.jpg",
];

export const process = [
  { phase: "Strategy", image: "/assets/portfolio/slide-47.jpg", copy: "We immerse in the business — product, pain points, growth levers — before a single frame is designed." },
  { phase: "Design", image: "/assets/portfolio/slide-55.jpg", copy: "Identity systems and brand worlds engineered for equity, consistency, and ROI." },
  { phase: "Production", image: "/assets/portfolio/slide-50.jpg", copy: "Film, 3D, and live events produced end-to-end as one narrative." },
  { phase: "Animation & Post", image: "/assets/portfolio/slide-57.jpg", copy: "Motion and post that turn complex products into things people feel." },
];

export const clients = [
  "foodics", "zid", "invoiceq", "salasa", "sol", "burger-king", "buffalo-wild-wings",
  "electrolux", "abu-kass", "alissar", "arab-bank", "aramco", "bank-of-jordan",
  "cairo-amman-bank", "cyberx", "flex", "jadwa", "lsc", "ministry-economy",
  "reflect", "shaker-group", "webook", "western-union", "zaintech",
].map((slug) => `/assets/logos/${slug}.png`);

export const manifestoQuote =
  "We build brands with purpose. We create work that matters. We don't just deliver value — we become part of your success story.";

export const stats = [
  { value: "178%", label: "growth" },
  { value: "30+", label: "clients" },
  { value: "500+", label: "businesses created" },
  { value: "29+", label: "years combined experience" },
];

export const climax = [
  "The future belongs to brands that move.",
  "Static brands disappear.",
];

export const cta = {
  kicker: "Ready for liftoff?",
  button: "INITIATE PROJECT",
};

export const contact = {
  email: "info@themotionagency.net",
  site: "themotionagency.net",
  offices: [
    { city: "Amman", address: "Al-Abdali, 432, Amman, Jordan", tel: "+962 79 924 5366" },
    { city: "Riyadh", address: "Al-Olaya, Riyadh, Saudi Arabia", tel: "+966 57 353 2604" },
  ],
};
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm test`
Expected: all data tests PASS. If "missing asset" fails, fix the path to an existing file in `public/assets/` (verify with a directory listing) — do not invent assets.

- [ ] **Step 5: Commit**

```bash
git add tma-web/data/portfolio-v12.js tma-web/test/portfolio-v12-data.test.mjs
git commit -m "feat(v12): real deck content data module + integrity tests"
```

---

## Phase 1 — Shared infrastructure

### Task 4: `phaseFor()` pure function (TDD)

**Files:**
- Test: `tma-web/test/phase.test.mjs`
- Create: `tma-web/components/portfolio-v12/phase.js`

- [ ] **Step 1: Write the failing test**

`tma-web/test/phase.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { phaseFor, PHASES } from "../components/portfolio-v12/phase.js";

test("phase boundaries", () => {
  assert.equal(phaseFor(0), "ignition");
  assert.equal(phaseFor(0.1), "ignition");
  assert.equal(phaseFor(0.15), "liftoff");
  assert.equal(phaseFor(0.3), "liftoff");
  assert.equal(phaseFor(0.35), "ascent");
  assert.equal(phaseFor(0.69), "ascent");
  assert.equal(phaseFor(0.7), "orbit");
  assert.equal(phaseFor(0.87), "orbit");
  assert.equal(phaseFor(0.88), "climax");
  assert.equal(phaseFor(1), "climax");
});

test("clamps out-of-range input", () => {
  assert.equal(phaseFor(-5), "ignition");
  assert.equal(phaseFor(99), "climax");
});

test("PHASES ordered list exported", () => {
  assert.deepEqual(PHASES, ["ignition", "liftoff", "ascent", "orbit", "climax"]);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test`
Expected: FAIL — cannot find `phase.js`.

- [ ] **Step 3: Implement**

`tma-web/components/portfolio-v12/phase.js`:

```js
export const PHASES = ["ignition", "liftoff", "ascent", "orbit", "climax"];

// [phase, upperBound) — last phase catches the remainder.
const BOUNDS = [
  ["ignition", 0.15],
  ["liftoff", 0.35],
  ["ascent", 0.7],
  ["orbit", 0.88],
  ["climax", Infinity],
];

export function phaseFor(progress) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  for (const [name, upper] of BOUNDS) {
    if (p < upper) return name;
  }
  return "climax";
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test`
Expected: phase + data tests all PASS.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v12/phase.js tma-web/test/phase.test.mjs
git commit -m "feat(v12): phaseFor() pure function with boundary tests"
```

---

### Task 5: LaunchSequenceContext

**Files:**
- Create: `tma-web/components/portfolio-v12/LaunchSequenceContext.jsx`

- [ ] **Step 1: Implement the context + hooks**

A ref-backed store with subscribers, so high-frequency scroll updates don't re-render every consumer. Components opt into re-render only via `useLaunchPhase()` (changes ~5 times total).

`tma-web/components/portfolio-v12/LaunchSequenceContext.jsx`:

```jsx
"use client";

import { createContext, useContext, useRef, useCallback, useSyncExternalStore } from "react";
import { phaseFor } from "./phase.js";

const Ctx = createContext(null);

export function LaunchSequenceProvider({ children }) {
  const progress = useRef(0);
  const phase = useRef("ignition");
  const subs = useRef(new Set());

  const setProgress = useCallback((p) => {
    progress.current = p;
    const next = phaseFor(p);
    const phaseChanged = next !== phase.current;
    phase.current = next;
    for (const fn of subs.current) fn(phaseChanged);
  }, []);

  const subscribe = useCallback((fn) => {
    subs.current.add(fn);
    return () => subs.current.delete(fn);
  }, []);

  const getProgress = useCallback(() => progress.current, []);
  const getPhase = useCallback(() => phase.current, []);

  return (
    <Ctx.Provider value={{ setProgress, subscribe, getProgress, getPhase }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLaunchStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLaunchStore must be used within LaunchSequenceProvider");
  return v;
}

// Re-renders only when the phase string changes.
export function useLaunchPhase() {
  const { subscribe, getPhase } = useLaunchStore();
  return useSyncExternalStore(
    (cb) => subscribe((phaseChanged) => phaseChanged && cb()),
    getPhase,
    () => "ignition"
  );
}

// Imperative progress reader for rAF loops (no re-render).
export function useLaunchProgressRef() {
  const { subscribe, getProgress } = useLaunchStore();
  return { subscribe, getProgress };
}
```

- [ ] **Step 2: Type/compile check**

Run: `npm run build`
Expected: build succeeds (route still renders the stub root). If build fails, fix before continuing.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/LaunchSequenceContext.jsx
git commit -m "feat(v12): LaunchSequenceContext with subscriber store"
```

---

### Task 6: useLaunchScroll (Lenis + GSAP wiring)

**Files:**
- Create: `tma-web/components/portfolio-v12/useLaunchScroll.js`

- [ ] **Step 1: Implement the hook**

`tma-web/components/portfolio-v12/useLaunchScroll.js`:

```js
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLaunchStore } from "./LaunchSequenceContext.jsx";

gsap.registerPlugin(ScrollTrigger);

/**
 * Mounts Lenis smooth scroll, drives GSAP ScrollTrigger from it, and writes
 * page scroll progress (0..1) into LaunchSequenceContext. Respects
 * prefers-reduced-motion by skipping Lenis (native scroll) but still tracking progress.
 */
export function useLaunchScroll(rootRef) {
  const { setProgress } = useLaunchStore();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis;

    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      ScrollTrigger.defaults({ scroller: window });
    }

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };

    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: update });
    update();
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
      st.kill();
      if (lenis) {
        gsap.ticker.remove((t) => lenis.raf(t * 1000));
        lenis.destroy();
      }
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [rootRef, setProgress]);
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/useLaunchScroll.js
git commit -m "feat(v12): useLaunchScroll Lenis+ScrollTrigger progress wiring"
```

---

### Task 7: v12.css tokens

**Files:**
- Create: `tma-web/components/portfolio-v12/v12.css`

- [ ] **Step 1: Create the stylesheet**

`tma-web/components/portfolio-v12/v12.css`:

```css
.v12 {
  --v12-black: #050506;
  --v12-graphite: #111114;
  --v12-silver: #9aa0a8;
  --v12-white: #f4f5f7;
  --v12-blue: #2e6bff;
  --v12-glow: #ff6a1a;
  --ease-launch: cubic-bezier(0.16, 1, 0.3, 1);

  background: var(--v12-black);
  color: var(--v12-white);
  font-family: var(--font-space-grotesk), system-ui, sans-serif;
  overflow-x: hidden;
}

.v12 section { position: relative; }

.v12-h {
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.02em;
  font-size: clamp(2.5rem, 9vw, 11rem);
  margin: 0;
}

.v12-sub {
  color: var(--v12-silver);
  font-size: clamp(1rem, 1.6vw, 1.4rem);
  max-width: 38ch;
  line-height: 1.5;
}

.v12-fixed-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.v12-content { position: relative; z-index: 1; }

.v12-pin {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6vw;
}

@media (prefers-reduced-motion: reduce) {
  .v12 * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v12/v12.css
git commit -m "feat(v12): scoped design tokens and base styles"
```

---

### Task 8: AtmosphereLayer

**Files:**
- Create: `tma-web/components/portfolio-v12/AtmosphereLayer.jsx`

- [ ] **Step 1: Implement**

2D canvas ember field; particle count/speed/hue interpolate off scroll progress; paused when tab hidden; disabled under reduced motion (CSS glow only).

`tma-web/components/portfolio-v12/AtmosphereLayer.jsx`:

```jsx
"use client";

import { useEffect, useRef } from "react";
import { useLaunchProgressRef } from "./LaunchSequenceContext.jsx";

const MAX = 140;

export default function AtmosphereLayer() {
  const canvasRef = useRef(null);
  const { getProgress } = useLaunchProgressRef();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf, w, h, dpr;
    const parts = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = () => ({
      x: Math.random() * w,
      y: h + Math.random() * h * 0.3,
      r: (Math.random() * 2 + 0.5) * dpr,
      vy: -(Math.random() * 0.4 + 0.2) * dpr,
      vx: (Math.random() - 0.5) * 0.3 * dpr,
      life: Math.random(),
    });
    for (let i = 0; i < MAX; i++) parts.push(spawn());

    const draw = () => {
      const p = getProgress();
      const active = Math.floor(20 + p * (MAX - 20));
      const speed = 1 + p * 3.2;
      const hue = 24 + p * 6; // ember orange, warms slightly
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < active; i++) {
        const a = parts[i];
        a.y += a.vy * speed;
        a.x += a.vx * speed;
        a.life -= 0.004 * speed;
        if (a.y < -10 || a.life <= 0) Object.assign(a, spawn());
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue}, 95%, ${55 + p * 10}%, ${0.12 + a.life * 0.5})`;
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);
    if (!reduced) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [getProgress]);

  return (
    <div className="v12-fixed-layer" aria-hidden="true">
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 100%, rgba(255,106,26,0.18), transparent 60%), radial-gradient(100% 60% at 50% 0%, rgba(46,107,255,0.10), transparent 55%)",
        }}
      />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/AtmosphereLayer.jsx
git commit -m "feat(v12): progress-reactive atmosphere particle layer"
```

---

### Task 9: HUD

**Files:**
- Create: `tma-web/components/portfolio-v12/HUD.jsx`

- [ ] **Step 1: Implement**

`tma-web/components/portfolio-v12/HUD.jsx`:

```jsx
"use client";

import { useEffect, useRef } from "react";
import { useLaunchProgressRef } from "./LaunchSequenceContext.jsx";

export default function HUD() {
  const altRef = useRef(null);
  const velRef = useRef(null);
  const { getProgress } = useLaunchProgressRef();

  useEffect(() => {
    let raf;
    const tick = () => {
      const p = getProgress();
      if (altRef.current) altRef.current.textContent = (p * 420).toFixed(1).padStart(5, "0");
      if (velRef.current) velRef.current.textContent = (p * 27).toFixed(2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getProgress]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", left: "2vw", bottom: "2vh", zIndex: 4,
        fontVariantNumeric: "tabular-nums", fontSize: "0.72rem",
        letterSpacing: "0.18em", color: "var(--v12-silver)", pointerEvents: "none",
      }}
    >
      <div>ALT <span ref={altRef}>000.0</span> KM</div>
      <div>VEL ↑ <span ref={velRef}>0.00</span> KM/S</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add tma-web/components/portfolio-v12/HUD.jsx
git commit -m "feat(v12): telemetry HUD"
```

---

### Task 10: AudioController (Web Audio synthesis, default OFF)

**Files:**
- Create: `tma-web/components/portfolio-v12/AudioController.jsx`

- [ ] **Step 1: Implement**

Synthesized ambient rumble (low oscillator + gain), starts muted, toggled by a button. No autoplay; AudioContext created on first user gesture (browser requirement).

`tma-web/components/portfolio-v12/AudioController.jsx`:

```jsx
"use client";

import { useRef, useState, useCallback } from "react";

export default function AudioController() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);

  const start = useCallback(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 42;
    const gain = ctx.createGain();
    gain.gain.value = 0.0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);
    ctxRef.current = ctx;
    nodesRef.current = { osc, gain };
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const n = nodesRef.current;
    if (!ctx || !n) return;
    n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => { try { n.osc.stop(); ctx.close(); } catch {} }, 500);
    ctxRef.current = null;
    nodesRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      if (next) start();
      else stop();
      return next;
    });
  }, [start, stop]);

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute launch audio" : "Enable launch audio"}
      style={{
        position: "fixed", right: "2vw", bottom: "2vh", zIndex: 5,
        background: "transparent", border: "1px solid rgba(244,245,247,0.25)",
        color: "var(--v12-silver)", padding: "0.5rem 0.8rem", borderRadius: 999,
        fontSize: "0.7rem", letterSpacing: "0.18em", cursor: "pointer",
      }}
    >
      {on ? "◼ SOUND ON" : "▶ SOUND OFF"}
    </button>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds (note: `window.webkitAudioContext` may need a lint-safe access — if build complains, use `window["webkitAudioContext"]`).

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/AudioController.jsx
git commit -m "feat(v12): synthesized opt-in audio controller (default off)"
```

---

## Phase 2 — Sections 1–2 + experience shell

### Task 11: V12Experience shell + font wiring + assemble layers

**Files:**
- Read: `node_modules/next/dist/docs/01-app` (font section) if not already
- Modify: `tma-web/app/layout.jsx` (add Space Grotesk font variable) — **inspect current file first**
- Create: `tma-web/components/portfolio-v12/V12Experience.jsx`
- Rewrite: `tma-web/components/portfolio-v12/V12ClientRoot.jsx`

- [ ] **Step 1: Inspect layout + font setup**

Read `tma-web/app/layout.jsx`. If a `next/font` is already configured, reuse its pattern. Add Space Grotesk:

```jsx
// in app/layout.jsx, alongside existing font imports:
import { Space_Grotesk } from "next/font/google";
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});
// add spaceGrotesk.variable to the existing <body> or <html> className list (do not remove existing classes)
```

If unsure about `next/font` API in this Next version, re-check the docs guide before editing.

- [ ] **Step 2: Create V12Experience (sections wired as stubs for now)**

`tma-web/components/portfolio-v12/V12Experience.jsx`:

```jsx
"use client";

import OpeningSequence from "./sections/01-OpeningSequence.jsx";
import Philosophy from "./sections/02-Philosophy.jsx";
import Ecosystem from "./sections/03-Ecosystem.jsx";
import FeaturedProjects from "./sections/04-FeaturedProjects.jsx";
import MotionReel from "./sections/05-MotionReel.jsx";
import BehindTheMotion from "./sections/06-BehindTheMotion.jsx";
import SocialProof from "./sections/07-SocialProof.jsx";
import Climax from "./sections/08-Climax.jsx";
import FinalCTA from "./sections/09-FinalCTA.jsx";

export default function V12Experience() {
  return (
    <div className="v12-content">
      <OpeningSequence />
      <Philosophy />
      <Ecosystem />
      <FeaturedProjects />
      <MotionReel />
      <BehindTheMotion />
      <SocialProof />
      <Climax />
      <FinalCTA />
    </div>
  );
}
```

- [ ] **Step 3: Create the 7 not-yet-built sections as minimal stubs** so the import graph compiles

For each of `sections/03-Ecosystem.jsx`, `04-FeaturedProjects.jsx`, `05-MotionReel.jsx`, `06-BehindTheMotion.jsx`, `07-SocialProof.jsx`, `08-Climax.jsx`, `09-FinalCTA.jsx` create:

```jsx
"use client";
export default function Stub() {
  return <section style={{ minHeight: "60vh" }} />;
}
```

(Each file's component name should match its purpose, e.g. `Ecosystem`, `FinalCTA` — they get replaced in later tasks.)

- [ ] **Step 4: Rewrite V12ClientRoot to assemble everything**

`tma-web/components/portfolio-v12/V12ClientRoot.jsx`:

```jsx
"use client";

import { useRef } from "react";
import "./v12.css";
import { LaunchSequenceProvider } from "./LaunchSequenceContext.jsx";
import { useLaunchScroll } from "./useLaunchScroll.js";
import AtmosphereLayer from "./AtmosphereLayer.jsx";
import HUD from "./HUD.jsx";
import AudioController from "./AudioController.jsx";
import V12Experience from "./V12Experience.jsx";

function Inner() {
  const rootRef = useRef(null);
  useLaunchScroll(rootRef);
  return (
    <main ref={rootRef} className="v12" data-v12-root>
      <a href="#v12-main" className="v12-skip" style={{ position: "absolute", left: -9999 }}>
        Skip to content
      </a>
      <AtmosphereLayer />
      <div id="v12-main">
        <V12Experience />
      </div>
      <HUD />
      <AudioController />
    </main>
  );
}

export default function V12ClientRoot() {
  return (
    <LaunchSequenceProvider>
      <Inner />
    </LaunchSequenceProvider>
  );
}
```

- [ ] **Step 5: Build + manual smoke**

Run: `npm run build` then `npm run dev`, open `/portfolio-v12`. Expected: scrolls smoothly (Lenis), atmosphere visible, HUD numbers climb on scroll, sound toggle present. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add tma-web/app/layout.jsx tma-web/components/portfolio-v12
git commit -m "feat(v12): assemble experience shell, layers, font wiring"
```

---

### Task 12: Section 1 — Opening Sequence

**Files:**
- Create (replace stub): `tma-web/components/portfolio-v12/sections/01-OpeningSequence.jsx`

- [ ] **Step 1: Implement**

```jsx
"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { opening } from "@/data/portfolio-v12.js";

export default function OpeningSequence() {
  const ref = useRef(null);
  const rise = {
    hidden: { y: "110%" },
    show: (i) => ({ y: "0%", transition: { duration: 1.1, delay: 0.2 + i * 0.5, ease: [0.16, 1, 0.3, 1] } }),
  };
  return (
    <section ref={ref} style={{ minHeight: "180vh" }}>
      <div className="v12-pin" style={{ position: "sticky", top: 0, flexDirection: "column", textAlign: "center" }}>
        <h1 className="v12-h" aria-label={`${opening.line1} ${opening.line2}`}>
          {[opening.line1, opening.line2].map((line, i) => (
            <span key={i} style={{ display: "block", overflow: "hidden" }}>
              <motion.span style={{ display: "block" }} variants={rise} custom={i} initial="hidden" animate="show">
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          className="v12-sub"
          style={{ marginTop: "2rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1.6, duration: 1.2 } }}
        >
          {opening.sub}
        </motion.p>
        <motion.div
          aria-hidden="true"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1, transition: { delay: 2.2, duration: 1 } }}
          style={{ marginTop: "3rem", width: 1, height: 64, background: "var(--v12-glow)", transformOrigin: "top" }}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build + visual smoke**

Run: `npm run build`; `npm run dev`; open `/portfolio-v12`. Expected: "We don't build brands." / "We launch them." rise in; subhead fades; igniting line draws. Stop server.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/sections/01-OpeningSequence.jsx
git commit -m "feat(v12): section 1 opening sequence"
```

---

### Task 13: Section 2 — The Philosophy

**Files:**
- Create (replace stub): `tma-web/components/portfolio-v12/sections/02-Philosophy.jsx`

- [ ] **Step 1: Implement (pinned, GSAP-scrubbed statement swaps)**

```jsx
"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { philosophy } from "@/data/portfolio-v12.js";

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray(".v12-phil-line");
      gsap.set(lines, { opacity: 0, scale: 1.25, filter: "blur(14px)" });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "+=300%", pin: true, scrub: 1 },
      });
      lines.forEach((l) => {
        tl.to(l, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1 })
          .to(l, { opacity: 0, scale: 0.85, filter: "blur(10px)", duration: 1 }, "+=0.6");
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label="Philosophy">
      <div className="v12-pin" style={{ position: "relative" }}>
        {philosophy.map((line, i) => (
          <p
            key={i}
            className="v12-phil-line v12-h"
            style={{ position: "absolute", maxWidth: "16ch", textAlign: "center" }}
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build + scroll smoke**

Run: `npm run build`; `npm run dev`; scroll through Section 2. Expected: section pins; three statements swap with scale+blur as you scroll; un-pins cleanly. Stop server.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/sections/02-Philosophy.jsx
git commit -m "feat(v12): section 2 philosophy pinned scrub"
```

---

## Phase 3 — Section 3 Ecosystem (R3F)

### Task 14: EcosystemScene (R3F) + CSS fallback section

**Files:**
- Create: `tma-web/components/portfolio-v12/EcosystemScene.jsx`
- Create (replace stub): `tma-web/components/portfolio-v12/sections/03-Ecosystem.jsx`

- [ ] **Step 1: Read the next/dynamic guide**

Confirm the `next/dynamic` API + `ssr: false` usage for this Next version in `node_modules/next/dist/docs/01-app`.

- [ ] **Step 2: Implement the R3F scene**

`tma-web/components/portfolio-v12/EcosystemScene.jsx`:

```jsx
"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { services } from "@/data/portfolio-v12.js";

function Node({ angle, radius, label, desc, onPick }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.15 + angle;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 0.6) * 1.2, Math.sin(t) * radius);
  });
  return (
    <group ref={ref}>
      <mesh onPointerOver={() => onPick({ label, desc })} onPointerOut={() => onPick(null)}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color="#2e6bff" />
      </mesh>
      <Billboard>
        <Text fontSize={0.22} color="#f4f5f7" anchorX="center" position={[0, 0.35, 0]}>
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

export default function EcosystemScene() {
  const [pick, setPick] = useState(null);
  return (
    <>
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]} frameloop="always">
        <ambientLight intensity={1} />
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color="#ff6a1a" />
        </mesh>
        {services.map((s, i) => (
          <Node
            key={s.name}
            angle={(i / services.length) * Math.PI * 2}
            radius={3.4}
            label={s.name}
            desc={s.desc}
            onPick={setPick}
          />
        ))}
      </Canvas>
      <div
        aria-live="polite"
        style={{
          position: "absolute", left: "6vw", bottom: "8vh", maxWidth: "34ch",
          color: "var(--v12-silver)", minHeight: "4.5rem",
        }}
      >
        {pick ? (
          <>
            <strong style={{ color: "var(--v12-white)" }}>{pick.label}</strong>
            <p style={{ margin: ".4rem 0 0" }}>{pick.desc}</p>
          </>
        ) : (
          <span>Hover a node to explore the ecosystem.</span>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Implement the section wrapper with lazy load + reduced-motion/mobile fallback**

`tma-web/components/portfolio-v12/sections/03-Ecosystem.jsx`:

```jsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { services } from "@/data/portfolio-v12.js";

const EcosystemScene = dynamic(() => import("../EcosystemScene.jsx"), { ssr: false });

export default function Ecosystem() {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 820px)").matches;
    if (reduced || small) { setFallback(true); return; }
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShow(true),
      { rootMargin: "200px" }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} aria-label="The Ecosystem" style={{ minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "absolute", top: "6vh", left: "6vw", zIndex: 1 }}>
        <h2 className="v12-h" style={{ fontSize: "clamp(2rem,5vw,4rem)" }}>The Ecosystem</h2>
      </div>
      {fallback ? (
        <ul style={{ display: "grid", gap: "1rem", padding: "20vh 6vw 6vh", listStyle: "none" }}>
          {services.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong>
              <p className="v12-sub">{s.desc}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ position: "absolute", inset: 0 }}>{show && <EcosystemScene />}</div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Build + smoke (desktop and 800px)**

Run: `npm run build`; `npm run dev`. Desktop: orbiting nodes, hover shows real service copy. Resize < 820px: list fallback renders, no canvas. Stop server.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v12/EcosystemScene.jsx tma-web/components/portfolio-v12/sections/03-Ecosystem.jsx
git commit -m "feat(v12): section 3 R3F ecosystem with fallback"
```

---

## Phase 4 — Section 4 Featured Projects

### Task 15: ProjectChapter (deep + mid variants)

**Files:**
- Create: `tma-web/components/portfolio-v12/ProjectChapter.jsx`

- [ ] **Step 1: Implement**

```jsx
"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function Beat({ kicker, items }) {
  return (
    <div className="v12-beat" style={{ maxWidth: "52ch" }}>
      <span style={{ color: "var(--v12-glow)", letterSpacing: ".2em", fontSize: ".8rem" }}>{kicker}</span>
      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem", display: "grid", gap: ".8rem" }}>
        {items.map((t, i) => (
          <li key={i} className="v12-sub" style={{ maxWidth: "none" }}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function DeepChapter({ data }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const beats = gsap.utils.toArray(".v12-beat", ref.current);
      gsap.set(beats, { opacity: 0, y: 40 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "+=400%", pin: true, scrub: 1 },
      });
      beats.forEach((b) => {
        tl.to(b, { opacity: 1, y: 0, duration: 1 }).to(b, { opacity: 0, y: -40, duration: 1 }, "+=0.5");
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label={`${data.client} case study`} style={{ position: "relative" }}>
      <div className="v12-pin" style={{ position: "relative", justifyContent: "flex-start" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
          <Image src={data.cover} alt={`${data.client} — ${data.project}`} fill style={{ objectFit: "cover" }} sizes="100vw" />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(5,5,6,.7), ${data.wash}55)` }} />
        </div>
        <div style={{ position: "relative" }}>
          <h2 className="v12-h">{data.client}</h2>
          <p className="v12-sub">{data.project}</p>
          <div style={{ position: "relative", marginTop: "2rem", minHeight: "40vh" }}>
            <div className="v12-beat" style={{ position: "absolute", maxWidth: "52ch" }}>
              <p className="v12-sub" style={{ maxWidth: "none" }}>{data.intro}</p>
            </div>
            <div style={{ position: "absolute" }}><Beat kicker="THE CHALLENGE" items={data.challenge} /></div>
            <div style={{ position: "absolute" }}><Beat kicker="THE TRANSFORMATION" items={data.transformation} /></div>
            <div className="v12-beat" style={{ position: "absolute" }}>
              <span style={{ color: "var(--v12-glow)", letterSpacing: ".2em", fontSize: ".8rem" }}>THE IMPACT</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1.5rem", marginTop: "1rem" }}>
                {data.impact.map((k) => (
                  <div key={k.value}>
                    <div className="v12-h" style={{ fontSize: "clamp(2rem,4vw,3.5rem)" }}>{k.value}</div>
                    <div className="v12-sub">{k.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MidChapter({ data }) {
  return (
    <section aria-label={`${data.client}`} style={{ position: "relative", height: "100vh" }}>
      <Image src={data.image} alt={data.client} fill style={{ objectFit: "cover", opacity: 0.5 }} sizes="100vw" />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 6vw 12vh", background: "linear-gradient(180deg, transparent, rgba(5,5,6,.85))" }}>
        <h2 className="v12-h" style={{ fontSize: "clamp(2.5rem,7vw,6rem)" }}>{data.client}</h2>
        <p className="v12-sub" style={{ maxWidth: "44ch" }}>{data.line}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/ProjectChapter.jsx
git commit -m "feat(v12): ProjectChapter deep + mid variants"
```

---

### Task 16: Section 4 — Featured Projects composition

**Files:**
- Create (replace stub): `tma-web/components/portfolio-v12/sections/04-FeaturedProjects.jsx`

- [ ] **Step 1: Implement**

```jsx
"use client";

import { DeepChapter, MidChapter } from "../ProjectChapter.jsx";
import { deepCases, midCases } from "@/data/portfolio-v12.js";

export default function FeaturedProjects() {
  return (
    <div aria-label="Featured Projects">
      {deepCases.map((c) => (
        <DeepChapter key={c.id} data={c} />
      ))}
      {midCases.map((m) => (
        <MidChapter key={m.id} data={m} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Build + scroll smoke**

Run: `npm run build`; `npm run dev`. Scroll Section 4: Foodics pins and scrubs Intro→Challenge→Transformation→Impact (counters $20.8M / 32,000+ / 35% / $1B), then Zid likewise, then 4 mid full-bleed beats. Stop server.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/sections/04-FeaturedProjects.jsx
git commit -m "feat(v12): section 4 featured projects composition"
```

---

## Phase 5 — Sections 5–6

### Task 17: Section 5 — Motion Reel

**Files:**
- Create (replace stub): `tma-web/components/portfolio-v12/sections/05-MotionReel.jsx`

- [ ] **Step 1: Implement (horizontal scrub of real campaign frames)**

```jsx
"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reel } from "@/data/portfolio-v12.js";

gsap.registerPlugin(ScrollTrigger);

export default function MotionReel() {
  const ref = useRef(null);
  const trackRef = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      const dist = track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: -dist,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: () => `+=${dist}`, pin: true, scrub: 1, invalidateOnRefresh: true },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label="Motion Reel" style={{ overflow: "hidden", height: "100vh" }}>
      <div ref={trackRef} style={{ display: "flex", height: "100vh", alignItems: "center", gap: "2vw", padding: "0 6vw", willChange: "transform" }}>
        <h2 className="v12-h" style={{ flex: "0 0 auto", marginRight: "4vw" }}>The Reel</h2>
        {reel.map((src, i) => (
          <div key={src} style={{ flex: "0 0 60vw", height: "70vh", position: "relative" }}>
            <Image src={src} alt={`Campaign frame ${i + 1}`} fill style={{ objectFit: "cover" }} sizes="60vw" />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build + smoke**

Run: `npm run build`; `npm run dev`. Section 5 pins and scrubs horizontally through real campaign frames. Stop server.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/sections/05-MotionReel.jsx
git commit -m "feat(v12): section 5 motion reel horizontal scrub"
```

---

### Task 18: Section 6 — Behind the Motion

**Files:**
- Create (replace stub): `tma-web/components/portfolio-v12/sections/06-BehindTheMotion.jsx`

- [ ] **Step 1: Implement**

```jsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { process } from "@/data/portfolio-v12.js";

export default function BehindTheMotion() {
  return (
    <section aria-label="Behind the Motion" style={{ padding: "16vh 6vw" }}>
      <h2 className="v12-h" style={{ marginBottom: "6vh" }}>Behind the motion</h2>
      <div style={{ display: "grid", gap: "10vh" }}>
        {process.map((p, i) => (
          <motion.div
            key={p.phase}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4vw", alignItems: "center", direction: i % 2 ? "rtl" : "ltr" }}
          >
            <div style={{ direction: "ltr", position: "relative", aspectRatio: "16/10" }}>
              <Image src={p.image} alt={p.phase} fill style={{ objectFit: "cover" }} sizes="50vw" />
            </div>
            <div style={{ direction: "ltr" }}>
              <h3 className="v12-h" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>{p.phase}</h3>
              <p className="v12-sub">{p.copy}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build + smoke; Step 3: Commit**

Run `npm run build`; visual check; then:

```bash
git add tma-web/components/portfolio-v12/sections/06-BehindTheMotion.jsx
git commit -m "feat(v12): section 6 behind the motion"
```

---

## Phase 6 — Sections 7–9

### Task 19: Section 7 — Social Proof

**Files:**
- Create (replace stub): `tma-web/components/portfolio-v12/sections/07-SocialProof.jsx`

- [ ] **Step 1: Implement (floating logos + manifesto + stats; NO testimonials)**

```jsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { clients, manifestoQuote, stats } from "@/data/portfolio-v12.js";

export default function SocialProof() {
  return (
    <section aria-label="Clients and manifesto" style={{ padding: "16vh 6vw" }}>
      <motion.blockquote
        className="v12-h"
        style={{ fontSize: "clamp(1.8rem,4.5vw,4rem)", maxWidth: "20ch", margin: "0 0 12vh" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {manifestoQuote}
      </motion.blockquote>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: "1.5rem", marginBottom: "12vh" }}>
        {clients.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 0.65, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 8) * 0.05, duration: 0.6 }}
            style={{ position: "relative", aspectRatio: "3/2", filter: "grayscale(1) brightness(1.6)" }}
          >
            <Image src={src} alt="" fill style={{ objectFit: "contain" }} sizes="120px" />
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "2rem" }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div className="v12-h" style={{ fontSize: "clamp(2.5rem,6vw,5rem)" }}>{s.value}</div>
            <div className="v12-sub" style={{ textTransform: "uppercase", letterSpacing: ".15em" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build + smoke; Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/sections/07-SocialProof.jsx
git commit -m "feat(v12): section 7 social proof (logos + manifesto + stats)"
```

---

### Task 20: Section 8 — The Climax

**Files:**
- Create (replace stub): `tma-web/components/portfolio-v12/sections/08-Climax.jsx`

- [ ] **Step 1: Implement**

```jsx
"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { climax } from "@/data/portfolio-v12.js";

gsap.registerPlugin(ScrollTrigger);

export default function Climax() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray(".v12-climax-line");
      gsap.set(lines, { opacity: 0, scale: 1.3 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "+=250%", pin: true, scrub: 1 },
      });
      lines.forEach((l) => tl.to(l, { opacity: 1, scale: 1, duration: 1 }).to(l, { opacity: 0, duration: 1 }, "+=0.7"));
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label="Climax">
      <div className="v12-pin" style={{ position: "relative", textAlign: "center" }}>
        {climax.map((line) => (
          <h2 key={line} className="v12-climax-line v12-h" style={{ position: "absolute", maxWidth: "14ch" }}>
            {line}
          </h2>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build + smoke; Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/sections/08-Climax.jsx
git commit -m "feat(v12): section 8 climax"
```

---

### Task 21: Section 9 — Final CTA

**Files:**
- Create (replace stub): `tma-web/components/portfolio-v12/sections/09-FinalCTA.jsx`

- [ ] **Step 1: Implement**

```jsx
"use client";

import { motion } from "framer-motion";
import { cta, contact } from "@/data/portfolio-v12.js";

export default function FinalCTA() {
  return (
    <section aria-label="Initiate project" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 6vw", gap: "2.5rem" }}>
      <motion.h2 className="v12-h" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}>
        {cta.kicker}
      </motion.h2>
      <motion.a
        href={`mailto:${contact.email}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{ border: "1px solid var(--v12-glow)", color: "var(--v12-white)", padding: "1.1rem 2.4rem", borderRadius: 999, letterSpacing: ".22em", textDecoration: "none", fontSize: ".9rem" }}
      >
        {cta.button}
      </motion.a>
      <footer className="v12-sub" style={{ maxWidth: "none", marginTop: "4rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "2rem", width: "100%", textAlign: "left" }}>
        {contact.offices.map((o) => (
          <div key={o.city}>
            <strong style={{ color: "var(--v12-white)" }}>{o.city}</strong>
            <div>{o.address}</div>
            <div>{o.tel}</div>
          </div>
        ))}
        <div>
          <a href={`mailto:${contact.email}`} style={{ color: "var(--v12-silver)" }}>{contact.email}</a>
          <div>{contact.site}</div>
        </div>
      </footer>
    </section>
  );
}
```

- [ ] **Step 2: Build + smoke; Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/sections/09-FinalCTA.jsx
git commit -m "feat(v12): section 9 final CTA + footer"
```

---

## Phase 7 — Integration hardening

### Task 22: ScrollTrigger refresh + section isolation pass

**Files:**
- Modify: `tma-web/components/portfolio-v12/useLaunchScroll.js`

- [ ] **Step 1: Add a refresh after mount/layout**

In `useLaunchScroll.js`, inside the `useEffect`, after `update();` add:

```js
const refreshId = setTimeout(() => ScrollTrigger.refresh(), 300);
```

and in the cleanup return, add `clearTimeout(refreshId);`.

- [ ] **Step 2: Full manual scroll-through**

Run: `npm run dev`. Scroll the entire page top→bottom slowly. Verify: no pinned section overlaps the next, atmosphere intensifies continuously, HUD climbs to ~420 KM at the end, no console errors. Stop server.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v12/useLaunchScroll.js
git commit -m "fix(v12): ScrollTrigger refresh after layout for clean pin handoff"
```

---

### Task 23: Reduced-motion + build gate

- [ ] **Step 1: Verify reduced-motion path**

Run: `npm run dev`. In Chrome DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Reload `/portfolio-v12`. Verify: no particle animation, no GSAP pinning (sections are plain stacked, all text readable), ecosystem shows list fallback, page fully scrollable, all content present. Stop server.

- [ ] **Step 2: Production build gate**

Run: `npm run build`
Expected: compiles with no errors. Fix any error before continuing (re-check Next docs for any deprecated API flagged).

- [ ] **Step 3: Unit suite green**

Run: `npm test`
Expected: all data + phase tests PASS.

- [ ] **Step 4: Commit (only if fixes were needed)**

```bash
git add -A tma-web
git commit -m "fix(v12): reduced-motion + build gate hardening"
```

(Skip the commit if nothing changed.)

---

## Phase 8 — Playwright visual + behavior verification

### Task 24: V12 e2e spec

**Files:**
- Create: `tma-web/playwright/tests/v12.spec.js`

- [ ] **Step 1: Write the spec**

`tma-web/playwright/tests/v12.spec.js`:

```js
import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("V12 launch sequence", () => {
  test("opening type, phase captures, CTA, no overflow", async ({ page }) => {
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(`${BASE}/portfolio-v12`, { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toContainText("We launch them.");

    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = await page.evaluate(() => window.innerHeight);
    const steps = [0, 0.25, 0.5, 0.75, 1];
    for (const s of steps) {
      await page.evaluate((y) => window.scrollTo(0, y), s * (height - vh));
      await page.waitForTimeout(900);
      await page.screenshot({ path: `v12-phase-${Math.round(s * 100)}.png`, fullPage: false });
    }

    // Foodics + Zid impact numbers are reachable in the DOM
    await expect(page.getByText("$20.8M")).toBeAttached();
    await expect(page.getByText("200%")).toBeAttached();

    // CTA mailto
    const cta = page.getByRole("link", { name: "INITIATE PROJECT" });
    await expect(cta).toHaveAttribute("href", "mailto:info@themotionagency.net");

    // No horizontal overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);

    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("mobile: ecosystem fallback, no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/portfolio-v12`, { waitUntil: "networkidle" });
    await expect(page.getByText("Brand Strategy & Positioning")).toBeAttached();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run against local dev server**

In one terminal: `npm run dev`.
In another: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v12.spec.js --project=desktop-1920 --project=mobile-375`
(PowerShell: `$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npx playwright test v12.spec.js --project=desktop-1920 --project=mobile-375`)
Expected: both tests PASS; `v12-phase-*.png` files written.

- [ ] **Step 3: Visual review (human gate)**

Open the 5 `v12-phase-*.png` screenshots. Confirm with the user: opening reveal, philosophy, ecosystem, Foodics/Zid chapters, reel, climax, CTA all read as intended and feel cinematic. Iterate on any section that looks wrong (return to that section's task).

- [ ] **Step 4: Commit**

```bash
git add tma-web/playwright/tests/v12.spec.js
git commit -m "test(v12): playwright phase-capture + behavior smoke"
```

---

### Task 25: Final verification + done

- [ ] **Step 1: Full gate**

Run, in order:
- `npm test` → all PASS
- `npm run build` → no errors
- dev server + `npx playwright test v12.spec.js` (desktop + mobile) → PASS
- Manual: reduced-motion scroll-through clean; no console errors desktop + mobile

- [ ] **Step 2: Confirm Definition of Done (spec §7)**

All true: data tests green · build clean · reduced-motion verified · Playwright phase screenshots captured & user-reviewed · no console errors desktop+mobile.

- [ ] **Step 3: Final commit / branch decision**

Surface to the user: V12 complete on `main` (or current branch). Ask whether they want a PR or to keep on the working branch (per `superpowers:finishing-a-development-branch`).

---

## Self-Review (completed by plan author)

**Spec coverage:** Opening §4.1→T12 · Philosophy §4.2→T13 · Ecosystem §4.3→T14 · Featured §4.4→T15-16 · Reel §4.5→T17 · Behind §4.6→T18 · Social Proof §4.7→T19 · Climax §4.8→T20 · Final CTA §4.9→T21 · Shared infra §3→T4-11 · Motion/visual system §5→T7 + per-section · Performance budget §5→T8/T14 (lazy R3F, capped particles, frameloop) · A11y/fallbacks §5→T14/T23 · Content integrity §6→T3 (tests enforce no GTM dup, 29+ phrasing, no testimonials, real contact) · Testing §7→T3/T4/T23/T24/T25. No spec section is unmapped.

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". Every code step contains complete code. Stub files in T11 are explicitly temporary and replaced by named later tasks.

**Type consistency:** `phaseFor`/`PHASES` (T4) used consistently in T5. Context API `setProgress`/`subscribe`/`getProgress`/`getPhase` + hooks `useLaunchStore`/`useLaunchPhase`/`useLaunchProgressRef` defined T5, consumed unchanged in T6/T8/T9. Data exports (`opening`, `philosophy`, `services`, `deepCases`, `midCases`, `reel`, `process`, `clients`, `manifestoQuote`, `stats`, `climax`, `cta`, `contact`) defined T3, consumed with matching names/shapes in T12-T21. `DeepChapter`/`MidChapter` named exports (T15) imported correctly in T16. No naming drift found.

**Deviations documented:** fonts (Space Grotesk via next/font/google), audio (Web Audio synthesis, no Howler) — both stated up front with rationale; neither violates the approved spec's option set.

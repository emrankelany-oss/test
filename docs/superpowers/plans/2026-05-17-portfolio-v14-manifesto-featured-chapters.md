# Portfolio V14 — Manifesto + Featured Chapters (SP-2B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two SP-0 placeholder probe scenes with three real content scenes — a distilled Manifesto and full-narrative-act Foodics & Zid chapters — driven by a pure, unit-tested phase/metric core and a generic data-driven `ChapterScene`.

**Architecture:** Pure deterministic `chapterActs.js` (`actState` phase/opacity envelope, scrub-driven `metricValue`, deck-string-locking `formatMetric`) unit-tested with `node:test` (the SP-0/1/2A pattern). A generic `ChapterScene.jsx` consumes it from verbatim-deck data files (`chapters/foodics.js`, `chapters/zid.js`); a thin `ManifestoScene.jsx` reuses the same core for staged Slide-3 statements. Wired into `V14Experience` after `IntroFilmScene`; both probes deleted. Verified by node:test + a Playwright chapters spec; SP-0/1/2A specs are regression-guarded.

**Tech Stack:** React 19 / Next 16, the existing `useScene` (pinned ScrollTrigger, SP-0/2A), `node:test`, Playwright. Inline-styled scenes (the established v14 convention; no globals.css).

**Spec:** `docs/superpowers/specs/2026-05-17-portfolio-v14-manifesto-featured-chapters-design.md` (as of commit `63b45d8`).
**Branch:** `feat/portfolio-v14` (continues from SP-0 + SP-1 + SP-2A, all done & verified).

---

## File Structure

Pure core (node:test from `tma-web`):
- `tma-web/components/portfolio-v14/engine/chapterActs.js` — `actState`, `metricValue`, `formatMetric`

Data (node:test — locks verbatim deck strings + shape):
- `tma-web/components/portfolio-v14/chapters/foodics.js`
- `tma-web/components/portfolio-v14/chapters/zid.js`

Components (Playwright-verified):
- `tma-web/components/portfolio-v14/scenes/ChapterScene.jsx` — generic chapter renderer
- `tma-web/components/portfolio-v14/scenes/ManifestoScene.jsx` — staged statement scene
- `tma-web/components/portfolio-v14/V14Experience.jsx` — MODIFY: rewire
- `tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx` — DELETE
- `tma-web/components/portfolio-v14/scenes/ProbeSceneB.jsx` — DELETE

Tests:
- `tma-web/test/v14-chapterActs.test.mjs`, `tma-web/test/v14-chapters-data.test.mjs`
- `tma-web/playwright/tests/v14-chapters.spec.js`

`useScene`/`SceneController`/engine untouched. Tests run from `c:/Users/Pc/Downloads/the-motion-agency-web-main/tma-web`; git from repo root.

---

## Task 1: chapterActs.js — pure phase/metric/format core

**Files:**
- Create: `tma-web/components/portfolio-v14/engine/chapterActs.js`
- Test: `tma-web/test/v14-chapterActs.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-chapterActs.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { actState, metricValue, formatMetric } from "../components/portfolio-v14/engine/chapterActs.js";

const plan = {
  acts: [{ id: "hook", weight: 0.2 }, { id: "problem", weight: 0.3 }, { id: "results", weight: 0.5 }],
  inFrac: 0.2,
  outFrac: 0.2,
};

test("maps progress to the weight-sized act band", () => {
  assert.equal(actState(0.05, plan).id, "hook");        // 0..0.2
  assert.equal(actState(0.30, plan).id, "problem");     // 0.2..0.5
  assert.equal(actState(0.90, plan).id, "results");     // 0.5..1
});

test("local is 0..1 within the act band", () => {
  const s = actState(0.35, plan); // problem band 0.2..0.5, mid
  assert.equal(s.id, "problem");
  assert.ok(Math.abs(s.local - 0.5) < 1e-9, `local ${s.local}`);
});

test("in/hold/out phase + opacity envelope; cross-fade at boundary", () => {
  const hook = actState(0.10, plan); // hook band 0..0.2, local 0.5 → hold
  assert.equal(hook.phase, "hold");
  assert.equal(hook.opacity, 1);
  const entering = actState(0.01, plan); // hook local 0.05 (<0.2 in) → fading in
  assert.equal(entering.phase, "in");
  assert.ok(entering.opacity > 0 && entering.opacity < 1);
  const leaving = actState(0.19, plan); // hook local 0.95 (>0.8) and HAS successor → out
  assert.equal(leaving.phase, "out");
  assert.ok(leaving.opacity < 1);
});

test("final act never out-fades — holds opacity 1 (reduced-motion contract)", () => {
  const end = actState(1, plan); // results is last
  assert.equal(end.id, "results");
  assert.equal(end.opacity, 1);
  assert.notEqual(end.phase, "out");
  const nearEnd = actState(0.999, plan);
  assert.equal(nearEnd.id, "results");
  assert.equal(nearEnd.opacity, 1);
});

test("first act fades in from 0 at progress 0", () => {
  const s = actState(0, plan);
  assert.equal(s.id, "hook");
  assert.equal(s.opacity, 0);
  assert.equal(s.phase, "in");
});

test("progress clamped; empty/missing acts safe; single act; equal weights", () => {
  assert.equal(actState(-1, plan).id, "hook");
  assert.equal(actState(9, plan).id, "results");
  assert.deepEqual(actState(0.5, { acts: [] }), { index: 0, id: null, local: 0, phase: "hold", opacity: 1 });
  assert.deepEqual(actState(0.5, {}), { index: 0, id: null, local: 0, phase: "hold", opacity: 1 });
  assert.equal(actState(0.9, { acts: [{ id: "only", weight: 1 }] }).id, "only");
  const eq = { acts: [{ id: "a", weight: 0 }, { id: "b", weight: 0 }] }; // weights<=0 → equal halves
  assert.equal(actState(0.25, eq).id, "a");
  assert.equal(actState(0.75, eq).id, "b");
});

test("metricValue: endpoints, eased middle, clamp, descending", () => {
  assert.equal(metricValue(0, 8000, 32000), 8000);
  assert.equal(metricValue(1, 8000, 32000), 32000);
  assert.equal(metricValue(-5, 8000, 32000), 8000);
  assert.equal(metricValue(2, 8000, 32000), 32000);
  const mid = metricValue(0.5, 0, 100);
  assert.ok(mid > 0 && mid < 100);
  assert.equal(metricValue(1, 20.8, 15.4), 15.4); // descending ok
});

test("formatMetric locks the exact final deck strings", () => {
  assert.equal(formatMetric(20.8, "$%sM"), "$20.8M");
  assert.equal(formatMetric(32000, "%s+"), "32,000+");
  assert.equal(formatMetric(1, "$%sB"), "$1B");
  assert.equal(formatMetric(200, "%s%"), "200%");
  assert.equal(formatMetric(12000, "%s+"), "12,000+");
  assert.equal(formatMetric(50, "+%s%"), "+50%");
  assert.equal(formatMetric(25, "+%s%"), "+25%");
  assert.equal(formatMetric(18.27, "$%sM"), "$18.3M"); // mid-scroll: one decimal
  assert.equal(formatMetric(20000.4, "%s+"), "20,000+"); // mid-scroll: comma-grouped int
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement chapterActs.js**

Create `tma-web/components/portfolio-v14/engine/chapterActs.js`:

```js
// Pure phase/metric/format core for the V14 narrative chapters. No DOM/time/IO.
function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - clamp01(t), 3);
}

const SAFE_EMPTY = { index: 0, id: null, local: 0, phase: "hold", opacity: 1 };

export function actState(progress, plan) {
  const acts = plan && Array.isArray(plan.acts) ? plan.acts : [];
  if (acts.length === 0) return { ...SAFE_EMPTY };
  const inFrac = plan.inFrac > 0 ? plan.inFrac : 0.2;
  const outFrac = plan.outFrac > 0 ? plan.outFrac : 0.2;

  const raw = acts.map((a) => (a && a.weight > 0 ? a.weight : 0));
  const allPositive = raw.every((w) => w > 0);
  const w = allPositive ? raw : acts.map(() => 1); // any non-positive → all equal
  const sum = w.reduce((a, b) => a + b, 0);

  const p = clamp01(progress);
  let start = 0;
  for (let i = 0; i < acts.length; i++) {
    const frac = w[i] / sum;
    const end = i === acts.length - 1 ? 1 : start + frac;
    const isLast = i === acts.length - 1;
    if (p < end || isLast) {
      const span = end - start || 1;
      const local = clamp01((p - start) / span);
      const hasNext = i < acts.length - 1;
      let phase;
      let opacity;
      if (local < inFrac) {
        phase = "in";
        opacity = easeOutCubic(local / inFrac);
      } else if (local > 1 - outFrac && hasNext) {
        phase = "out";
        opacity = easeOutCubic((1 - local) / outFrac);
      } else {
        phase = "hold";
        opacity = 1;
      }
      return { index: i, id: acts[i].id ?? null, local, phase, opacity };
    }
    start = end;
  }
  // Unreachable (isLast guarantees a return), but stay safe.
  const li = acts.length - 1;
  return { index: li, id: acts[li].id ?? null, local: 1, phase: "hold", opacity: 1 };
}

export function metricValue(local, from, to, ease = easeOutCubic) {
  const k = clamp01(local);
  if (k <= 0) return from;
  if (k >= 1) return to;
  return from + (to - from) * ease(k);
}

export function formatMetric(value, format) {
  const abs = Math.abs(value);
  let s;
  if (abs >= 1000) {
    s = Math.round(value).toLocaleString("en-US");
  } else if (Number.isInteger(value)) {
    s = String(value);
  } else {
    s = String(Math.round(value * 10) / 10);
  }
  return format.replace("%s", s);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS — the 8 new `v14-chapterActs` tests; all pre-existing (54) still green.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/engine/chapterActs.js tma-web/test/v14-chapterActs.test.mjs
git commit -m "feat(v14): pure chapter act-state, scrub metric, deck formatter"
```

---

## Task 2: Verbatim deck data files (Foodics + Zid)

**Files:**
- Create: `tma-web/components/portfolio-v14/chapters/foodics.js`
- Create: `tma-web/components/portfolio-v14/chapters/zid.js`
- Test: `tma-web/test/v14-chapters-data.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-chapters-data.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { foodics } from "../components/portfolio-v14/chapters/foodics.js";
import { zid } from "../components/portfolio-v14/chapters/zid.js";
import { formatMetric } from "../components/portfolio-v14/engine/chapterActs.js";

function check(ch, id, order, n) {
  assert.equal(ch.id, id);
  assert.equal(ch.order, order);
  assert.equal(ch.acts.length, 4);
  assert.deepEqual(ch.acts.map((a) => a.id), ch.plan.acts.map((a) => a.id)); // parity
  assert.deepEqual(ch.acts.map((a) => a.kind), ["hook", "problem", "solution", "results"]);
  assert.ok(typeof ch.bleed === "string" && typeof ch.accent === "string");
  assert.ok(ch.image.startsWith("/assets/"));
}

test("foodics shape + verbatim final metric strings", () => {
  check(foodics, "foodics", 40);
  const r = foodics.acts[3].metrics;
  assert.equal(formatMetric(r[0].to, r[0].format), "$20.8M");
  assert.equal(formatMetric(r[1].to, r[1].format), "32,000+");
  assert.equal(formatMetric(r[2].to, r[2].format), "$1B");
  assert.equal(foodics.acts[0].headline, "Boundless: Launching What's Next for F&B");
  assert.equal(foodics.acts[1].body.length, 4); // problem bullets
  assert.equal(foodics.acts[2].body.length, 4); // solution bullets
});

test("zid shape + verbatim final metric strings", () => {
  check(zid, "zid", 50);
  const r = zid.acts[3].metrics;
  assert.equal(formatMetric(r[0].to, r[0].format), "200%");
  assert.equal(formatMetric(r[1].to, r[1].format), "12,000+");
  assert.equal(formatMetric(r[2].to, r[2].format), "+50%");
  assert.equal(formatMetric(r[3].to, r[3].format), "+25%");
  assert.equal(zid.acts[0].headline, "Ripple: Launching the Total Commerce Era");
  assert.equal(zid.acts[1].body.length, 3); // problem bullets
  assert.equal(zid.acts[2].body.length, 4); // solution bullets
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the data files**

Create `tma-web/components/portfolio-v14/chapters/foodics.js`:

```js
export const foodics = {
  id: "foodics",
  order: 40,
  viewports: 6,
  bleed: "#150829",
  accent: "#74D1EA",
  image: "/assets/case-foodics-boundless.png",
  plan: {
    acts: [
      { id: "hook", weight: 0.15 },
      { id: "problem", weight: 0.3 },
      { id: "solution", weight: 0.27 },
      { id: "results", weight: 0.28 },
    ],
    inFrac: 0.2,
    outFrac: 0.2,
  },
  acts: [
    {
      id: "hook",
      kind: "hook",
      label: "FOODICS · BOUNDLESS",
      headline: "Boundless: Launching What's Next for F&B",
    },
    {
      id: "problem",
      kind: "problem",
      label: "THE PROBLEM",
      body: [
        "Evolving from POS provider to a complete F&B growth platform — payments, lending, data, marketplaces.",
        "The market still saw them as just a POS system.",
        "Thousands of restaurant owners needed educating on the new tools.",
        "Clear market leadership had to be established as competition intensified.",
      ],
    },
    {
      id: "solution",
      kind: "solution",
      label: "WHAT WE DID",
      body: [
        "Created a flagship annual stage positioning Foodics as the authority shaping F&B tech.",
        "Crafted end-to-end event narratives — Foodics Pay, Capital, the Marketplace.",
        "Designed experiences that educated and excited: live demos, data, launches.",
        "Transformed perception — no longer a POS provider but the growth engine for F&B.",
      ],
    },
    {
      id: "results",
      kind: "results",
      label: "THE RESULTS",
      metrics: [
        { label: "Revenue", from: 15.4, to: 20.8, format: "$%sM", note: "+35.6% YoY" },
        { label: "Merchants", from: 8000, to: 32000, format: "%s+", note: "35% Saudi market share" },
        { label: "Valuation", from: 0, to: 1, format: "$%sB", note: "unicorn" },
      ],
      support: "Recognized as the F&B growth platform — fueling the trajectory to unicorn status.",
    },
  ],
};
```

Create `tma-web/components/portfolio-v14/chapters/zid.js`:

```js
export const zid = {
  id: "zid",
  order: 50,
  viewports: 6,
  bleed: "#04141c",
  accent: "#4ED1C5",
  image: "/assets/case-zid-ripple.png",
  plan: {
    acts: [
      { id: "hook", weight: 0.15 },
      { id: "problem", weight: 0.27 },
      { id: "solution", weight: 0.3 },
      { id: "results", weight: 0.28 },
    ],
    inFrac: 0.2,
    outFrac: 0.2,
  },
  acts: [
    {
      id: "hook",
      kind: "hook",
      label: "ZID · RIPPLE 2024",
      headline: "Ripple: Launching the Total Commerce Era",
    },
    {
      id: "problem",
      kind: "problem",
      label: "THE PROBLEM",
      body: [
        "Fragmented systems — merchants juggled separate tools for e-commerce, social, and physical retail.",
        "Scale barriers — logistical inefficiencies and disconnected marketing capped growth.",
        "Perception gap — Zid needed to be the unified, future-ready commerce partner, not just a storefront builder.",
      ],
    },
    {
      id: "solution",
      kind: "solution",
      label: "WHAT WE DID",
      body: [
        "Launched Total Commerce — one ecosystem for e-commerce, social, and offline retail.",
        "Hosted the flagship Ripple event in Diriyah with 1,000+ merchants and industry leaders.",
        "Showcased a unified dashboard and cross-border logistics from one interface.",
        "Revealed AI-powered marketing and integrations — TikTok, Amazon, Snapchat, Meta.",
      ],
    },
    {
      id: "results",
      kind: "results",
      label: "THE RESULTS",
      metrics: [
        { label: "YoY growth", from: 0, to: 200, format: "%s%", note: "revitalized brand" },
        { label: "Active merchants", from: 0, to: 12000, format: "%s+", note: "+30% in 2024" },
        { label: "Basket & conversion", from: 0, to: 50, format: "+%s%", note: "both up" },
        { label: "GMV", from: 0, to: 25, format: "+%s%", note: "YoY" },
      ],
      support: "Unified perception — Zid as the go-to Total Commerce solution, not just a storebuilder.",
    },
  ],
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS — the 2 new `v14-chapters-data` tests; all prior green.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/chapters tma-web/test/v14-chapters-data.test.mjs
git commit -m "feat(v14): verbatim Foodics + Zid chapter data (deck-locked)"
```

---

## Task 3: ChapterScene.jsx — generic chapter renderer

**Files:**
- Create: `tma-web/components/portfolio-v14/scenes/ChapterScene.jsx`

(No node:test — React/DOM; verified by the Playwright spec in Task 6.)

- [ ] **Step 1: Implement ChapterScene.jsx**

Create `tma-web/components/portfolio-v14/scenes/ChapterScene.jsx`:

```jsx
"use client";
import { useState } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";
import { actState, metricValue, formatMetric } from "@/components/portfolio-v14/engine/chapterActs";

export default function ChapterScene({ chapter }) {
  const [p, setP] = useState(0);
  const ref = useScene({
    id: chapter.id,
    order: chapter.order,
    viewports: chapter.viewports,
    bleed: chapter.bleed,
    onProgress: setP,
  });

  const s = actState(p, chapter.plan);
  const act = chapter.acts[s.index] || {};
  const bookend = act.kind === "hook" || act.kind === "results";
  const rise = (1 - s.opacity) * 6; // px-ish vh translate as it fades in/out

  return (
    <section
      ref={ref}
      data-scene={chapter.id}
      data-act={act.id || ""}
      style={{
        height: "100vh",
        background: chapter.bleed,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {bookend && chapter.image && (
        <img
          src={chapter.image}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.4)",
            opacity: s.opacity,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "grid",
          placeItems: "center",
          padding: "8vw",
          textAlign: act.kind === "results" ? "center" : "left",
          opacity: s.opacity,
          transform: `translateY(${rise}vh)`,
        }}
      >
        <div style={{ maxWidth: "1100px", width: "100%" }}>
          {act.label && (
            <div
              style={{
                fontSize: "0.95rem",
                letterSpacing: "0.32em",
                color: chapter.accent,
                marginBottom: "1.4rem",
              }}
            >
              {act.label}
            </div>
          )}
          {act.headline && (
            <h2 style={{ fontSize: "clamp(2.4rem, 6vw, 5.5rem)", lineHeight: 1.05, margin: 0 }}>
              {act.headline}
            </h2>
          )}
          {act.body && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "2.5rem 0 0",
                display: "grid",
                gap: "1.25rem",
                fontSize: "clamp(1.1rem, 2.1vw, 1.9rem)",
                lineHeight: 1.35,
              }}
            >
              {act.body.map((line, i) => (
                <li key={i} style={{ borderLeft: `2px solid ${chapter.accent}`, paddingLeft: "1.1rem" }}>
                  {line}
                </li>
              ))}
            </ul>
          )}
          {act.metrics && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "3rem",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              {act.metrics.map((m, i) => (
                <div key={i} style={{ minWidth: "180px" }}>
                  <div
                    style={{
                      fontSize: "clamp(2.6rem, 6vw, 5rem)",
                      fontWeight: 700,
                      color: chapter.accent,
                    }}
                  >
                    {formatMetric(metricValue(s.local, m.from, m.to), m.format)}
                  </div>
                  <div style={{ fontSize: "1rem", opacity: 0.85, marginTop: "0.5rem" }}>{m.label}</div>
                  {m.note && (
                    <div style={{ fontSize: "0.85rem", opacity: 0.55, marginTop: "0.25rem" }}>
                      {m.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {act.support && (
            <p style={{ marginTop: "2.5rem", fontSize: "1.15rem", opacity: 0.7, textAlign: "center" }}>
              {act.support}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build sanity**

Run: `cd tma-web && npx next build 2>&1 | tail -6`
Expected: clean compile, `/portfolio-v14` present, no error referencing `ChapterScene` or `chapterActs`.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v14/scenes/ChapterScene.jsx
git commit -m "feat(v14): generic data-driven ChapterScene (type-led, bookend image, scrub metrics)"
```

---

## Task 4: ManifestoScene.jsx — staged Slide-3 statement

**Files:**
- Create: `tma-web/components/portfolio-v14/scenes/ManifestoScene.jsx`

- [ ] **Step 1: Implement ManifestoScene.jsx**

Create `tma-web/components/portfolio-v14/scenes/ManifestoScene.jsx`:

```jsx
"use client";
import { useState } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";
import { actState } from "@/components/portfolio-v14/engine/chapterActs";

const LINES = [
  "We don't just create campaigns — we become an extension of your team.",
  "We transform B2B brands into culturally relevant, emotionally engaging experiences.",
  "We craft communication that resonates, visuals that convert, strategies that move markets.",
  "We build brands with purpose. We create work that matters.",
];

const PLAN = {
  acts: LINES.map((_, i) => ({ id: `m${i}`, weight: 1 })),
  inFrac: 0.25,
  outFrac: 0.25,
};

export default function ManifestoScene() {
  const [p, setP] = useState(0);
  const ref = useScene({
    id: "manifesto",
    order: 30,
    viewports: 4,
    bleed: "#07060a",
    onProgress: setP,
  });
  const s = actState(p, PLAN);
  const last = s.index === LINES.length - 1;

  return (
    <section
      ref={ref}
      data-scene="manifesto"
      data-act={s.id || ""}
      style={{
        height: "100vh",
        background: "#07060a",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        padding: "10vw",
      }}
    >
      <p
        style={{
          maxWidth: "1200px",
          margin: 0,
          textAlign: "center",
          fontSize: last ? "clamp(2.6rem, 7vw, 6rem)" : "clamp(1.9rem, 5vw, 4rem)",
          lineHeight: 1.1,
          fontWeight: last ? 700 : 400,
          opacity: s.opacity,
          transform: `translateY(${(1 - s.opacity) * 5}vh)`,
        }}
      >
        {LINES[s.index]}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Build sanity**

Run: `cd tma-web && npx next build 2>&1 | tail -6`
Expected: clean compile, `/portfolio-v14` present, no error referencing `ManifestoScene`.

- [ ] **Step 3: Commit**

```bash
git add tma-web/components/portfolio-v14/scenes/ManifestoScene.jsx
git commit -m "feat(v14): ManifestoScene — staged Slide-3 statement"
```

---

## Task 5: Wire V14Experience; delete probes

**Files:**
- Modify: `tma-web/components/portfolio-v14/V14Experience.jsx`
- Delete: `tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx`
- Delete: `tma-web/components/portfolio-v14/scenes/ProbeSceneB.jsx`

- [ ] **Step 1: Overwrite `V14Experience.jsx`** with exactly:

```jsx
"use client";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import { SceneControllerProvider } from "@/components/portfolio-v14/engine/SceneController";
import IntroFilmScene from "@/components/portfolio-v14/scenes/IntroFilmScene";
import ManifestoScene from "@/components/portfolio-v14/scenes/ManifestoScene";
import ChapterScene from "@/components/portfolio-v14/scenes/ChapterScene";
import { foodics } from "@/components/portfolio-v14/chapters/foodics";
import { zid } from "@/components/portfolio-v14/chapters/zid";

export default function V14Experience() {
  return (
    <SceneControllerProvider>
      <SmoothScroll />
      <IntroFilmScene />
      <ManifestoScene />
      <ChapterScene chapter={foodics} />
      <ChapterScene chapter={zid} />
    </SceneControllerProvider>
  );
}
```

- [ ] **Step 2: Delete the probe scenes**

```bash
git rm tma-web/components/portfolio-v14/scenes/ProbeSceneA.jsx tma-web/components/portfolio-v14/scenes/ProbeSceneB.jsx
```

- [ ] **Step 3: Confirm nothing else imports the probes**

Run (ripgrep): `rg -n "ProbeScene" tma-web --glob '!**/node_modules/**'`
Expected: ZERO matches (only V14Experience referenced them and it no longer does).
If `v14-kernel.spec.js` / `v14-reduced-motion.spec.js` / `v14-transition.spec.js` reference `data-scene="probe-a"` or `"probe-b"`, that is handled in Task 7 (regression) — do NOT edit them here; just report any such matches.

- [ ] **Step 4: Build + smoke**

Run: `cd tma-web && npx next build 2>&1 | tail -6` — clean, `/portfolio-v14` present, no error referencing the deleted probes or the new scenes.
Then: start `npm run dev` background, warm `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/portfolio-v14?frames=procedural"` → expect `200`; fetch the HTML and confirm it contains `data-scene="manifesto"`, `data-scene="foodics"`, `data-scene="zid"` and NOT `data-scene="probe-a"`/`"probe-b"`. Stop the dev server. Report the HTTP code + which markers were found.

- [ ] **Step 5: Commit**

```bash
git add tma-web/components/portfolio-v14/V14Experience.jsx
git commit -m "feat(v14): wire Manifesto+Foodics+Zid after intro; remove probe scenes"
```

---

## Task 6: Playwright chapters verification

**Files:**
- Create: `tma-web/playwright/tests/v14-chapters.spec.js`

- [ ] **Step 1: Write the spec**

Create `tma-web/playwright/tests/v14-chapters.spec.js`:

```js
import { test, expect } from "@playwright/test";

// Read the active act of a given scene (data-act attr) + whether its text is present.
async function actOf(page, scene) {
  return page.evaluate((s) => {
    const el = document.querySelector(`[data-scene="${s}"]`);
    return el ? el.getAttribute("data-act") : null;
  }, scene);
}

test("manifesto → foodics → zid reveal in order with their acts", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator('[data-scene="manifesto"]').waitFor({ state: "attached" });

  // Sweep the whole document; record the set of (scene→act) pairs seen + the
  // text content visible at each step. Discrete scrollTo → settle → sample
  // (the overlay/scene pipeline is async; never sample same-frame).
  const seenActs = new Set();
  let foodicsResultsText = "";
  let zidResultsText = "";
  let sawManifestoClose = false;
  for (let y = 0; y <= 30000; y += 280) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(140);
    for (const sc of ["manifesto", "foodics", "zid"]) {
      const a = await actOf(page, sc);
      if (a) seenActs.add(`${sc}:${a}`);
    }
    const body = await page.evaluate(() => document.body.innerText);
    if (body.includes("We create work that matters")) sawManifestoClose = true;
    if (body.includes("THE RESULTS") && body.includes("Merchants")) foodicsResultsText = body;
    if (body.includes("THE RESULTS") && body.includes("GMV")) zidResultsText = body;
  }

  // Each chapter's acts were all reached, in their scenes.
  for (const expect2 of [
    "foodics:hook", "foodics:problem", "foodics:solution", "foodics:results",
    "zid:hook", "zid:problem", "zid:solution", "zid:results",
  ]) {
    expect([...seenActs]).toContain(expect2);
  }
  expect(sawManifestoClose).toBe(true);
  // Metric numerals reached final deck values by the Results act.
  expect(foodicsResultsText).toContain("$20.8M");
  expect(foodicsResultsText).toContain("32,000+");
  expect(foodicsResultsText).toContain("$1B");
  expect(zidResultsText).toContain("200%");
  expect(zidResultsText).toContain("12,000+");
  expect(zidResultsText).toContain("+50%");
  expect(zidResultsText).toContain("+25%");
  expect(errors).toEqual([]);
});

test("reduced motion: every chapter resolved + page fully scrollable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator('[data-scene="zid"]').waitFor({ state: "attached" });
  await page.waitForTimeout(400);

  // onProgress(1) once → actState(1) → last act resolved.
  expect(await actOf(page, "foodics")).toBe("results");
  expect(await actOf(page, "zid")).toBe("results");
  expect(await actOf(page, "manifesto")).toBe("m3");
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).toContain("$20.8M");
  expect(body).toContain("+25%");
  expect(body).toContain("We create work that matters");
  await page.locator('[data-scene="zid"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="zid"]')).toBeInViewport();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run it**

Run: from `tma-web`, start `npm run dev` background, warm `curl -s -o /dev/null "http://localhost:3000/portfolio-v14?frames=procedural"`, then
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-chapters.spec.js --project=laptop-1440 --workers=1`
Expected: 2/2 PASS. Stop the dev server.

If a test fails: do NOT weaken assertions. Diagnose with real evidence (print `[...seenActs]`, the captured Results text, the reduced-motion `data-act` values) and report BLOCKED with the data + root cause. Allowed non-escalating tweak only: raise the per-step `waitForTimeout` (Lenis settle) or the loop bound; never lower a threshold or remove `--workers=1`. (`test.setTimeout(180_000)` may be added if the sweep needs longer — the per-step settle × ~107 steps can approach the default.)

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v14-chapters.spec.js
git commit -m "test(v14): e2e — manifesto/foodics/zid acts reveal in order, metrics reach deck values, reduced-motion resolved"
```

---

## Task 7: Full regression + status memory

- [ ] **Step 1: Full unit suite**

Run: `cd tma-web && npm test`
Expected: all green — SP-0/1/2A's 54 + `v14-chapterActs` (8) + `v14-chapters-data` (2). Report tests/pass/fail totals.

- [ ] **Step 2: Full v14 e2e suite (regression-critical, serial)**

Run: from `tma-web`, dev server running + both routes warmed (`/portfolio-v14` and `?frames=procedural`), then
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-kernel.spec.js playwright/tests/v14-reduced-motion.spec.js playwright/tests/v14-universe.spec.js playwright/tests/v14-transition.spec.js playwright/tests/v14-chapters.spec.js --project=laptop-1440 --workers=1`
Expected: ALL pass.

**Regression note — `v14-reduced-motion.spec.js` (SP-0) referenced `data-scene="probe-b"`.** The probes are now deleted. This SP-0 spec asserts the page is statically scrollable and a late scene is reachable. If it fails ONLY because `data-scene="probe-b"` no longer exists, that is an expected consequence of the planned probe removal — update that single selector to `data-scene="zid"` (the new last scene) WITHOUT changing the test's intent or other assertions, re-run, and note the one-line change in the report. Any OTHER failure (kernel fps, universe, transition `regions>=2`) is a real regression → STOP and report BLOCKED with the evidence (do not mask). The transition spec asserts `regions >= 2`; with 3 inter-scene seams now it still holds — confirm the actual `regions` value if it surfaces.

- [ ] **Step 3: Update status memory**

Edit `C:\Users\Pc\.claude\projects\c--Users-Pc-Downloads-the-motion-agency-web-main\memory\v14-scene-engine-status.md`: record SP-2B **built & verified** — generic `ChapterScene` + pure `chapterActs` (actState/metricValue/formatMetric) node:test core; verbatim Foodics/Zid data; distilled Manifesto; both probes removed; order IntroFilm→Manifesto→Foodics→Zid; reduced-motion resolves each chapter to its final act; record unit + e2e totals and any probe-selector regression fix. SP-3 (archive + impact + closing) is next. Update the one-line MEMORY.md pointer. Mark SP-2 fully complete (2A+2B).

- [ ] **Step 4: Final commit**

```bash
git add docs/superpowers/plans/2026-05-17-portfolio-v14-manifesto-featured-chapters.md
git commit -m "chore(v14): SP-2B complete — unit + e2e green" || echo "nothing extra to commit"
```

---

## Self-Review

**Spec coverage:**
- §1 scope/order/probes-deleted/no-closing → Tasks 5,7.
- §2.1 `actState` (weight bands, in/hold/out, **final act no out-fade**, clamp, empty/single/equal-weight) → Task 1 (8 tests incl. the reduced-motion-contract case).
- §2.2 `metricValue` scrub count-up (endpoints/mid/clamp/descending) → Task 1.
- §2.3 `formatMetric` (deck strings locked) → Task 1 + Task 2 (final-value parity).
- §3.1 `ChapterScene` (useScene wiring, act render, bookend image on hook/results only, metrics tiles via formatMetric∘metricValue, data-scene/data-act hooks, inline styles) → Task 3.
- §3.2 `ManifestoScene` (4 verbatim Slide-3 lines, statement plan, last line emphasized) → Task 4.
- §3.3 verbatim Foodics/Zid data (copy, metrics, bleed/accent/image, weights) → Task 2.
- §4 chapter shape + plan.acts↔acts id parity → Task 2 test asserts parity.
- §5 wiring (IntroFilm 20 / Manifesto 30 / Foodics 40 / Zid 50; probes deleted; page.jsx untouched) → Task 5.
- §6 reduced motion (last act resolved, metrics final, scrollable) → Tasks 1 (envelope) + 6 (e2e) + asserted Task 6 test 2.
- §7 verification (chapterActs+data node:test; chapters e2e order/metrics/reduced-motion; SP-0/1/2A regression incl. the probe-selector note + transition regions) → Tasks 1,2,6,7.
- §8 out-of-scope respected (no closing/archive/WebGL; engine untouched; `/case/*` untouched; inline styles).

**Placeholder scan:** no TBD/TODO; every code step has complete code; every run step an expected result + concrete failure path. The one allowed conditional edit (SP-0 reduced-motion probe selector) is explicitly bounded in Task 7 with intent preserved.

**Type/name consistency:** `actState(progress,plan)→{index,id,local,phase,opacity}` (Task 1) consumed in Tasks 3,4; `metricValue(local,from,to)` + `formatMetric(value,format)` (Task 1) consumed in Task 3 and asserted in Task 2; chapter shape `{id,order,viewports,bleed,accent,image,plan:{acts,inFrac,outFrac},acts:[{id,kind,label,headline,body,metrics:[{label,from,to,format,note}],support}]}` produced in Task 2, consumed in Task 3, parity-tested in Task 2; `data-scene`/`data-act` written in Tasks 3,4 and read in Task 6; orders 20/30/40/50 consistent across Tasks 2,4,5 and the spec.

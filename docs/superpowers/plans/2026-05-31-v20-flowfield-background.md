# V20 MOTION MATTERS Flow-Current Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a whisper-subtle, scroll-reactive "flow current" animated background to the pinned MOTION MATTERS section on `/portfolio-v20`, without touching the scroll-drawn filament.

**Architecture:** A self-contained `V20FlowField` React component renders a `<canvas>` mounted as the first child of `.v20-mm`. The canvas uses `mix-blend-mode: screen` and clears to full transparency each frame, so it can only *add* light — never darken the filament. It owns its own `ScrollTrigger` (independent of the filament's) to read scroll progress/velocity and modulate the current's speed and glow. Under reduced motion it renders a single static CSS wash instead.

**Tech Stack:** Next.js (App Router, client component), GSAP + ScrollTrigger (already in the project), Canvas 2D, Playwright (e2e).

---

## File Structure

- **Create:** `tma-web/components/portfolio-v20/V20FlowField.jsx` — the entire background layer (canvas + rAF loop + own ScrollTrigger + reduced-motion fallback). One responsibility: paint the flow current behind MOTION MATTERS.
- **Modify:** `tma-web/components/portfolio-v20/V20MotionMatters.jsx` — import and mount `<V20FlowField />` as the first child of the `.v20-mm` section.
- **Modify:** `tma-web/components/portfolio-v20/v20.css` — add `.v20-mm-flow` / `.v20-mm-flow--static` rules and give `.v20-mm-text-box` an explicit `z-index` so it stays above the canvas.
- **Modify (tests):** `tma-web/playwright/tests/v20-motion-matters.spec.js` — add structural, regression, and reduced-motion assertions.

**Untouched (hard constraint):** `V20Filament.jsx`, `mmGlyphs.js`, the pin `ScrollTrigger` in `V20MotionMatters.jsx`, lane structure.

**Running e2e (all tasks use this):**
```bash
cd tma-web && npm run dev        # terminal 1, leave running
# terminal 2:
cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters --reporter=line
```

---

### Task 1: Flow-field component, CSS, and mount (structural)

**Files:**
- Create: `tma-web/components/portfolio-v20/V20FlowField.jsx`
- Modify: `tma-web/components/portfolio-v20/V20MotionMatters.jsx`
- Modify: `tma-web/components/portfolio-v20/v20.css`
- Test: `tma-web/playwright/tests/v20-motion-matters.spec.js`

- [ ] **Step 1: Write the failing test**

Append to `tma-web/playwright/tests/v20-motion-matters.spec.js`:

```javascript
test("flow-field canvas mounts inside the MOTION MATTERS section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);

  const canvas = page.locator(".v20-mm canvas.v20-mm-flow");
  await expect(canvas).toHaveCount(1);

  const styles = await canvas.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { blend: cs.mixBlendMode, pe: cs.pointerEvents, z: cs.zIndex };
  });
  expect(styles.blend).toBe("screen");
  expect(styles.pe).toBe("none");

  // The text box must stack above the canvas so letters/line read clearly.
  const textZ = await page
    .locator(".v20-mm-text-box")
    .evaluate((el) => getComputedStyle(el).zIndex);
  expect(Number(textZ)).toBeGreaterThan(Number(styles.z));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters -g "flow-field canvas mounts" --reporter=line`
Expected: FAIL — `Expected: 1 Received: 0` (canvas does not exist yet).

- [ ] **Step 3: Create the component**

Create `tma-web/components/portfolio-v20/V20FlowField.jsx`:

```jsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 60;
const DPR_CAP = 2;

/**
 * Whisper-subtle "flow current" behind the MOTION MATTERS section.
 *
 * Hard rule: this layer must never alter the filament. It uses
 * mix-blend-mode: screen (can only add light) and clears to full
 * transparency each frame (no dark trail fill). It owns its OWN
 * ScrollTrigger — it never reads or writes the filament's trigger.
 */
export default function V20FlowField() {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  // Scroll signals written by our own ScrollTrigger, read by the rAF loop.
  const progressRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const ctx2d = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

    let width = 0;
    let height = 0;
    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();

    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const rand = (a, b) => a + Math.random() * (b - a);
    const spawn = () => ({ x: rand(0, width), y: rand(0, height), life: rand(40, 160) });
    const particles = Array.from({ length: PARTICLE_COUNT }, spawn);

    const lerp = (a, b, n) => a + (b - a) * n;
    let flowSpeed = 0.5; // multiplier on time advance
    let glow = 0.05; // stroke alpha
    let t = 0;
    const field = (x, y) =>
      Math.sin(y * 0.012 + t * 0.6) * 0.8 + Math.cos(x * 0.008 - t * 0.3) * 0.5;

    // Our OWN trigger — independent of the filament. No scrub, no tween;
    // it only records progress + velocity into refs.
    const gsapCtx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ".v20-mm",
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          progressRef.current = self.progress;
          velocityRef.current = Math.min(1, Math.abs(self.getVelocity()) / 3000);
        },
      });
    });

    let rafId = 0;
    const render = () => {
      // Targets derived from scroll, clamped to whisper bounds.
      const speedTarget = 0.4 + velocityRef.current * 0.9; // 0.4 .. 1.3
      const glowTarget = 0.05 + progressRef.current * 0.04; // 0.05 .. 0.09
      flowSpeed = lerp(flowSpeed, speedTarget, 0.04);
      glow = lerp(glow, glowTarget, 0.04);
      velocityRef.current *= 0.92; // decay toward calm when not scrolling

      t += 0.006 * flowSpeed;
      ctx2d.clearRect(0, 0, width, height); // full transparency — never darkens

      ctx2d.lineWidth = 1.1;
      ctx2d.lineCap = "round";
      for (const p of particles) {
        const a = field(p.x, p.y);
        const nx = p.x + Math.cos(a) * 1.6 * flowSpeed;
        const ny = p.y + Math.sin(a) * 1.6 * flowSpeed;
        ctx2d.strokeStyle = `rgba(95, 185, 255, ${glow})`;
        ctx2d.beginPath();
        ctx2d.moveTo(p.x, p.y);
        ctx2d.lineTo(nx, ny);
        ctx2d.stroke();
        p.x = nx;
        p.y = ny;
        p.life -= 1;
        if (p.life < 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          Object.assign(p, spawn());
        }
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gsapCtx.revert();
    };
  }, [reduced]);

  if (reduced) {
    return <div className="v20-mm-flow v20-mm-flow--static" aria-hidden="true" />;
  }
  return <canvas ref={canvasRef} className="v20-mm-flow" aria-hidden="true" />;
}
```

- [ ] **Step 4: Mount it in the section**

Modify `tma-web/components/portfolio-v20/V20MotionMatters.jsx`.

Add the import near the other imports (after line 6):

```jsx
import V20FlowField from "./V20FlowField";
```

Change the returned section's children so the flow field is the first child of `.v20-mm`:

```jsx
    <section
      ref={sectionRef}
      className="v20-mm"
      aria-label="Motion matters"
      data-v20-mm
    >
      {/* Whisper-subtle flow-current background. Screen-blended; cannot
          darken the filament that threads through this transparent section. */}
      <V20FlowField />
      {/* The filament uses this box's geometry to compute where to
          place the drawn letters. The box is invisible but layout-bearing. */}
      <div className="v20-mm-text-box" data-v20-mm-box />
    </section>
```

- [ ] **Step 5: Add the CSS**

Modify `tma-web/components/portfolio-v20/v20.css`. After the `.v20-mm-text-box` rule (currently ending around line 2198), add:

```css
/* Flow-current background — screen-blended so it only adds light, never
   darkening the filament that shows through this transparent section. */
.v20-mm-flow {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  mix-blend-mode: screen;
}
.v20-mm-flow--static {
  background: radial-gradient(
    ellipse 60% 50% at 50% 45%,
    rgba(95, 185, 255, 0.06),
    transparent 70%
  );
}
```

Then give the text box an explicit z-index so it stays above the canvas. Change the `.v20-mm-text-box` rule:

```css
.v20-mm-text-box {
  position: relative;
  z-index: 1;
  width: min(92vw, 1280px);
  aspect-ratio: 5 / 1;
  margin: 0 auto;
  pointer-events: none;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters -g "flow-field canvas mounts" --reporter=line`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tma-web/components/portfolio-v20/V20FlowField.jsx tma-web/components/portfolio-v20/V20MotionMatters.jsx tma-web/components/portfolio-v20/v20.css tma-web/playwright/tests/v20-motion-matters.spec.js
git commit -m "feat(v20): flow-current background behind MOTION MATTERS"
```

---

### Task 2: Regression guard — filament untouched, no console errors

**Files:**
- Test: `tma-web/playwright/tests/v20-motion-matters.spec.js`

- [ ] **Step 1: Write the failing test**

Append to `tma-web/playwright/tests/v20-motion-matters.spec.js`:

```javascript
test("flow-field does not regress the filament or log errors", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);

  // Filament still includes the spliced letter strokes (same floor as the
  // existing "letter strokes" test — the background must not change this).
  const len = await readPathLength(page);
  expect(len).toBeGreaterThan(8000);

  // Scroll all the way through; no errors from the canvas loop or trigger.
  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run the test**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters -g "does not regress the filament" --reporter=line`
Expected: PASS (the component from Task 1 is non-destructive). If it FAILS, the failure is a real regression — fix the component, not the test.

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v20-motion-matters.spec.js
git commit -m "test(v20): guard filament + console against flow-field background"
```

---

### Task 3: Reduced-motion fallback + full suite

**Files:**
- Test: `tma-web/playwright/tests/v20-motion-matters.spec.js`

- [ ] **Step 1: Write the failing test**

Append to `tma-web/playwright/tests/v20-motion-matters.spec.js`:

```javascript
test("reduced-motion: static wash instead of animated canvas", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);

  // No animated canvas under reduced motion...
  await expect(page.locator(".v20-mm canvas.v20-mm-flow")).toHaveCount(0);
  // ...a single static wash layer instead.
  await expect(page.locator(".v20-mm .v20-mm-flow--static")).toHaveCount(1);
});
```

- [ ] **Step 2: Run the test**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters -g "reduced-motion: static wash" --reporter=line`
Expected: PASS (the component renders the static branch when `usePrefersReducedMotion` is true). If FAIL, fix the component's reduced-motion branch.

- [ ] **Step 3: Run the full v20-motion-matters suite**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters --reporter=line`
Expected: ALL pass — the 6 pre-existing tests plus the 3 new ones.

- [ ] **Step 4: Run the filament suite to confirm no cross-regression**

Run: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v19-filament --reporter=line`
Expected: Same pass/skip counts as before this change (no new failures).

- [ ] **Step 5: Commit**

```bash
git add tma-web/playwright/tests/v20-motion-matters.spec.js
git commit -m "test(v20): reduced-motion fallback for flow-field background"
```

---

## Self-Review

**Spec coverage:**
- New `V20FlowField.jsx` component → Task 1. ✓
- Mounted as first child of `.v20-mm` → Task 1 Step 4. ✓
- Transparent clear + `mix-blend-mode: screen` → Task 1 Step 3 (`clearRect`) + Step 5 (CSS). ✓
- ~60 particles, flow field, cool-blue whisper alpha → Task 1 Step 3. ✓
- Independent ScrollTrigger reading progress + velocity, lerped → Task 1 Step 3. ✓
- Lifecycle cleanup (rAF cancel, RO disconnect, gsap.context revert) → Task 1 Step 3. ✓
- DPR cap 2 + ResizeObserver → Task 1 Step 3. ✓
- Reduced-motion static wash → Task 1 Step 3 (branch) + Step 5 (CSS) + Task 3 test. ✓
- Text box stays above canvas → Task 1 Step 5 (`z-index`) + Task 1 test. ✓
- Filament/pin/lane untouched → no task edits those files; Task 2 guards it. ✓
- Tests: canvas mounts, filament not regressed, no console errors, reduced motion → Tasks 1–3. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows complete code.

**Type/name consistency:** `.v20-mm-flow` (canvas), `.v20-mm-flow--static` (reduced), `progressRef`/`velocityRef`, `flowSpeed`/`glow`, `PARTICLE_COUNT`, `DPR_CAP` are used consistently across component and tests.

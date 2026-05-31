import { test, expect } from "@playwright/test";

// Local dev server:
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v20-motion-matters

const SETTLE_MS = 450;
const SCRUB_SETTLE_MS = 3200;

const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollTop = (page) => scrollTo(page, 0);
const scrollBottom = (page) =>
  page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );

const readOffset = (page) =>
  page.evaluate(() => {
    const p = document.querySelector(".v20-filament-path");
    return parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
  });

const readPathLength = (page) =>
  page.evaluate(() => {
    // Multi-path filament: head + letters + connectors + tail. The "letter
    // strokes are spliced in" check is the SUM of all filament path lengths
    // so it stays meaningful regardless of single vs multi-path architecture.
    const ps = document.querySelectorAll(".v20-filament-path");
    let total = 0;
    ps.forEach((p) => (total += p.getTotalLength()));
    return total;
  });

test("MOTION MATTERS section is mounted inside the work lane", async ({ page }) => {
  await page.goto("/portfolio-v20");
  await expect(page.locator(".v20-worklane .v20-mm")).toHaveCount(1);
  await expect(page.locator(".v20-mm-text-box")).toBeVisible();
});

test("lane filament path includes the letter strokes (length grows accordingly)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);
  const len = await readPathLength(page);
  // Without letter strokes the V19/V20 lane path is ~ 4000–7000 px at 1440x900.
  // With MOTION MATTERS spliced in, the path roughly doubles. Use a generous
  // floor that catches the regression of "letters not spliced".
  expect(len).toBeGreaterThan(8000);
});

test("filament draws further as the user scrolls through the panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");

  const mmTopDoc = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(window.scrollY + el.getBoundingClientRect().top);
  });

  // Just before the panel:
  await scrollTo(page, Math.max(0, mmTopDoc - 200));
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const before = await readOffset(page);

  // After scrolling one viewport (which the panel consumes due to pin):
  await scrollTo(page, mmTopDoc + 900);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const after = await readOffset(page);

  expect(after).toBeLessThan(before);
});

test("panel pins for ~one viewport of scroll distance", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");

  const mmTopDoc = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(window.scrollY + el.getBoundingClientRect().top);
  });

  await scrollTo(page, mmTopDoc);
  await page.waitForTimeout(SETTLE_MS);
  const topAtPinStart = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(el.getBoundingClientRect().top);
  });

  await scrollTo(page, mmTopDoc + 500);
  await page.waitForTimeout(SETTLE_MS);
  const topMidPin = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(el.getBoundingClientRect().top);
  });

  // While pinned, the panel's top should remain at ~0 (give it 30px of slack
  // for sub-pixel rounding under Lenis).
  expect(Math.abs(topAtPinStart)).toBeLessThan(30);
  expect(Math.abs(topMidPin)).toBeLessThan(30);
});

test("reduced-motion: no pin, full path drawn statically", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);

  const initialOffset = await readOffset(page);
  expect(initialOffset).toBeLessThan(1);

  // Scroll through the panel; panel position relative to viewport should
  // change linearly (no pin).
  const mmTopDoc = await page.evaluate(() => {
    const el = document.querySelector(".v20-mm");
    return Math.round(window.scrollY + el.getBoundingClientRect().top);
  });
  await scrollTo(page, mmTopDoc);
  await page.waitForTimeout(SETTLE_MS);
  const topAtStart = await page.evaluate(
    () => document.querySelector(".v20-mm").getBoundingClientRect().top
  );

  await scrollTo(page, mmTopDoc + 500);
  await page.waitForTimeout(SETTLE_MS);
  const topAfter = await page.evaluate(
    () => document.querySelector(".v20-mm").getBoundingClientRect().top
  );

  // Without pin, the panel moves up by ~500px as the user scrolls 500px.
  expect(topAtStart - topAfter).toBeGreaterThan(400);
});

test("flow-field canvas mounts behind the filament in the work lane", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);

  // The background lives at the work-lane level (NOT inside .v20-mm) so it
  // can paint behind the filament.
  const canvas = page.locator(".v20-worklane > canvas.v20-mm-flow");
  await expect(canvas).toHaveCount(1);

  const styles = await canvas.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { blend: cs.mixBlendMode, pe: cs.pointerEvents, pos: cs.position };
  });
  expect(styles.blend).toBe("screen");
  expect(styles.pe).toBe("none");
  expect(styles.pos).toBe("fixed");

  // Paint order: the canvas must come BEFORE .v20-filament among the lane's
  // direct children (equal z-index:0 ⇒ later sibling paints on top), so the
  // drawn line renders over the background.
  const order = await page.evaluate(() => {
    const lane = document.querySelector(".v20-worklane");
    const kids = Array.from(lane.children);
    const canvasIdx = kids.findIndex((n) => n.matches("canvas.v20-mm-flow"));
    const filamentIdx = kids.findIndex((n) => n.classList.contains("v20-filament"));
    return { canvasIdx, filamentIdx };
  });
  expect(order.canvasIdx).toBeGreaterThanOrEqual(0);
  expect(order.filamentIdx).toBeGreaterThanOrEqual(0);
  expect(order.canvasIdx).toBeLessThan(order.filamentIdx);
});

test("no console errors during mount + scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v20");
  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});

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

test("reduced-motion: static wash instead of animated canvas", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v20");
  await page.waitForTimeout(SETTLE_MS);

  // No animated canvas under reduced motion...
  await expect(page.locator(".v20-worklane canvas.v20-mm-flow")).toHaveCount(0);
  // ...a single static wash layer instead (at the work-lane level).
  await expect(page.locator(".v20-worklane .v20-mm-flow--static")).toHaveCount(1);
});

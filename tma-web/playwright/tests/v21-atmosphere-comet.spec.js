import { test, expect } from "@playwright/test";

// Local dev server:
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v21-atmosphere-comet

const SETTLE_MS = 450;

const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);

const laneTopDoc = (page) =>
  page.evaluate(() =>
    Math.round(window.scrollY + document.querySelector(".v21-worklane").getBoundingClientRect().top)
  );

const mmTopDoc = (page) =>
  page.evaluate(() =>
    Math.round(window.scrollY + document.querySelector(".v21-mm").getBoundingClientRect().top)
  );

const readVar = (page, name) =>
  page.evaluate(
    (n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)) || 0,
    name
  );

test("atmosphere bloom layer mounts as the first lane child (fixed, screen blend)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  const atmo = page.locator(".v21-worklane > .v21-atmosphere");
  await expect(atmo).toHaveCount(1);

  const styles = await atmo.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { blend: cs.mixBlendMode, pe: cs.pointerEvents, pos: cs.position };
  });
  expect(styles.blend).toBe("screen");
  expect(styles.pe).toBe("none");
  expect(styles.pos).toBe("fixed");

  // Must be the FIRST child so it paints behind the flow-field + filament.
  const order = await page.evaluate(() => {
    const kids = Array.from(document.querySelector(".v21-worklane").children);
    return {
      atmoIdx: kids.findIndex((n) => n.classList.contains("v21-atmosphere")),
      flowIdx: kids.findIndex((n) => n.matches("canvas.v21-mm-flow, .v21-mm-flow")),
      filIdx: kids.findIndex((n) => n.classList.contains("v21-filament")),
    };
  });
  expect(order.atmoIdx).toBe(0);
  expect(order.flowIdx).toBeGreaterThanOrEqual(1);
  expect(order.filIdx).toBeGreaterThan(order.flowIdx);
  expect(order.atmoIdx).toBeLessThan(order.flowIdx);
  expect(order.flowIdx).toBeLessThan(order.filIdx);
});

test("--atmo-bloom peaks near MOTION MATTERS and is low far away", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");

  // Far away (page top): bloom near 0.
  await scrollTo(page, 0);
  await page.waitForTimeout(SETTLE_MS);
  const farBloom = await readVar(page, "--atmo-bloom");

  // Centred on MOTION MATTERS (pinned → its top sits ~0, centre ~vh/2): bloom high.
  const mm = await mmTopDoc(page);
  await scrollTo(page, mm + 450);
  await page.waitForTimeout(SETTLE_MS);
  const nearBloom = await readVar(page, "--atmo-bloom");

  expect(nearBloom).toBeGreaterThan(0.5);
  expect(farBloom).toBeLessThan(0.25);
  expect(nearBloom).toBeGreaterThan(farBloom);
});

test("--atmo-vel rises while scrolling and decays to ~0 at rest", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  // Drive motion across several animation frames to build smoothed velocity.
  const moving = await page.evaluate(async () => {
    for (let i = 0; i < 14; i++) {
      window.scrollBy(0, 130);
      await new Promise((r) => requestAnimationFrame(r));
    }
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--atmo-vel")) || 0;
  });

  // Pump rAF frames so the per-frame decay can run, then read the value.
  await page.evaluate(async () => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
  const resting = await readVar(page, "--atmo-vel");

  expect(moving).toBeGreaterThan(0.2);
  expect(resting).toBeLessThan(0.08);
});

const SCRUB_SETTLE_MS = 3200;

test("comet head exists and stays within the filament bounds while drawing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");

  // Scroll into the head-draw region (just inside the work lane) where the
  // line tip is mid-draw, so the comet is visible.
  const lane = await laneTopDoc(page);
  await scrollTo(page, lane + 400);
  await page.waitForTimeout(SCRUB_SETTLE_MS);

  const comet = page.locator(".v21-comet");
  await expect(comet).toHaveCount(1);

  const display = await comet.evaluate((el) => getComputedStyle(el).display);
  expect(display).not.toBe("none");

  const fil = await page.locator(".v21-filament").boundingBox();
  const com = await comet.boundingBox();
  expect(com).not.toBeNull();
  const cx = com.x + com.width / 2;
  const cy = com.y + com.height / 2;
  expect(cx).toBeGreaterThanOrEqual(fil.x - 10);
  expect(cx).toBeLessThanOrEqual(fil.x + fil.width + 10);
  expect(cy).toBeGreaterThanOrEqual(fil.y - 10);
  expect(cy).toBeLessThanOrEqual(fil.y + fil.height + 10);
});

test("reduced-motion: comet is not rendered", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  const display = await page
    .locator(".v21-comet")
    .evaluate((el) => getComputedStyle(el).display)
    .catch(() => "none");
  expect(display).toBe("none");

  const op = await page
    .locator(".v21-atmosphere")
    .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.03);
  expect(op).toBeLessThan(0.12);
});

test("comet rides the draw tip downward as you scroll deeper", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  const lane = await laneTopDoc(page);
  const mm = await mmTopDoc(page);

  // Comet centre measured RELATIVE to the filament/lane top, so it reflects
  // how far the line has drawn (not just page scroll).
  const offsetAt = async (top) => {
    await scrollTo(page, top);
    await page.waitForTimeout(SCRUB_SETTLE_MS);
    return page.evaluate(() => {
      const c = document.querySelector(".v21-comet");
      const f = document.querySelector(".v21-filament");
      if (!c || !f || getComputedStyle(c).display === "none") return null;
      const cb = c.getBoundingClientRect();
      const fb = f.getBoundingClientRect();
      return cb.top + cb.height / 2 - fb.top;
    });
  };

  const near = await offsetAt(lane + 200);
  const far = await offsetAt(Math.max(lane + 1200, mm - 500));
  expect(near).not.toBeNull();
  expect(far).not.toBeNull();
  expect(far).toBeGreaterThan(near + 30); // tip descended along the line
});

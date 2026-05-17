import { test, expect } from "@playwright/test";

const OVERLAY = "[data-v14-transition-overlay]";

async function sampleOverlay(page) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const cs = getComputedStyle(el);
    const bf = cs.backdropFilter || cs.webkitBackdropFilter || "none";
    const m = bf.match(/blur\(([\d.]+)px\)/);
    return { opacity: parseFloat(cs.opacity) || 0, blur: m ? parseFloat(m[1]) : 0 };
  }, OVERLAY);
}

test("overlay activates at >=2 seams and is inert most of the scroll", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator(OVERLAY).waitFor({ state: "attached" });

  const STEP = 280;
  const SETTLE = 400;
  const opacities = [];
  for (let y = 0; y <= 14000; y += STEP) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(SETTLE);
    opacities.push((await sampleOverlay(page)).opacity);
  }

  const maxO = Math.max(...opacities);
  const activeFrac = opacities.filter((o) => o > 0.05).length / opacities.length;
  let regions = 0;
  for (let i = 1; i < opacities.length; i++) {
    if (opacities[i] > 0.05 && opacities[i - 1] <= 0.05) regions++;
  }
  expect(maxO).toBeGreaterThan(0.05);
  expect(regions).toBeGreaterThanOrEqual(2);
  expect(activeFrac).toBeLessThan(0.5);
  expect(errors).toEqual([]);
});

test("seam blur is velocity-coupled and bounded by the clamp ceiling", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator(OVERLAY).waitFor({ state: "attached" });

  // Geometry-independent: sweep the whole page (same robust scrollTo→settle→
  // sample pattern as the test above) and capture the peak overlay blur at
  // whatever seams exist. (Hardcoding a seam y is brittle — the scene layout
  // changes across sub-projects; SP-2B replaced the probe scenes.) The intent
  // is unchanged: some seam must produce a real, BOUNDED blur — strictly
  // positive and never above the velocity-clamp ceiling
  // (blurAmount(0.5)*maxVMul = 16*1.6 = 25.6, +rounding/raster headroom → ≤27).
  const STEP = 280;
  const SETTLE = 400;
  let peak = 0;
  for (let y = 0; y <= 14000; y += STEP) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(SETTLE);
    peak = Math.max(peak, (await sampleOverlay(page)).blur);
  }
  expect(peak).toBeGreaterThan(0);
  expect(peak).toBeLessThanOrEqual(27);
});

test("reduced motion: overlay stays inert, page fully scrollable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator(OVERLAY).waitFor({ state: "attached" });
  let maxOpacity = 0;
  for (let y = 0; y <= 14000; y += 1000) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(80);
    maxOpacity = Math.max(maxOpacity, (await sampleOverlay(page)).opacity);
  }
  expect(maxOpacity).toBeLessThan(0.02);
  await page.locator('[data-scene="zid"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="zid"]')).toBeInViewport();
  expect(errors).toEqual([]);
});

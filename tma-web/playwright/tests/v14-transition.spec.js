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

test("overlay activates at a scene seam and is inert inside scenes", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator(OVERLAY).waitFor({ state: "attached" });

  let maxOpacity = 0;
  let insideMax = 0;
  for (let y = 0; y <= 14000; y += 500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(120);
    const s = await sampleOverlay(page);
    maxOpacity = Math.max(maxOpacity, s.opacity);
    if (y === 3000) insideMax = s.opacity;
  }
  expect(maxOpacity).toBeGreaterThan(0.05);
  expect(insideMax).toBeLessThan(0.02);
  expect(errors).toEqual([]);
});

test("faster scroll across a seam yields a higher peak blur than slower", async ({ page }) => {
  async function peakBlurAcrossFirstSeam(step, settle) {
    await page.goto("/portfolio-v14?frames=procedural");
    await page.locator(OVERLAY).waitFor({ state: "attached" });
    let peak = 0;
    for (let y = 1200; y <= 4200; y += step) {
      await page.evaluate((sy) => window.scrollTo(0, sy), y);
      await page.waitForTimeout(settle);
      peak = Math.max(peak, (await sampleOverlay(page)).blur);
    }
    return peak;
  }
  const slowPeak = await peakBlurAcrossFirstSeam(120, 90);
  const fastPeak = await peakBlurAcrossFirstSeam(1500, 30);
  expect(fastPeak).toBeGreaterThanOrEqual(slowPeak);
  expect(fastPeak).toBeGreaterThan(0);
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
  await page.locator('[data-scene="probe-b"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="probe-b"]')).toBeInViewport();
  expect(errors).toEqual([]);
});

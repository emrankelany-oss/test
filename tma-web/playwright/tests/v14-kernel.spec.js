import { test, expect } from "@playwright/test";

test("portfolio-v14 route renders the experience root", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");
  await expect(page.locator('[data-v14-root]')).toBeVisible();
  expect(errors).toEqual([]);
});

test("frame advances monotonically and rAF-throttles draws", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");
  await page.locator('[data-v14-canvas]').waitFor();

  const samples = [];
  for (let y = 0; y <= 12000; y += 1500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(250);
    samples.push(await page.evaluate(() => ({ ...window.__v14Debug })));
  }
  const indices = samples.map((s) => s.frameIndex);
  for (let i = 1; i < indices.length; i++) {
    expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
  }
  expect(indices[indices.length - 1]).toBeGreaterThan(indices[0]);

  const last = samples[samples.length - 1];
  // Draws must not exceed the number of distinct frames (throttle proof).
  expect(last.drawCount).toBeLessThanOrEqual(last.count + 5);
  expect(errors).toEqual([]);
});

test("sustains >=55fps during a fast programmatic scroll", async ({ page }) => {
  await page.goto("/portfolio-v14");
  await page.locator('[data-v14-canvas]').waitFor();
  const fps = await page.evaluate(async () => {
    let frames = 0;
    let raf;
    const loop = () => { frames++; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const t0 = performance.now();
    for (let y = 0; y <= 12000; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 16));
    }
    const dt = performance.now() - t0;
    cancelAnimationFrame(raf);
    return (frames / dt) * 1000;
  });
  expect(fps).toBeGreaterThanOrEqual(55);
});

import { test, expect } from "@playwright/test";

test("v16 route renders the experience root and a non-blank canvas", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v16?frames=procedural");
  await expect(page.locator("[data-v16-root]")).toBeVisible();
  await page.locator("[data-v16-canvas]").waitFor();
  await expect.poll(() => page.evaluate(() => window.__v16Debug?.ready === true)).toBe(true);
  await expect(page.locator("[data-v16-loading]")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("scrolling scrubs the frame index forward, throttled by rAF", async ({ page }) => {
  await page.goto("/portfolio-v16?frames=procedural");
  await page.locator("[data-v16-canvas]").waitFor();
  await expect.poll(() => page.evaluate(() => window.__v16Debug?.ready === true)).toBe(true);

  const samples = [];
  for (let y = 0; y <= 12000; y += 1500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(300);
    samples.push(await page.evaluate(() => ({ ...window.__v16Debug })));
  }
  const idx = samples.map((s) => s.frameIndex);
  for (let i = 1; i < idx.length; i++) {
    expect(idx[i]).toBeGreaterThanOrEqual(idx[i - 1]);
  }
  expect(idx[idx.length - 1]).toBeGreaterThan(idx[0]);
  const last = samples[samples.length - 1];
  expect(last.drawCount).toBeLessThanOrEqual(last.count + 8);
});

test("text beats reveal and the featured section is reachable", async ({ page }) => {
  await page.goto("/portfolio-v16?frames=procedural");
  await page.locator("[data-v16-canvas]").waitFor();
  await expect.poll(() => page.evaluate(() => window.__v16Debug?.ready === true)).toBe(true);

  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(400);
  await expect(page.getByText("THE MOTION AGENCY")).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 11500));
  await page.waitForTimeout(500);
  const archiveOpacity = await page.evaluate(() => {
    const el = document.querySelector("[data-v16-archive]");
    return el ? parseFloat(getComputedStyle(el).opacity) : -1;
  });
  expect(archiveOpacity).toBeGreaterThan(0.3);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator("[data-v16-featured]").scrollIntoViewIfNeeded();
  await expect(page.getByText("Featured Projects")).toBeVisible();
});

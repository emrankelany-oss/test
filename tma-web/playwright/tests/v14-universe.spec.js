import { test, expect } from "@playwright/test";

test("universe frames stream, advance with scroll, no errors", async ({ page }) => {
  const errors = [];
  const failed = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("response", (r) => {
    if (r.url().includes("/assets/v14/intro/") && r.status() >= 400)
      failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/portfolio-v14");
  await page.locator('[data-v14-canvas]').waitFor();

  const samples = [];
  for (let y = 0; y <= 12000; y += 1500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(300);
    samples.push(await page.evaluate(() => ({ ...window.__v14Debug })));
  }
  const idx = samples.map((s) => s.frameIndex);
  for (let i = 1; i < idx.length; i++) expect(idx[i]).toBeGreaterThanOrEqual(idx[i - 1]);
  expect(idx[idx.length - 1]).toBeGreaterThan(idx[0]);
  expect(samples[samples.length - 1].count).toBe(180);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test("reduced motion rests on the final settled frame, scrollable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");
  await page.locator('[data-v14-canvas]').waitFor();
  await page.waitForTimeout(500);
  const dbg = await page.evaluate(() => ({ ...window.__v14Debug }));
  expect(dbg.frameIndex).toBe(179); // engine resolved to the last (settled) frame
  await page.locator('[data-scene="probe-b"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="probe-b"]')).toBeInViewport();
  expect(errors).toEqual([]);
});

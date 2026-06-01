import { test, expect } from "@playwright/test";

const SETTLE_MS = 450;
const SCRUB_MS = 1200;
const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollBottom = (page) =>
  page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
const owTop = (page) =>
  page.evaluate(() => Math.round(window.scrollY + document.querySelector(".v21ow").getBoundingClientRect().top));

test("gallery is an airy 2-up grid of many works with filament tail anchors intact", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.locator(".v21ow .v21ow-title-word")).toHaveCount(1);
  await expect(page.locator(".v21ow .v21ow-title em")).toHaveCount(1);
  const items = page.locator(".v21ow-gitem");
  expect(await items.count()).toBeGreaterThan(8);
  const boxes = await items.evaluateAll((els) => els.slice(0, 2).map((e) => e.getBoundingClientRect()));
  expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(boxes[0].height);
  expect(Math.abs(boxes[0].left - boxes[1].left)).toBeGreaterThan(boxes[0].width * 0.5);
});

test("gallery has generous gaps (not the old tight grid)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const colGap = await page.locator(".v21ow-gal").evaluate((el) => parseFloat(getComputedStyle(el).columnGap) || parseFloat(getComputedStyle(el).gap) || 0);
  expect(colGap).toBeGreaterThan(28);
});

test("gallery items reveal on scroll and open the project drawer on click", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  const top = await owTop(page);
  await scrollTo(page, top + 100);
  await page.waitForTimeout(SCRUB_MS);
  const op = await page.locator(".v21ow-gitem").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.9);
  await page.locator(".v21ow-gitem-link").first().click();
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.locator(".v21pm")).toHaveCount(1);
});

test("reduced-motion: gallery items visible without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const op = await page.locator(".v21ow-gitem").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.95);
});

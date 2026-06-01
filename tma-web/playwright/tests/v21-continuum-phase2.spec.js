import { test, expect } from "@playwright/test";

const SETTLE_MS = 450;
const SCRUB_MS = 1200;
const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollBottom = (page) =>
  page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
const fwTop = (page) =>
  page.evaluate(() => Math.round(window.scrollY + document.querySelector(".v21fw").getBoundingClientRect().top));

test("featured renders large editorial bands with generous gaps", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const bands = page.locator(".v21fw-band");
  const n = await bands.count();
  expect(n).toBeGreaterThanOrEqual(2);
  expect(n).toBeLessThanOrEqual(4);
  const firstW = await bands.first().evaluate((el) => el.getBoundingClientRect().width);
  const pageW = await page.evaluate(() => document.querySelector(".v21fw").clientWidth);
  expect(firstW).toBeGreaterThan(pageW * 0.6);
  if (n >= 2) {
    const gap = await page.evaluate(() => {
      const els = [...document.querySelectorAll(".v21fw-band")];
      const a = els[0].getBoundingClientRect();
      const b = els[1].getBoundingClientRect();
      return b.top - a.bottom;
    });
    expect(gap).toBeGreaterThan(60);
  }
});

test("filament anchors still present in the featured header", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.locator(".v21fw .v21fw-title-word")).toHaveCount(1);
  await expect(page.locator(".v21fw .v21fw-title em")).toHaveCount(1);
});

test("bands reveal on scroll and a band opens an overlay on click", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  // Scroll past the featured section so the first band clears the 82vh trigger
  const top = await fwTop(page);
  await scrollTo(page, top + 400);
  await page.waitForTimeout(SCRUB_MS);
  const op = await page.locator(".v21fw-band").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.9);
  await page.locator(".v21fw-band-link").first().click();
  await page.waitForTimeout(SETTLE_MS);
  // First project (Foodics) has videos[] so it opens the ProjectGallery panel (.v21pg).
  await expect(page.locator(".v21pg")).toHaveCount(1);
});

test("reduced-motion: bands are visible without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const op = await page.locator(".v21fw-band").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.95);
});

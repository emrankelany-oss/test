import { test, expect } from "@playwright/test";

const skipPreloader = (page) =>
  page.addInitScript(() => { window.__V24_SKIP_PRELOADER = true; });

test("hero renders the headline and eyebrow", async ({ page }) => {
  await skipPreloader(page);
  await page.goto("/portfolio-v24");
  await expect(page.locator(".v24-hero")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/storytelling/i);
});

test("agency stats band shows the four real numbers", async ({ page }) => {
  await skipPreloader(page);
  await page.goto("/portfolio-v24");
  const metrics = page.locator(".v24-statsband .v24-stat-metric");
  await expect(metrics).toHaveCount(4);
  await expect(metrics.nth(0)).toHaveText("178%");
});

test("gradient field canvas mounts", async ({ page }) => {
  await skipPreloader(page);
  await page.goto("/portfolio-v24");
  await expect(page.locator(".v24-gradient-field canvas")).toBeAttached();
});

test("every category group renders rows; rows are 50/50 with media + stats", async ({ page }) => {
  await skipPreloader(page);
  await page.goto("/portfolio-v24");
  const groups = page.locator(".v24-cat");
  await expect(groups.first()).toBeAttached();
  const rows = page.locator(".v24-row");
  expect(await rows.count()).toBeGreaterThanOrEqual(20);
  const first = rows.first();
  await expect(first.locator(".v24-row-media video, .v24-row-media img")).toHaveCount(1);
  expect(await first.locator(".v24-rs-metric").count()).toBeGreaterThanOrEqual(3);
});

test("Foodics row shows a real KPI", async ({ page }) => {
  await skipPreloader(page);
  await page.goto("/portfolio-v24");
  await expect(page.locator(".v24-row", { hasText: "Boundless" }).first()).toContainText(/35\.6%|32,000\+|\$1B/);
});

test("reveal: a deep row becomes visible after scrolling to it", async ({ page }) => {
  await skipPreloader(page);
  await page.goto("/portfolio-v24");
  const row = page.locator(".v24-row .v24-row-info").nth(6);
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const opacity = await row.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(opacity).toBeGreaterThan(0.5);
});

test("preloader runs and reveals the page (no skip)", async ({ page }) => {
  await page.goto("/portfolio-v24");
  await expect(page.locator(".v24-preloader")).toBeVisible();
  await expect(page.locator(".v24-preloader")).toHaveCount(0, { timeout: 16000 });
  await expect(page.locator(".v24-hero")).toBeVisible();
});

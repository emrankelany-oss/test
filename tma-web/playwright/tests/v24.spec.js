import { test, expect } from "@playwright/test";

const skip = (page) => page.addInitScript(() => { window.__V24_SKIP_PRELOADER = true; });

test("hero shows the new headline", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  await expect(page.locator(".v24-hero")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/motion/i);
});

test("agency stats band shows the four numbers", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  const m = page.locator(".v24-statsband .v24-stat-metric");
  await expect(m).toHaveCount(4);
  await expect(m.nth(0)).toHaveText("178%");
});

test("gradient field canvas mounts", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  await expect(page.locator(".v24-gradient-field canvas")).toBeAttached();
});

test("two featured sections (Foodics, Zid) with real KPIs and a lead film", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  const feats = page.locator(".v24-feat");
  await expect(feats).toHaveCount(2);
  const foodics = feats.first();
  await expect(foodics).toContainText(/Foodics/i);
  await expect(foodics.locator(".v24-feat-stats")).toContainText(/35\.6%|32,000\+|\$1B/);
  await expect(foodics.locator(".v24-feat-lead video")).toHaveCount(1);
});

test("clicking a featured film opens the lightbox; ESC closes it", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  await page.locator(".v24-feat .v24-im-play").first().click();
  await expect(page.locator(".v24-film")).toBeVisible();
  await expect(page.locator(".v24-film-media")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".v24-film")).toHaveCount(0);
});

test("'View all films' expands the rest on Foodics", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  const foodics = page.locator(".v24-feat").first();
  const btn = foodics.locator(".v24-more-bt");
  await expect(btn).toContainText(/view all/i);
  const rest = foodics.locator(".v24-feat-rest");
  const before = await rest.evaluate((el) => el.getBoundingClientRect().height);
  await btn.click();
  await page.waitForTimeout(800);
  const after = await rest.evaluate((el) => el.getBoundingClientRect().height);
  expect(after).toBeGreaterThan(before + 50);
});

test("category groups render the rest; no Foodics/Zid work cards", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  const cats = page.locator(".v24-cat");
  expect(await cats.count()).toBeGreaterThanOrEqual(3);
  const cards = page.locator(".v24-wcard");
  expect(await cards.count()).toBeGreaterThanOrEqual(20);
});

test("a work-grid video card opens the lightbox on click", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  const vid = page.locator(".v24-wcard.is-video .v24-wcard-media").first();
  await vid.scrollIntoViewIfNeeded();
  await vid.click();
  await expect(page.locator(".v24-film")).toBeVisible();
});

test("preloader runs and reveals (no skip)", async ({ page }) => {
  await page.goto("/portfolio-v24");
  await expect(page.locator(".v24-preloader")).toBeVisible();
  await expect(page.locator(".v24-preloader")).toHaveCount(0, { timeout: 16000 });
  await expect(page.locator(".v24-hero")).toBeVisible();
});

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

test("featured sections are 50/50 (lead video + stats); real KPIs", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  const feats = page.locator(".v24-feat");
  await expect(feats).toHaveCount(2);
  const foodics = feats.first();
  await expect(foodics).toContainText(/Foodics/i);
  await expect(foodics.locator(".v24-feat-grid")).toBeVisible();
  await expect(foodics.locator(".v24-feat-media video")).toHaveCount(1);
  await expect(foodics.locator(".v24-feat-stats")).toContainText(/35\.6%|32,000\+|\$1B/);
});

test("clicking the featured lead film opens the lightbox; ESC closes", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  await page.locator(".v24-feat .v24-im-play").first().click();
  await expect(page.locator(".v24-film")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".v24-film")).toHaveCount(0);
});

test("'View all films' opens a modal with all films as 50/50 rows", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  const foodics = page.locator(".v24-feat").first();
  await foodics.locator(".v24-more-bt").click();
  const modal = page.locator(".v24-films");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".v24-films-row")).toHaveCount(7); // foodics has 7 films
  await expect(modal.locator(".v24-films-row").first()).toContainText(/35\.6%|32,000\+|\$1B/);
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
});

test("a film inside the modal opens the fullscreen lightbox", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  await page.locator(".v24-feat").first().locator(".v24-more-bt").click();
  await expect(page.locator(".v24-films")).toBeVisible();
  await page.locator(".v24-films-media").first().click();
  await expect(page.locator(".v24-film")).toBeVisible();
});

test("category groups render the rest; >=20 work cards", async ({ page }) => {
  await skip(page);
  await page.goto("/portfolio-v24");
  expect(await page.locator(".v24-cat").count()).toBeGreaterThanOrEqual(3);
  expect(await page.locator(".v24-wcard").count()).toBeGreaterThanOrEqual(20);
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

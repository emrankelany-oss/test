import { test, expect } from "@playwright/test";

test("featured section renders the curated tiles and opens a project", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const section = page.locator("#v22-featured");
  await expect(section).toBeVisible();
  const tiles = section.locator(".v22-feat-tile");
  expect(await tiles.count()).toBeGreaterThanOrEqual(3);
  await tiles.first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("preloader plays then unmounts, marking the page ready", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator("body.v22-ready")).toHaveCount(1, { timeout: 6000 });
  await expect(page.locator(".v22-preloader")).toHaveCount(0);
});

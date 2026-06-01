import { test, expect } from "@playwright/test";

test("page assembles all sections in order with contact + footer", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-hero")).toBeVisible();
  await expect(page.locator(".v22-marquee")).toBeVisible();
  await expect(page.locator("#v22-featured")).toBeVisible();
  await expect(page.locator(".v22-caps")).toBeVisible();
  await expect(page.locator(".v22-arch")).toBeVisible();
  await expect(page.locator(".v22-impact")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("impact renders four stats and counts up on scroll", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const stats = page.locator(".v22-stat");
  await expect(stats).toHaveCount(4);
  await stats.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1600);
  const text = (await page.locator(".v22-stat-value").first().textContent())?.trim();
  expect(text).toMatch(/[0-9]/);
});

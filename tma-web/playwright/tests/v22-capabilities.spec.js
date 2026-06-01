import { test, expect } from "@playwright/test";

test("capabilities renders the three pillars and reveals on scroll", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const cards = page.locator(".v22-cap-card");
  await expect(cards).toHaveCount(3);
  await cards.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await expect(page.locator(".v22-cap-card.is-in").first()).toBeVisible();
  await expect(cards.nth(0)).toContainText(/Creativity/i);
});

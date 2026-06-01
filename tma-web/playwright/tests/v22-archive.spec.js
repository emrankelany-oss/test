import { test, expect } from "@playwright/test";

test("archive lists all projects and filters by category", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const cards = page.locator(".v22-arch-card");
  const total = await cards.count();
  expect(total).toBeGreaterThan(20);
  await page.locator(".v22-arch-filter-toggle").click();
  const chip = page.locator(".v22-arch-chip").nth(1);
  const label = (await chip.textContent())?.trim();
  await chip.click();
  await page.waitForTimeout(200);
  const filtered = await cards.count();
  expect(filtered).toBeLessThan(total);
  expect(label && label.length).toBeTruthy();
});

test("clicking an archive card opens its project", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await page.locator(".v22-arch-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

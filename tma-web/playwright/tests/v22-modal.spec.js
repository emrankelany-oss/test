import { test, expect } from "@playwright/test";

test("project modal opens from a programmatic open and closes on Escape", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await page.waitForFunction(() => typeof window.__v22OpenProject === "function");
  await page.evaluate(() => window.__v22OpenProject("foodics-boundless"));
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Foodics/i);
  await expect(page.locator(".v22-modal-card :focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

import { test, expect } from "@playwright/test";

test("v22 page mounts with the hero headline and dark theme", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-page")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/storytelling/i);
});

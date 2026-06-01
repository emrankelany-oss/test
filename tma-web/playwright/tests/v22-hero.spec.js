import { test, expect } from "@playwright/test";

test("hero renders headline, eyebrow, magnetic showreel CTA and dot-field", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-hero")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/storytelling/i);
  await expect(page.locator(".v22-hero [data-cursor='view']")).toBeVisible();
  await expect(page.locator(".v22-dotfield .v22-dot")).toHaveCount(14);
});

test("headline characters are split for reveal", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-hero h1 .rv-u").first()).toBeAttached();
});

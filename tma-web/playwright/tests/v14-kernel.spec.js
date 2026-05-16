import { test, expect } from "@playwright/test";

test("portfolio-v14 route renders the experience root", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");
  await expect(page.locator('[data-v14-root]')).toBeVisible();
  expect(errors).toEqual([]);
});

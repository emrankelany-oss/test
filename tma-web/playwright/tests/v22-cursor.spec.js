import { test, expect } from "@playwright/test";

test("magnetic cursor mounts on fine-pointer and hides native cursor in zones", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-cursor")).toHaveCount(1);
  await expect(page.locator("body.v22-has-cursor")).toHaveCount(1);
});

test("cursor reports the zone label via data attribute", async ({ page }) => {
  await page.goto("/portfolio-v22");
  // Wait until the cursor is actually wired (the same effect that attaches the
  // global pointerover listener adds this body class). Without this, a single
  // hover() can fire before hydration attaches the listener and be missed.
  await expect(page.locator("body.v22-has-cursor")).toBeAttached();
  const probe = page.locator("[data-cursor='view']").first();
  await probe.hover();
  await expect(page.locator(".v22-cursor.is-active")).toBeVisible();
  await expect(page.locator(".v22-cursor-label")).toContainText(/showreel|view/i);
});

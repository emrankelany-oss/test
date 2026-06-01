import { test, expect } from "@playwright/test";

// Use page.emulateMedia() rather than test.use({ reducedMotion }) because the
// test.use fixture only affects CSS animations; emulateMedia also propagates to
// window.matchMedia so the components' JS guards actually fire.
test("reduced motion: no custom cursor, headings present, marquee static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/portfolio-v22");
  await expect(page.locator(".v22-cursor")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/storytelling/i);
  await expect(page.locator(".v22-hero h1.is-in")).toBeVisible();
  const track = page.locator(".v22-marquee-track");
  const read = () => track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  const a = await read();
  await page.waitForTimeout(500);
  const b = await read();
  expect(b).toBe(a);
});

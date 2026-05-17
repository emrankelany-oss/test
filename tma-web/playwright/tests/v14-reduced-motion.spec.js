import { test, expect } from "@playwright/test";

test.use({ colorScheme: "dark" });

test("reduced motion: static, fully scrollable, all scenes reachable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");

  await expect(page.locator('[data-scene="film"]')).toBeVisible();
  await page.locator('[data-scene="zid"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="zid"]')).toBeInViewport();

  // No pin lock: document scrolls past the film without trapping.
  const scrolled = await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    return window.scrollY;
  });
  expect(scrolled).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

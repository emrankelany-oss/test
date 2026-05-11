import { test, expect } from "@playwright/test";

const ROUTES = ["/", "/careers", "/case/foodics-boundless", "/article/gtm-brand-not-bid"];

for (const route of ROUTES) {
  test(`no horizontal scroll on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500); // allow layout settle

    const overflow = await page.evaluate(() => {
      const body = document.documentElement;
      return {
        scrollWidth: body.scrollWidth,
        innerWidth: window.innerWidth,
        overflowing: body.scrollWidth - window.innerWidth,
      };
    });

    // Tolerate up to 8px (sub-pixel rounding, scrollbar rendering, etc.)
    expect.soft(
      overflow.overflowing,
      `overflows by ${overflow.overflowing}px (scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth})`
    ).toBeLessThanOrEqual(8);
  });

  test(`above-the-fold renders on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const headline = page.locator("h1").first();
    await expect(headline).toBeVisible();
  });
}

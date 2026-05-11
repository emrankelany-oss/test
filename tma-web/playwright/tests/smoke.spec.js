import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/", h1: /storytelling/i },
  { path: "/careers", h1: /build the work/i },
  { path: "/case/foodics-boundless", h1: /Boundless/i },
  { path: "/case/zid-ripple", h1: /Ripple/i },
  { path: "/article/foodics-platform", h1: /POS to/i },
  { path: "/article/gtm-brand-not-bid", h1: /brand,/i },
  { path: "/article/launch-as-category", h1: /category-defining/i },
];

for (const r of ROUTES) {
  test(`route ${r.path} returns 200 and has expected h1`, async ({ page }) => {
    const resp = await page.goto(r.path, { waitUntil: "domcontentloaded" });
    expect(resp.status()).toBe(200);
    const h1Text = (await page.locator("h1").first().textContent()) || "";
    expect(h1Text).toMatch(r.h1);
  });
}

test("home → careers link works at every breakpoint (uses Careers section role link)", async ({ page }) => {
  await page.goto("/");
  // The home page's Careers section (#careers) lists role links pointing at /careers#<id>.
  // These are visible at every breakpoint, unlike the top-nav links which collapse below 900px.
  // Pick the first .opp-row inside the #careers section.
  const link = page.locator("section#careers a.opp-row").first();
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForURL("**/careers**");
  expect(page.url()).toContain("/careers");
});

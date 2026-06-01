import { test, expect } from "@playwright/test";

const SETTLE_MS = 450;
const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollBottom = (page) =>
  page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));

test("spacing tokens resolve to generous values", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const px = (name) =>
    page.evaluate((n) => {
      const probe = document.createElement("div");
      probe.style.height = `var(${n})`;
      document.querySelector(".v21-page").appendChild(probe);
      const h = parseFloat(getComputedStyle(probe).height) || 0;
      probe.remove();
      return h;
    }, name);
  expect(await px("--space-act")).toBeGreaterThan(150);
  expect(await px("--space-block")).toBeGreaterThan(60);
  expect(await px("--gutter")).toBeGreaterThan(20);
});

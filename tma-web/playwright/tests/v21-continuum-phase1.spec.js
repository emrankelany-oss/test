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

test("custom cursor mounts and follows the pointer (desktop)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  const cursor = page.locator(".v21-cursor");
  await expect(cursor).toHaveCount(1);

  await page.mouse.move(300, 300);
  await page.waitForTimeout(120);
  const a = await cursor.evaluate((el) => el.getBoundingClientRect());
  await page.mouse.move(900, 600);
  await page.waitForTimeout(200);
  const b = await cursor.evaluate((el) => el.getBoundingClientRect());
  expect(Math.abs(b.left - a.left) + Math.abs(b.top - a.top)).toBeGreaterThan(50);
});

test("reduced-motion: custom cursor is not rendered", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.locator(".v21-cursor")).toHaveCount(0);
});

test("hero is type-first: serif headline lines + framed reel inset, generous top space", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);

  await expect(page.locator(".v21-hero .v21h-line")).toHaveCount(4);
  await expect(page.locator(".v21-hero .v21h-reel")).toHaveCount(1);
  const padTop = await page.locator(".v21-hero").evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
  expect(padTop).toBeGreaterThan(90);
  const fam = await page.locator(".v21-hero .v21h-headline").evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase());
  expect(fam).toContain("fraunces");
});

test("reduced-motion: hero headline lines are fully visible (no entrance animation)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v21");
  await page.waitForTimeout(SETTLE_MS);
  const op = await page.locator(".v21-hero .v21h-line span").first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.95);
});

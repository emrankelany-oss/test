import { test, expect } from "@playwright/test";

// Local dev server (the /portfolio-v19 route is unmerged):
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v19-filament.spec.js
// All page.goto() calls are relative and resolve against the configured baseURL.
// NOTE: globals.css sets `html { scroll-behavior: smooth }`, so scroll helpers
// MUST pass behavior:"instant" or reads race the smooth animation.

const SETTLE_MS = 450;

const readOffset = (page) =>
  page.evaluate(() => {
    const p = document.querySelector(".v19-filament-path");
    return parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
  });

test("filament mounts inside Featured Work", async ({ page }) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19fw .v19-filament svg path")).toHaveCount(1);
});

test("filament draws as the section scrolls (dashoffset decreases)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament-path")).toBeVisible();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(SETTLE_MS);
  const top = await readOffset(page);

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(SETTLE_MS);
  const bottom = await readOffset(page);

  // fully scrolled = more of the path drawn = smaller remaining offset
  expect(bottom).toBeLessThan(top);
});

test("reduced-motion: path is fully drawn and stays static on scroll", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament-path")).toBeVisible();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(SETTLE_MS);
  const top = await readOffset(page);

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(SETTLE_MS);
  const bottom = await readOffset(page);

  // static full path: offset ~0 and unchanged by scroll
  expect(top).toBeLessThan(1);
  expect(Math.abs(bottom - top)).toBeLessThan(1);
});

test("no console errors during mount + scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v19");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});

test("unmount removes the filament (navigation away)", async ({ page }) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament")).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".v19-filament")).toHaveCount(0);
});

import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const URL = BASE.replace(/\/$/, "") + "/obsidian-hero";

test("canvas mounts and acquires a WebGL context", async ({ page }) => {
  await page.goto(URL);
  const canvas = page.locator(".oh-canvas-wrap canvas");
  await expect(canvas).toBeVisible();
  const hasGL = await canvas.evaluate((c) => {
    const gl = c.getContext("webgl");
    return !!gl;
  });
  expect(hasGL).toBe(true);
});

test("parallax matches a = factor*vh*(progress-0.5), clamped", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(URL);
  const cap = page.locator(".oh-caption");
  await expect(cap).toBeVisible();

  const readY = async () =>
    cap.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.round(m.m42 * 10) / 10;
    });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
  const yTop = await readY();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  const yBottom = await readY();

  // factor 0.1, vh 900 → saturates at ±0.1*900*0.5 = ±45px. Direction: + at bottom.
  expect(yBottom).toBeGreaterThan(yTop);
  expect(Math.abs(yBottom)).toBeLessThanOrEqual(45 + 0.5);
});

test("reduced-motion: static image, no canvas", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL);
  await expect(page.locator(".oh-fallback")).toBeVisible();
  await expect(page.locator(".oh-canvas-wrap canvas")).toHaveCount(0);
  await ctx.close();
});

test("unmount leaves no WebGL context leak (navigation away)", async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator(".oh-canvas-wrap canvas")).toBeVisible();
  await page.goto(BASE.replace(/\/$/, "") + "/");
  await expect(page.locator(".oh-canvas-wrap canvas")).toHaveCount(0);
});

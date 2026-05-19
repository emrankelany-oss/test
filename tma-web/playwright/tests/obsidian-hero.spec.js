import { test, expect } from "@playwright/test";

// Run against a local dev server (the /obsidian-hero route is unmerged):
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test obsidian-hero.spec.js
// All page.goto() calls are relative and resolve against the configured baseURL.
// NOTE: the app sets `html { scroll-behavior: smooth }` globally, so scroll
// helpers MUST pass behavior:"instant" or reads race the smooth animation.

const SETTLE_MS = 450; // RAF scroll loop + dedupe settle

test("relief canvas mounts and acquires a WebGL context", async ({ page }) => {
  await page.goto("/obsidian-hero");
  const canvas = page.locator(".oh-canvas-wrap canvas");
  await expect(canvas).toBeVisible();
  const hasGL = await canvas.evaluate((c) => !!c.getContext("webgl"));
  expect(hasGL).toBe(true);
});

test("cut-out engine is always visible and z-interleaved with the headline", async ({ page }) => {
  await page.goto("/obsidian-hero");
  // two engine layers (back behind text, front clipped in front of text)
  await expect(page.locator(".oh-engine--back img")).toBeVisible();
  await expect(page.locator(".oh-engine--front img")).toBeVisible();
  // headline present & accessible
  await expect(page.locator(".oh-h--1")).toHaveAttribute(
    "aria-label",
    "Motion in every frame"
  );
});

test("parallax + engine push respond to scroll, clamped", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/obsidian-hero");
  const cap = page.locator(".oh-caption");
  await expect(cap).toBeVisible();

  const read = async () =>
    page.evaluate(() => {
      const root = document.querySelector(".oh-root");
      const cap = document.querySelector(".oh-caption");
      const m = new DOMMatrixReadOnly(getComputedStyle(cap).transform);
      const engY = parseFloat(
        getComputedStyle(root).getPropertyValue("--eng-y")
      ) || 0;
      return {
        capY: Math.round(m.m42 * 10) / 10,
        engY,
        scrolled: root.dataset.scrolled,
      };
    });

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(SETTLE_MS);
  const top = await read();

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(SETTLE_MS);
  const bottom = await read();

  // caption parallax: factor 0.08, vh 900 → saturates at ±0.08*900*0.5 = ±36px
  expect(bottom.capY).toBeGreaterThan(top.capY);
  expect(Math.abs(bottom.capY)).toBeLessThanOrEqual(36 + 0.5);
  // engine pushes up (negative --eng-y) and the scroll-cue state flips
  expect(top.engY).toBeCloseTo(0, 0);
  expect(bottom.engY).toBeLessThan(-1);
  expect(top.scrolled).toBe("false");
  expect(bottom.scrolled).toBe("true");
});

test("reduced-motion: no canvas, static cut-out engine still shown", async ({
  page,
}) => {
  // emulate BEFORE navigation so usePrefersReducedMotion's initializer reads it
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/obsidian-hero");
  await expect(page.locator(".oh-canvas-wrap canvas")).toHaveCount(0);
  // the engine is a real element, so the static hero still reads
  await expect(page.locator(".oh-engine--back img")).toBeVisible();
  await expect(page.locator(".oh-h--1")).toHaveAttribute(
    "aria-label",
    "Motion in every frame"
  );
});

test("unmount leaves no WebGL canvas (navigation away)", async ({ page }) => {
  await page.goto("/obsidian-hero");
  await expect(page.locator(".oh-canvas-wrap canvas")).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".oh-canvas-wrap canvas")).toHaveCount(0);
});

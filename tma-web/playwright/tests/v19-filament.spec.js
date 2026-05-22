import { test, expect } from "@playwright/test";

// Local dev server (the /portfolio-v19 route is unmerged):
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v19-filament.spec.js
// All page.goto() calls are relative and resolve against the configured baseURL.
// NOTE: globals.css sets `html { scroll-behavior: smooth }`, so scroll helpers
// MUST pass behavior:"instant" or reads race the smooth animation.

const SETTLE_MS = 450;
// the draw + wipe run on a slow scrub (2.5), so reads must wait for the eased
// tween to catch up to the new scroll position.
const SCRUB_SETTLE_MS = 3200;

const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollTop = (page) => scrollTo(page, 0);
const scrollBottom = (page) =>
  page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );

const readOffset = (page) =>
  page.evaluate(() => {
    const p = document.querySelector(".v19-filament-path");
    return parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
  });

const readWipe = (page) =>
  page.evaluate(() => {
    const w = document.querySelector(".v19fw-title-word");
    return w
      ? parseFloat(getComputedStyle(w).getPropertyValue("--v19-wipe")) || 0
      : -1;
  });

test("filament mounts inside the work lane", async ({ page }) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-worklane .v19-filament svg path")).toHaveCount(1);
});

test("line is thick and starts at the section's top-left corner", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForTimeout(SETTLE_MS);
  const info = await page.evaluate(() => {
    const p = document.querySelector(".v19-filament-path");
    return { sw: p.getAttribute("stroke-width"), d: p.getAttribute("d") };
  });
  expect(parseFloat(info.sw)).toBeGreaterThanOrEqual(4);
  expect(info.d.trim().startsWith("M 0 0")).toBe(true);
});

test("filament draws as the section scrolls (dashoffset decreases)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament-path")).toBeVisible();

  await scrollTop(page);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const top = await readOffset(page);

  await scrollBottom(page);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const bottom = await readOffset(page);

  // fully scrolled = more of the path drawn = smaller remaining offset
  expect(bottom).toBeLessThan(top);
});

test('"Featured" wipes to the line colour past contact and reverts on scroll-back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19fw-title-word")).toBeVisible();

  await scrollTop(page);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const wipeTop = await readWipe(page);

  await scrollBottom(page);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const wipeBottom = await readWipe(page);

  await scrollTop(page);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const wipeBack = await readWipe(page);

  // not yet touched at top → ~0; fully crossed at bottom → ~100; reversible
  expect(wipeTop).toBeLessThan(10);
  expect(wipeBottom).toBeGreaterThan(90);
  expect(wipeBack).toBeLessThan(10);
});

// SKIPPED: the lane filament (Featured + Our Work) deliberately crosses the
// title line — the old Featured-only "avoid narratives" property no longer
// applies. Left for reference.
test.skip("line never overlaps the \"narratives\" word", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForTimeout(SETTLE_MS);

  const hit = await page.evaluate(() => {
    const path = document.querySelector(".v19-filament-path");
    const section = document.querySelector(".v19fw");
    const em = document.querySelector(".v19fw-title em");
    const s = section.getBoundingClientRect();
    const e = em.getBoundingClientRect();
    const box = {
      l: e.left - s.left,
      r: e.right - s.left,
      t: e.top - s.top,
      b: e.bottom - s.top,
    };
    const len = path.getTotalLength();
    for (let i = 0; i <= 800; i++) {
      const pt = path.getPointAtLength((len * i) / 800);
      if (
        pt.x > box.l + 2 &&
        pt.x < box.r - 2 &&
        pt.y > box.t + 2 &&
        pt.y < box.b - 2
      ) {
        return { x: pt.x, y: pt.y };
      }
    }
    return null;
  });

  expect(hit).toBeNull();
});

test("reduced-motion: full path drawn, word fully lit, static on scroll", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament-path")).toBeVisible();

  await scrollTop(page);
  await page.waitForTimeout(SETTLE_MS);
  const top = await readOffset(page);
  const wipe = await readWipe(page);

  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  const bottom = await readOffset(page);

  // static full path (offset ~0, unchanged) and the word resting fully lit
  expect(top).toBeLessThan(1);
  expect(Math.abs(bottom - top)).toBeLessThan(1);
  expect(wipe).toBeGreaterThan(90);
});

test("no console errors during mount + scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v19");
  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(errors).toEqual([]);
});

test("unmount removes the filament (navigation away)", async ({ page }) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament")).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".v19-filament")).toHaveCount(0);
});

const readOwWorkWipe = (page) =>
  page.evaluate(() => {
    const w = document.querySelector(".v19ow-title em");
    return w
      ? parseFloat(getComputedStyle(w).getPropertyValue("--v19-wipe")) || 0
      : -1;
  });

test('"WORK" (Our Work) wipes to the line colour as the line crosses it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForFunction(() => !document.querySelector(".v19pl"), null, {
    timeout: 12000,
  });
  const owDoc = await page.evaluate(
    () =>
      Math.round(
        window.scrollY +
          document.querySelector(".v19ow-title").getBoundingClientRect().top
      )
  );

  // before the line reaches Our Work
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    Math.max(0, owDoc - 1100)
  );
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const before = await readOwWorkWipe(page);

  // scrolled so the line has crossed the "Our Work" title
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    owDoc - 200
  );
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const after = await readOwWorkWipe(page);

  expect(before).toBeLessThan(50);
  expect(after).toBeGreaterThan(before);
  expect(after).toBeGreaterThan(80);
});

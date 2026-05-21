import { test, expect } from "@playwright/test";

// Local dev server (the /portfolio-v19 route is unmerged):
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v19-filament.spec.js
// All page.goto() calls are relative and resolve against the configured baseURL.
// NOTE: globals.css sets `html { scroll-behavior: smooth }`, so scroll helpers
// MUST pass behavior:"instant" or reads race the smooth animation.
//
// The filament is ONE line in two coordinated segments behind the content:
//   - a "lead" segment in the hero (draws ~2x faster, completes by ~half the
//     hero scroll), ending at the hero's bottom-left corner;
//   - the featured segment, which starts at that same seam and crosses the
//     "Featured" word. Selectors are scoped to .v19-hero / .v19fw accordingly.

const SETTLE_MS = 450;
const SCRUB_SETTLE_MS = 3200; // slow scrub → wait for the eased tween to catch up

const scrollTo = (page, top) =>
  page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const scrollTop = (page) => scrollTo(page, 0);
const scrollBottom = (page) =>
  page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );

const readOffset = (page, scope = ".v19fw") =>
  page.evaluate((sc) => {
    const p = document.querySelector(sc + " .v19-filament-path");
    return p ? parseFloat(getComputedStyle(p).strokeDashoffset) || 0 : -1;
  }, scope);

const readWipe = (page) =>
  page.evaluate(() => {
    const w = document.querySelector(".v19fw-title-word");
    return w
      ? parseFloat(getComputedStyle(w).getPropertyValue("--v19-wipe")) || 0
      : -1;
  });

test("both filament segments mount (hero lead + featured)", async ({ page }) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-hero .v19-filament svg path")).toHaveCount(1);
  await expect(page.locator(".v19fw .v19-filament svg path")).toHaveCount(1);
});

test("hero lead starts at the lower-left, above the Scroll cue", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForTimeout(SETTLE_MS);
  const r = await page.evaluate(() => {
    const hero = document.querySelector(".v19-hero");
    const path = document.querySelector(".v19-hero .v19-filament-path");
    const scroll = document.querySelector(".v19-scroll");
    const s = hero.getBoundingClientRect();
    const start = path.getPointAtLength(0);
    const sc = scroll.getBoundingClientRect();
    return {
      w: s.width,
      h: s.height,
      startX: start.x,
      startY: start.y,
      scrollTopY: sc.top - s.top,
    };
  });
  // near the left border, in the lower hero, and above the Scroll word
  expect(r.startX).toBeLessThan(r.w * 0.1);
  expect(r.startY).toBeGreaterThan(r.h * 0.6);
  expect(r.startY).toBeLessThan(r.scrollTopY);
});

test("hero lead line ends at the bottom-left seam (joins the featured line)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForTimeout(SETTLE_MS);
  const end = await page.evaluate(() => {
    const path = document.querySelector(".v19-hero .v19-filament-path");
    const pt = path.getPointAtLength(path.getTotalLength());
    return { x: pt.x, y: pt.y, h: document.querySelector(".v19-hero").clientHeight };
  });
  // featured segment begins at "M 0 0" — the lead must arrive at x≈0, y≈heroH
  expect(end.x).toBeLessThan(2);
  expect(Math.abs(end.y - end.h)).toBeLessThan(2);
});

test("hero lead draws fast and completes by ~half the hero scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-hero .v19-filament-path")).toBeVisible();

  await scrollTop(page);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const top = await readOffset(page, ".v19-hero");

  await scrollTo(page, Math.round(900 * 0.55));
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const half = await readOffset(page, ".v19-hero");

  // by the hero midpoint the lead is essentially fully drawn (≈2x rate)
  expect(half).toBeLessThan(top);
  expect(half).toBeLessThan(top * 0.2);
});

test("featured line draws as the section scrolls (dashoffset decreases)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19fw .v19-filament-path")).toBeVisible();

  await scrollTop(page);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const top = await readOffset(page, ".v19fw");

  await scrollBottom(page);
  await page.waitForTimeout(SCRUB_SETTLE_MS);
  const bottom = await readOffset(page, ".v19fw");

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

  expect(wipeTop).toBeLessThan(10);
  expect(wipeBottom).toBeGreaterThan(90);
  expect(wipeBack).toBeLessThan(10);
});

test("line never overlaps the \"narratives\" word", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await page.waitForTimeout(SETTLE_MS);

  const hit = await page.evaluate(() => {
    const path = document.querySelector(".v19fw .v19-filament-path");
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

test("reduced-motion: both segments full + static, word fully lit", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-hero .v19-filament-path")).toBeVisible();

  await scrollTop(page);
  await page.waitForTimeout(SETTLE_MS);
  const leadTop = await readOffset(page, ".v19-hero");
  const featTop = await readOffset(page, ".v19fw");
  const wipe = await readWipe(page);

  await scrollBottom(page);
  await page.waitForTimeout(SETTLE_MS);
  const leadBottom = await readOffset(page, ".v19-hero");
  const featBottom = await readOffset(page, ".v19fw");

  // both rendered fully (offset ~0) and unchanged by scroll; word resting lit
  expect(leadTop).toBeLessThan(1);
  expect(featTop).toBeLessThan(1);
  expect(Math.abs(leadBottom - leadTop)).toBeLessThan(1);
  expect(Math.abs(featBottom - featTop)).toBeLessThan(1);
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

test("unmount removes both filament segments (navigation away)", async ({
  page,
}) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19-filament")).toHaveCount(2);
  await page.goto("/");
  await expect(page.locator(".v19-filament")).toHaveCount(0);
});

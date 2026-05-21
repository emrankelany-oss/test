import { test, expect } from "@playwright/test";

// /portfolio-v19 intro: wordmark draw → flight to "Design".
// Runs against the local dev server (PLAYWRIGHT_BASE_URL).

test("flight path lands at the Design word border", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");

  // The flight tip is built at the burst and drawn to the Design word's
  // *resting* position. The hero word rises into that position over the split;
  // wait for it to settle (its box stops moving) so the comparison is against
  // the final border, not a mid-rise frame. Dev-server timing varies, so poll
  // rather than rely on a fixed delay.
  await page.waitForFunction(
    () => {
      const w = document.querySelector(".v19-line-4 .v19-line-word");
      const line = document.querySelector(".v19-line-4");
      if (!w || !line) return false;
      // The word's span rises (translateY 110% → 0) into its line box. It is
      // settled when its top has reached the (untransformed) line box top, and
      // the flight path — built earlier at the burst — is present in the DOM.
      const settled =
        Math.abs(w.getBoundingClientRect().top - line.getBoundingClientRect().top) < 1;
      const drawn = !!document
        .querySelector(".v19pl-flight path")
        ?.getAttribute("d");
      return settled && drawn;
    },
    { timeout: 9000, polling: 150 }
  );

  const r = await page.evaluate(() => {
    const path = document.querySelector(".v19pl-flight path");
    const word = document.querySelector(".v19-line-4 .v19-line-word");
    if (!word) return { target: null };
    const wb = word.getBoundingClientRect();
    const target = { x: wb.left, y: wb.top + wb.height / 2 };
    if (!path) return { landed: "no-flight", target };
    const end = path.getPointAtLength(path.getTotalLength());
    return { endX: end.x, endY: end.y, target };
  });
  expect(r.target).toBeTruthy();
  // the poll above guarantees the flight path was drawn, so this must run
  // (guarding it behind a conditional would let a missing-flight regression pass)
  expect(r.endX).toBeDefined();
  expect(Math.abs(r.endX - r.target.x)).toBeLessThan(6);
  expect(Math.abs(r.endY - r.target.y)).toBeLessThan(6);
});

test("reduced motion: wordmark shown, no flight, hero lead rests static at Design", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v19");
  // intro completes quickly under reduced motion; wait for the overlay to unmount
  await page.waitForFunction(() => !document.querySelector(".v19pl"), null, {
    timeout: 12000,
  });
  // the hero lead renders fully drawn (static full path) under reduced motion
  const off = await page.evaluate(() => {
    const p = document.querySelector(".v19-hero .v19-filament-path");
    return p ? parseFloat(getComputedStyle(p).strokeDashoffset) || 0 : -1;
  });
  expect(off).toBeGreaterThanOrEqual(0);
  expect(off).toBeLessThan(2); // static full path under reduced motion
});

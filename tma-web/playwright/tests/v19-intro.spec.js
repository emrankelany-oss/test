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
  if (r.endX !== undefined) {
    expect(Math.abs(r.endX - r.target.x)).toBeLessThan(6);
    expect(Math.abs(r.endY - r.target.y)).toBeLessThan(6);
  }
});

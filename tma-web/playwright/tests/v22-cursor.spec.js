import { test, expect } from "@playwright/test";

// The custom cursor only mounts when the primary pointer is fine (mouse/trackpad).
// Touch viewports (mobile-375, tablet-768) use hasTouch: true which makes
// (pointer: fine) → false, so the cursor correctly stays off; skip those tests there.
const isFinePointer = async (page) => {
  return page.evaluate(() => window.matchMedia("(pointer: fine)").matches);
};

test("magnetic cursor mounts on fine-pointer and hides native cursor in zones", async ({ page }) => {
  await page.goto("/portfolio-v22");
  if (!(await isFinePointer(page))) {
    // Touch viewport — cursor intentionally absent; assert it stays hidden
    await expect(page.locator(".v22-cursor")).toHaveCount(0);
    return;
  }
  await expect(page.locator(".v22-cursor")).toHaveCount(1);
  await expect(page.locator("body.v22-has-cursor")).toHaveCount(1);
});

test("cursor reports the zone label via data attribute", async ({ page }) => {
  await page.goto("/portfolio-v22");
  if (!(await isFinePointer(page))) {
    // Touch viewport — no cursor to test; just assert it's absent
    await expect(page.locator(".v22-cursor")).toHaveCount(0);
    return;
  }
  // Wait until the cursor is actually wired (the same effect that attaches the
  // global pointerover listener adds this body class). Without this, a single
  // hover() can fire before hydration attaches the listener and be missed.
  await expect(page.locator("body.v22-has-cursor")).toBeAttached();
  // Brief settle: right after the cursor mounts, Lenis/GSAP initialization can
  // briefly place elements on top of cursor zones. Waiting ~800 ms lets the
  // page fully settle so pointerover reaches the intended [data-cursor] element.
  await page.waitForTimeout(800);

  // Use page.mouse.move so both pointermove and pointerover fire, which
  // is what the cursor's document-level pointerover handler listens for.
  const probe = page.locator("[data-cursor='view']").first();
  const box = await probe.boundingBox();
  await page.mouse.move(0, 0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator(".v22-cursor.is-active")).toBeVisible();
  await expect(page.locator(".v22-cursor-label")).toContainText(/showreel|view|see project|filters/i);
});

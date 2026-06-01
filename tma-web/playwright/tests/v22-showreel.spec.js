import { test, expect } from "@playwright/test";

test("film lightbox opens from a programmatic open and closes on Escape", async ({ page }) => {
  await page.goto("/portfolio-v22");
  await page.waitForFunction(() => typeof window.__v22OpenFilm === "function");
  await page.evaluate(() =>
    window.__v22OpenFilm({ id: "t", title: "Test Film", kind: "mp4", src: "/assets/videos/media1.mp4", poster: "/assets/videos/posters/media1.jpg" })
  );
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("video")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("showreel section mounts with both cards and all films as tiles", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const section = page.locator("#v22-featured.v22-showreel");
  await expect(section).toHaveCount(1);
  await expect(section.locator(".v22-sr-card")).toHaveCount(2);
  await expect(section.locator(".v22-sr-tile")).toHaveCount(9);
  await expect(section.locator(".v22-sr-group[data-slug='foodics-boundless'] .v22-sr-tile")).toHaveCount(7);
});

test("clicking a film tile opens the lightbox", async ({ page }) => {
  await page.goto("/portfolio-v22");
  // Wait briefly for React hydration so data-mode may update to "orbit"
  await page.waitForTimeout(600);
  const section = page.locator("#v22-featured");
  const mode = await section.getAttribute("data-mode");
  if (mode === "orbit") {
    // Step-scroll through the pinned range until the section enters a hold
    // (is-hold → tiles get pointer-events) AND a Foodics tile is fully faded in.
    // Robust to timeline-duration changes (no hard-coded scroll offset).
    const top = await section.evaluate((el) => window.scrollY + el.getBoundingClientRect().top);
    const tile = page.locator(".v22-sr-group[data-slug='foodics-boundless'] .v22-sr-tile").first();
    // Lenis smooth-scroll needs a real settle, so use coarse steps with a 500ms
    // wait across the Foodics-hold range until is-hold is active and a tile is
    // faded in. Robust to timeline-duration shifts (no single magic offset).
    let ready = false;
    for (const mult of [1.8, 2.0, 2.2, 2.4, 2.6, 2.8]) {
      if (ready) break;
      await page.evaluate(({ y, m }) => window.scrollTo(0, y + window.innerHeight * m), { y: top, m: mult });
      await page.waitForTimeout(500);
      ready = await page.evaluate(() => {
        const sec = document.querySelector("#v22-featured");
        const t = document.querySelector(".v22-sr-group[data-slug='foodics-boundless'] .v22-sr-tile");
        return sec.classList.contains("is-hold") && parseFloat(getComputedStyle(t).opacity) > 0.6;
      });
    }
    expect(ready).toBe(true);
    await tile.click();
  } else {
    await page.locator(".v22-sr-tile").first().scrollIntoViewIfNeeded();
    await page.locator(".v22-sr-tile").first().click();
  }
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("desktop: section pins and Foodics films reach the ring on scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio-v22");
  const fine = await page.evaluate(() => matchMedia("(pointer: fine)").matches && matchMedia("(min-width: 861px)").matches);
  test.skip(!fine, "orbit only on wide fine-pointer");
  const section = page.locator("#v22-featured");
  await expect(section).toHaveAttribute("data-mode", "orbit");
  const top = await section.evaluate((el) => window.scrollY + el.getBoundingClientRect().top);
  await page.evaluate((y) => window.scrollTo(0, y + 1), top);
  await page.waitForTimeout(400);
  const box1 = await page.locator(".v22-sr-stage").boundingBox();
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 2.2), top);
  await page.waitForTimeout(800);
  const box2 = await page.locator(".v22-sr-stage").boundingBox();
  expect(Math.abs(box2.y - box1.y)).toBeLessThan(40); // pinned: stage stays put
  const visible = await page.locator(".v22-sr-group[data-slug='foodics-boundless'] .v22-sr-tile")
    .evaluateAll((els) => els.filter((e) => parseFloat(getComputedStyle(e).opacity) > 0.6).length);
  expect(visible).toBeGreaterThan(0);
});

test("reduced motion: static gallery, no pin, all tiles present", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/portfolio-v22");
  await expect(page.locator("#v22-featured")).toHaveAttribute("data-mode", "static");
  await expect(page.locator(".v22-sr-tile")).toHaveCount(9);
  await page.locator(".v22-sr-tile").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("mobile: static gallery renders all tiles", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/portfolio-v22");
  await expect(page.locator("#v22-featured")).toHaveAttribute("data-mode", "static");
  await expect(page.locator(".v22-sr-tile")).toHaveCount(9);
});

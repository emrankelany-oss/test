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
  await page.locator(".v22-sr-tile").first().scrollIntoViewIfNeeded();
  await page.locator(".v22-sr-tile").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

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

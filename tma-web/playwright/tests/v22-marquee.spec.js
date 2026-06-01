import { test, expect } from "@playwright/test";

test("marquee renders a duplicated track that translates over time", async ({ page }) => {
  await page.goto("/portfolio-v22");
  const track = page.locator(".v22-marquee-track");
  await expect(track).toBeVisible();
  const read = () => track.evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return m.m41; // translateX
  });
  const a = await read();
  await page.waitForTimeout(600);
  const b = await read();
  expect(b).not.toBe(a); // it is moving
});

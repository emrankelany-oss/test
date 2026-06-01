import { test, expect } from "@playwright/test";

test("no console errors on load and after a full scroll", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/portfolio-v22");
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
  });
  await page.waitForTimeout(400);
  expect(errors, errors.join("\n")).toEqual([]);
});

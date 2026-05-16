import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("V12 launch sequence", () => {
  test("opening type, phase captures, CTA, no overflow", async ({ page }) => {
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(`${BASE}/portfolio-v12`, { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toContainText("We launch them.");

    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = await page.evaluate(() => window.innerHeight);
    const steps = [0, 0.25, 0.5, 0.75, 1];
    for (const s of steps) {
      await page.evaluate((y) => window.scrollTo(0, y), s * (height - vh));
      await page.waitForTimeout(900);
      await page.screenshot({ path: `v12-phase-${Math.round(s * 100)}.png`, fullPage: false });
    }

    await expect(page.getByText("$20.8M")).toBeAttached();
    await expect(page.getByText("200%")).toBeAttached();

    const cta = page.getByRole("link", { name: "INITIATE PROJECT" });
    await expect(cta).toHaveAttribute("href", "mailto:info@themotionagency.net");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);

    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("mobile: ecosystem fallback, no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/portfolio-v12`, { waitUntil: "networkidle" });
    await expect(page.getByText("Brand Strategy & Positioning")).toBeAttached();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
});

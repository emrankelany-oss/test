import { test, expect } from "@playwright/test";

test.describe("V23 — Clim-mechanics landing", () => {
  test("no console errors on load and after a full scroll", async ({ page }) => {
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/portfolio-v23");
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y <= h; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    });
    await page.waitForTimeout(400);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("all sections render in order", async ({ page }) => {
    await page.goto("/portfolio-v23");
    const sections = await page.locator("[data-v23-section]").evaluateAll(
      (els) => els.map((e) => e.getAttribute("data-v23-section"))
    );
    expect(sections).toEqual(["hero", "statement", "work", "related"]);
    await expect(page.locator(".v23-panel-word")).toHaveText(/.+/);
  });

  test("hero headline splits into multiple lines", async ({ page }) => {
    await page.goto("/portfolio-v23");
    await page.waitForTimeout(300);
    const lines = await page.locator(".v23-hero-title .line").count();
    expect(lines).toBeGreaterThan(1);
  });

  test("work grid is video-led with mixed column spans", async ({ page }) => {
    await page.goto("/portfolio-v23");
    const cells = page.locator(".v23-els .v23-el");
    expect(await cells.count()).toBeGreaterThanOrEqual(8);
    expect(await page.locator(".v23-el-1").count()).toBeGreaterThan(0); // full-width rows
    expect(await page.locator(".v23-el-2").count()).toBeGreaterThan(0); // half-width pairs
    expect(await page.locator(".v23-els video").count()).toBeGreaterThan(0);
  });

  test("'More information' toggles the detail reveal and grid reflow", async ({ page }) => {
    await page.goto("/portfolio-v23");
    const btn = page.locator(".v23-more-bt");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    // dispatch directly so the assertion doesn't depend on smooth-scroll position
    await btn.dispatchEvent("click");
    await page.waitForTimeout(150);
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".v23-statement")).toHaveClass(/is-open/);
    await expect(page.locator(".v23-els")).toHaveClass(/is-open/);
  });

  test("related carousel mounts as a draggable track with duplicated cards", async ({ page }) => {
    await page.goto("/portfolio-v23");
    const track = page.locator(".v23-track");
    await expect(track).toHaveAttribute("data-v23-drag", /ready|static/);
    const cards = await page.locator(".v23-card").count();
    expect(cards).toBeGreaterThanOrEqual(8);
    // track is wider than the viewport (it scrolls)
    const overflow = await track.evaluate((t) => t.scrollWidth > window.innerWidth);
    expect(overflow).toBeTruthy();
  });

  test("iris reveal mechanism opens the hero media clip-path", async ({ page }) => {
    await page.goto("/portfolio-v23");
    await page.waitForTimeout(400);
    // force-fire by scrolling the trigger into view via wheel (Lenis-friendly)
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(900);
    const mask = await page.locator(".v23-hero-media .v23-im").evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--mask").trim()
    );
    expect(parseFloat(mask)).toBeGreaterThan(0);
  });
});

test.describe("V23 — reduced motion", () => {
  test("renders statically: no cursor, media visible, content present", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/portfolio-v23");
    await page.waitForTimeout(300);
    await expect(page.locator(".v23-cursor")).toHaveCount(0);
    await expect(page.locator(".v23-preloader")).toHaveCount(0);
    // iris fallback fully open
    const mask = await page.locator(".v23-hero-media .v23-im").evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--mask").trim()
    );
    expect(parseFloat(mask)).toBeGreaterThan(0);
    await expect(page.locator(".v23-track")).toHaveAttribute("data-v23-drag", "static");
  });
});

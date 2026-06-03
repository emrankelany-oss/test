import { test, expect } from "@playwright/test";

test.describe("V23 — Clim-mechanics landing", () => {
  // skip the heavy asset preloader so DOM/scroll assertions aren't blocked by it
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { window.__V23_SKIP_PRELOADER = true; });
  });

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
    expect(sections).toEqual(["hero", "statement", "featured", "work", "related"]);
    await expect(page.locator(".v23-panel-media")).toHaveAttribute("src", /studio-motion/);
  });

  test("featured section presents Foodics & Zid as multi-media case blocks", async ({ page }) => {
    await page.goto("/portfolio-v23");
    const blocks = page.locator("[data-v23-featured]");
    await expect(blocks).toHaveCount(2);
    await expect(page.locator('[data-v23-featured="foodics-boundless"]')).toBeAttached();
    await expect(page.locator('[data-v23-featured="zid-ripple"]')).toBeAttached();
    // real films wired in: autoplay videos + youtube event-film cells + result stats
    expect(await page.locator(".v23-feat video").count()).toBeGreaterThanOrEqual(5);
    expect(await page.locator(".v23-feat .v23-im-play").count()).toBeGreaterThanOrEqual(2);
    expect(await page.locator(".v23-feat-stats li").count()).toBeGreaterThan(0);
  });

  test("each featured block shows ONE lead film and reveals the rest on 'View all'", async ({ page }) => {
    await page.goto("/portfolio-v23");
    // exactly one lead cell per featured block
    await expect(page.locator(".v23-feat-lead .v23-el")).toHaveCount(2);
    const foodics = page.locator('[data-v23-featured="foodics-boundless"]');
    const rest = foodics.locator(".v23-feat-rest");
    const toggle = foodics.locator(".v23-feat-more");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(rest).toHaveAttribute("aria-hidden", "true");
    // collapsed
    await expect.poll(() => rest.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(5);
    // expand
    await expect(page.locator(".v23-track")).toHaveAttribute("data-v23-drag", /ready|static/);
    await toggle.dispatchEvent("click");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(foodics).toHaveClass(/is-open/);
    await expect(rest).toHaveAttribute("aria-hidden", "false");
    await expect.poll(() => rest.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(100);
  });

  test("hero headline splits into multiple lines", async ({ page }) => {
    await page.goto("/portfolio-v23");
    // SplitText runs after fonts/mount — poll rather than assume a fixed delay
    await expect
      .poll(() => page.locator(".v23-hero-title .line").count(), { timeout: 10000 })
      .toBeGreaterThan(1);
  });

  test("work grid lists the full remaining roster with mixed spans & media", async ({ page }) => {
    await page.goto("/portfolio-v23");
    const cells = page.locator(".v23-work .v23-el");
    await expect(cells.first()).toBeAttached();
    await expect.poll(() => cells.count(), { timeout: 10000 }).toBeGreaterThanOrEqual(20); // full roster minus featured
    expect(await page.locator(".v23-work .v23-el-1").count()).toBeGreaterThan(0); // full-width rows
    expect(await page.locator(".v23-work .v23-el-2").count()).toBeGreaterThan(0); // half-width pairs
    expect(await page.locator(".v23-work video").count()).toBeGreaterThan(0); // videos
    expect(await page.locator(".v23-work img").count()).toBeGreaterThan(0);   // images
  });

  test("'More information' toggles the detail reveal and grid reflow", async ({ page }) => {
    await page.goto("/portfolio-v23");
    const btn = page.locator(".v23-statement .v23-more-bt");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    // wait for client effects to hydrate (carousel sets this once mounted)
    await expect(page.locator(".v23-track")).toHaveAttribute("data-v23-drag", /ready|static/);
    // dispatch directly so the assertion doesn't depend on smooth-scroll position
    await btn.dispatchEvent("click");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".v23-statement")).toHaveClass(/is-open/);
    await expect(page.locator(".v23-work .v23-els")).toHaveClass(/is-open/);
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

  test("hero uses the Motion Agency slide-8 loop", async ({ page }) => {
    await page.goto("/portfolio-v23");
    const srcs = await page
      .locator(".v23-hero-media video source")
      .evaluateAll((els) => els.map((e) => e.getAttribute("src")));
    expect(srcs.join(" ")).toContain("slide8-loop");
  });

  test("low-res brand projects use real cropped deck images, and every card is clickable", async ({ page }) => {
    await page.goto("/portfolio-v23");
    // the 9 brands that were blurry now point at their cropped /deck.jpg
    const deckImgs = await page
      .locator(".v23-work .v23-el-open img")
      .evaluateAll((els) => els.map((e) => e.getAttribute("src")).filter((s) => s && s.endsWith("/deck.jpg")));
    expect(deckImgs.length).toBeGreaterThanOrEqual(9);
    // no blurry poster fallback left
    await expect(page.locator(".v23-work .v23-poster")).toHaveCount(0);
    // every card opens the modal
    await expect(page.locator(".v23-work .v23-el-open")).toHaveCount(27);
  });

  test("clicking a work card opens the project modal with PDF content", async ({ page }) => {
    await page.goto("/portfolio-v23");
    await expect(page.locator(".v23-modal")).toHaveCount(0);
    await page.locator(".v23-work .v23-el-open").first().dispatchEvent("click");
    await expect(page.locator(".v23-modal")).toBeVisible();
    await expect(page.locator(".v23-modal-title")).toHaveText(/.+/);
    await expect(page.getByText("What we did")).toBeVisible();
    // gallery shows real work imagery
    expect(await page.locator(".v23-modal-gallery img").count()).toBeGreaterThan(0);
    await page.locator(".v23-modal-scrim").dispatchEvent("click");
    await expect(page.locator(".v23-modal")).toHaveCount(0);
  });


  test("clicking a featured film opens the in-page lightbox", async ({ page }) => {
    await page.goto("/portfolio-v23");
    await expect(page.locator(".v23-film")).toHaveCount(0);
    await page.locator(".v23-feat .v23-im-play").first().dispatchEvent("click");
    await expect(page.locator(".v23-film")).toBeVisible();
    await expect(page.locator(".v23-film-media")).toBeVisible();
    // close
    await page.locator(".v23-film-scrim").dispatchEvent("click");
    await expect(page.locator(".v23-film")).toHaveCount(0);
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

test.describe("V23 — preloader", () => {
  test("premium preloader mounts, preloads, then reveals the page", async ({ page }) => {
    await page.goto("/portfolio-v23");
    await expect.poll(() => page.locator(".v23-preloader").count(), { timeout: 14000 }).toBe(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).not.toBe("hidden");
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

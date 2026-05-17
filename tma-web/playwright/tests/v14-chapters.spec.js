import { test, expect } from "@playwright/test";

async function actOf(page, scene) {
  return page.evaluate((s) => {
    const el = document.querySelector(`[data-scene="${s}"]`);
    return el ? el.getAttribute("data-act") : null;
  }, scene);
}

test("manifesto → foodics → zid reveal in order with their acts", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator('[data-scene="manifesto"]').waitFor({ state: "attached" });

  const seenActs = new Set();
  let foodicsResultsText = "";
  let zidResultsText = "";
  let sawManifestoClose = false;
  for (let y = 0; y <= 30000; y += 280) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    // Poll until Lenis has actually carried the scroll to (near) the target
    // before sampling — a fixed settle is load-sensitive and lets a narrow
    // act band slip between steps under cumulative dev-server load. Polling
    // settles exactly as long as needed so no band can be skipped; cap +
    // small post-arrival wait for the SceneController rAF to paint data-act.
    for (let w = 0; w < 30; w++) {
      const { sy, atBottom } = await page.evaluate(
        () => ({
          sy: window.scrollY,
          atBottom:
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight - 2,
        })
      );
      if (Math.abs(sy - y) <= 80 || atBottom) break;
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(90);
    for (const sc of ["manifesto", "foodics", "zid"]) {
      const a = await actOf(page, sc);
      if (a) seenActs.add(`${sc}:${a}`);
    }
    const body = await page.evaluate(() => document.body.innerText);
    if (body.includes("We create work that matters")) sawManifestoClose = true;
    if (body.includes("THE RESULTS") && body.includes("Merchants")) foodicsResultsText = body;
    if (body.includes("THE RESULTS") && body.includes("GMV")) zidResultsText = body;
  }

  for (const want of [
    "foodics:hook", "foodics:problem", "foodics:solution", "foodics:results",
    "zid:hook", "zid:problem", "zid:solution", "zid:results",
  ]) {
    expect([...seenActs]).toContain(want);
  }
  expect(sawManifestoClose).toBe(true);
  expect(foodicsResultsText).toContain("$20.8M");
  expect(foodicsResultsText).toContain("32,000+");
  expect(foodicsResultsText).toContain("$1B");
  expect(zidResultsText).toContain("200%");
  expect(zidResultsText).toContain("12,000+");
  expect(zidResultsText).toContain("+50%");
  expect(zidResultsText).toContain("+25%");
  expect(errors).toEqual([]);
});

test("reduced motion: every chapter resolved + page fully scrollable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14?frames=procedural");
  await page.locator('[data-scene="zid"]').waitFor({ state: "attached" });
  await page.waitForTimeout(400);

  expect(await actOf(page, "foodics")).toBe("results");
  expect(await actOf(page, "zid")).toBe("results");
  expect(await actOf(page, "manifesto")).toBe("m3");
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).toContain("$20.8M");
  expect(body).toContain("+25%");
  expect(body).toContain("We create work that matters");
  await page.locator('[data-scene="zid"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="zid"]')).toBeInViewport();
  expect(errors).toEqual([]);
});

import { test, expect } from "@playwright/test";

test("reduced motion: static frame, all hero text visible, no r3f canvas, scrollable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v16?frames=procedural");

  await expect(page.locator("[data-v16-root]")).toBeVisible();
  await expect(page.getByText("THE MOTION AGENCY")).toBeVisible();
  await expect(page.getByText("WE RELEASE MOMENTUM.")).toBeVisible();
  await expect(page.locator("[data-v16-archive]")).toBeVisible();

  await expect(page.locator("[data-v16-particles]")).toHaveCount(0);

  await page.locator("[data-v16-featured]").scrollIntoViewIfNeeded();
  await expect(page.getByText("Featured Projects")).toBeVisible();
  expect(errors).toEqual([]);
});

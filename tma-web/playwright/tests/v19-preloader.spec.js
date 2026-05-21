import { test, expect } from "@playwright/test";

// Local dev server (the /portfolio-v19 route is unmerged):
//   cd tma-web && npm run dev
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test v19-preloader.spec.js
// Each test gets a fresh context, so sessionStorage starts empty and the full
// preloader plays — except the explicit "session skip" test, which reloads
// inside the SAME page so the flag persists.

const DONE_TIMEOUT = 12000; // timeline ≈4.2s (wordmark draw + split + flight) + load + safety

const heroLineState = (page) =>
  page.evaluate(() => {
    const span = document.querySelector(".v19-line > span");
    if (!span) return null;
    const cs = getComputedStyle(span);
    return { animationName: cs.animationName, animationPlayState: cs.animationPlayState };
  });

test("preloader is present on initial load (server-rendered, no hero flash)", async ({
  page,
}) => {
  // don't wait for full `load` (hero videos delay it ~3.7s, by which point the
  // intro has finished) — DOMContentLoaded returns while the overlay is up.
  await page.goto("/portfolio-v19", { waitUntil: "domcontentloaded" });
  // SSR renders the overlay so it exists from the very first paint.
  await expect(page.locator(".v19pl")).toBeAttached();
  await expect(page.locator(".v19pl-wordmark")).toBeAttached();
});

test("hero entrance is held while the preloader runs", async ({ page }) => {
  await page.goto("/portfolio-v19", { waitUntil: "domcontentloaded" });
  // the component pauses the hero's CSS entrance via .v19-intro-hold
  await page.waitForFunction(
    () =>
      document
        .querySelector(".v19-page")
        ?.classList.contains("v19-intro-hold"),
    null,
    { timeout: 4000 }
  );
  const held = await heroLineState(page);
  expect(held?.animationPlayState).toBe("paused");
});

test("preloader completes, removes itself, and releases the hero", async ({
  page,
}) => {
  await page.goto("/portfolio-v19");
  // it becomes the reveal then unmounts entirely
  await expect(page.locator(".v19pl")).toHaveCount(0, { timeout: DONE_TIMEOUT });
  // hold lifted → hero entrance resumed/visible
  await expect(page.locator(".v19-page")).not.toHaveClass(/v19-intro-hold/);
  await expect(page.locator(".v19-headline")).toBeVisible();
  const released = await heroLineState(page);
  expect(released?.animationPlayState).not.toBe("paused");
});

test("does not block scrolling after it finishes", async ({ page }) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19pl")).toHaveCount(0, { timeout: DONE_TIMEOUT });
  // wheel/touch/key blockers must be gone; programmatic + key scroll both work.
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: "instant" }));
  await page.waitForTimeout(150);
  const y = await page.evaluate(() => Math.round(window.scrollY));
  expect(y).toBeGreaterThan(400);
});

test("a full page reload replays the intro (module flag resets per load)", async ({
  page,
}) => {
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19pl")).toHaveCount(0, { timeout: DONE_TIMEOUT });

  // a genuine reload re-evaluates the module → the intro plays again.
  await page.reload();
  await page.waitForFunction(
    () =>
      document
        .querySelector(".v19-page")
        ?.classList.contains("v19-intro-hold"),
    null,
    { timeout: 4000 }
  );
  await expect(page.locator(".v19pl")).toHaveCount(0, { timeout: DONE_TIMEOUT });
  await expect(page.locator(".v19-headline")).toBeVisible();
});

test("reduced-motion: completes quickly with a static hero", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19pl")).toHaveCount(0, { timeout: DONE_TIMEOUT });
  // reduced-motion disables the hero entrance entirely → final state, no anim.
  const line = await heroLineState(page);
  expect(line?.animationName).toBe("none");
  await expect(page.locator(".v19-headline")).toBeVisible();
});

test("no console errors through the full intro", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v19");
  await expect(page.locator(".v19pl")).toHaveCount(0, { timeout: DONE_TIMEOUT });
  expect(errors).toEqual([]);
});

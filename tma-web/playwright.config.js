// @ts-check
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://themotionagency.net";
// Override DNS for the live host so we can test before A-record propagation.
// Set PLAYWRIGHT_RESOLVE=178.104.239.192 to enable. Empty = use real DNS.
const RESOLVE_IP = process.env.PLAYWRIGHT_RESOLVE || "";

const launchArgs = RESOLVE_IP
  ? [
      `--host-resolver-rules=MAP themotionagency.net ${RESOLVE_IP},MAP www.themotionagency.net ${RESOLVE_IP}`,
      "--ignore-certificate-errors",
    ]
  : [];

const launchOptions = launchArgs.length ? { args: launchArgs } : {};

const desktop = devices["Desktop Chrome"];

export default defineConfig({
  testDir: "./playwright/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ignoreHTTPSErrors: true,
    launchOptions,
  },

  projects: [
    {
      name: "mobile-375",
      use: { ...desktop, viewport: { width: 375, height: 812 }, isMobile: false, hasTouch: true, launchOptions },
    },
    {
      name: "mobile-414",
      use: { ...desktop, viewport: { width: 414, height: 896 }, isMobile: false, hasTouch: true, launchOptions },
    },
    {
      name: "tablet-768",
      use: { ...desktop, viewport: { width: 768, height: 1024 }, isMobile: false, hasTouch: true, launchOptions },
    },
    {
      name: "tablet-1024",
      use: { ...desktop, viewport: { width: 1024, height: 1366 }, isMobile: false, hasTouch: true, launchOptions },
    },
    {
      name: "laptop-1440",
      use: { ...desktop, viewport: { width: 1440, height: 900 }, launchOptions },
    },
    {
      name: "desktop-1920",
      use: { ...desktop, viewport: { width: 1920, height: 1080 }, launchOptions },
    },
  ],
});

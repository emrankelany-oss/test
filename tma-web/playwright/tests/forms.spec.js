import { test, expect, request as pwRequest } from "@playwright/test";

// Only run forms tests at one breakpoint to avoid spamming the inbox.
// They hit the real Resend API (no mocking) per global rule #1.
test.describe.configure({ mode: "serial" });

const FORMS_BASE = process.env.PLAYWRIGHT_FORMS_BASE || process.env.PLAYWRIGHT_BASE_URL || "https://themotionagency.net";
const FORMS_RESOLVE = process.env.PLAYWRIGHT_RESOLVE || "";

let api;

test.beforeAll(async () => {
  // The request fixture uses the system DNS resolver (not the browser host-resolver-rules).
  // When DNS isn't pointed yet, fall back to https://<IP> with Host header forced via
  // baseURL trick: hit IP directly + override Host via extraHTTPHeaders.
  const useDirectIP = !!FORMS_RESOLVE;
  api = await pwRequest.newContext({
    baseURL: useDirectIP ? `https://${FORMS_RESOLVE}` : FORMS_BASE,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: useDirectIP ? { Host: "themotionagency.net" } : {},
  });
});

test.afterAll(async () => {
  await api?.dispose();
});

test.beforeEach(({}, testInfo) => {
  if (testInfo.project.name !== "laptop-1440") {
    test.skip(true, "forms tests run only on laptop-1440 to avoid duplicate emails");
  }
});

test("contact form submits successfully via /api/contact", async () => {
  const res = await api.post("/api/contact", {
    headers: { "Content-Type": "application/json" },
    data: {
      name: "Playwright Test",
      company: "Playwright CI",
      email: "info@themotionagency.net",
      need: "Brand strategy",
      message: "Automated end-to-end Playwright test of the live contact form. Please ignore.",
      _hp: "",
    },
  });
  expect(res.status(), `unexpected status ${res.status()}: ${await res.text()}`).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.id).toMatch(/^[a-f0-9-]{20,}$/);
});

test("contact form rejects honeypot submissions silently", async () => {
  const res = await api.post("/api/contact", {
    headers: { "Content-Type": "application/json" },
    data: {
      name: "Bot",
      company: "Bot Co",
      email: "info@themotionagency.net",
      need: "x",
      message: "spam",
      _hp: "i am a bot",
    },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.id).toBeUndefined();
});

test("contact form rejects invalid email", async () => {
  const res = await api.post("/api/contact", {
    headers: { "Content-Type": "application/json" },
    data: {
      name: "Test",
      company: "Test",
      email: "not-an-email",
      need: "x",
      message: "msg",
      _hp: "",
    },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.ok).toBe(false);
  expect(body.error).toMatch(/email/i);
});

test("apply form requires CV", async () => {
  const res = await api.post("/api/apply", {
    multipart: {
      name: "Test",
      email: "info@themotionagency.net",
      note: "test",
      roleTitle: "Motion Designer",
      roleLocation: "Amman",
      roleType: "Full-time",
    },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.ok).toBe(false);
  expect(body.error).toMatch(/CV/i);
});

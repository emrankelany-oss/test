import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as data from "../data/portfolio-v12.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

test("opening + manifesto copy present", () => {
  assert.equal(data.opening.line1, "We don't build brands.");
  assert.equal(data.opening.line2, "We launch them.");
  assert.match(data.opening.sub, /Amman and Riyadh/);
  assert.equal(data.philosophy.length, 3);
  assert.match(data.philosophy[0], /Motion creates emotion/i);
});

test("8 real services", () => {
  assert.equal(data.services.length, 8);
  const names = data.services.map((s) => s.name);
  assert.ok(names.includes("Brand Strategy & Positioning"));
  assert.ok(names.includes("Content Studio & Campaign Production"));
  const social = data.services.find((s) => s.name.startsWith("Social Media"));
  assert.ok(social && !/go-to-market blueprints|launch playbooks/i.test(social.desc));
});

test("Foodics deep case exact numbers", () => {
  const f = data.deepCases.find((c) => c.id === "foodics");
  assert.ok(f);
  assert.match(f.intro, /\$2M funding stage/);
  assert.match(f.challenge.join(" "), /just a POS system|POS provider/);
  assert.deepEqual(f.impact.map((i) => i.value), ["$20.8M", "32,000+", "35%", "$1B"]);
});

test("Zid deep case exact numbers", () => {
  const z = data.deepCases.find((c) => c.id === "zid");
  assert.ok(z);
  assert.match(z.intro, /Ripple 2024/);
  assert.deepEqual(z.impact.map((i) => i.value), ["200%", "30%+", "50%", "25%"]);
});

test("4 mid chapters, no invented challenge/impact", () => {
  const ids = data.midCases.map((m) => m.id).sort();
  assert.deepEqual(ids, ["burger-king", "invoiceq", "lsc", "salasa"]);
  for (const m of data.midCases) {
    assert.ok(typeof m.line === "string" && m.line.length > 0);
    assert.ok(!("challenge" in m) && !("impact" in m));
  }
});

test("stats use safe 'years combined experience' phrasing", () => {
  const emp = data.stats.find((s) => /experience/i.test(s.label));
  assert.ok(emp, "must phrase 29+ as years combined experience");
  assert.equal(emp.value, "29+");
  assert.ok(!data.stats.some((s) => /employees/i.test(s.label)));
});

test("contact is the real deck contact", () => {
  assert.equal(data.contact.email, "info@themotionagency.net");
  assert.equal(data.contact.site, "themotionagency.net");
  assert.ok(data.contact.offices.some((o) => o.city === "Amman"));
  assert.ok(data.contact.offices.some((o) => o.city === "Riyadh"));
});

test("no placeholder strings anywhere", () => {
  const blob = JSON.stringify(data);
  for (const bad of ["lorem", "TODO", "TBD", "PLACEHOLDER", "FIXME"]) {
    assert.ok(!new RegExp(bad, "i").test(blob), `found "${bad}"`);
  }
});

test("every referenced asset exists on disk", () => {
  const paths = new Set();
  const walk = (v) => {
    if (typeof v === "string" && v.startsWith("/assets/")) paths.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(data);
  for (const p of paths) {
    assert.ok(existsSync(join(ROOT, p)), `missing asset: ${p}`);
  }
});

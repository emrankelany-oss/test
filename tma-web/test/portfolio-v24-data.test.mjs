import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  AGENCY_STATS,
  statsFor,
  mediaFor,
  worksFor,
} from "../components/portfolio-v24/data.js";
import { PROJECTS_BY_SLUG } from "../components/portfolio-v20/projects.js";

test("CATEGORIES: ordered, non-empty, unique keys", () => {
  assert.ok(CATEGORIES.length >= 4);
  const keys = CATEGORIES.map((c) => c.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const c of CATEGORIES) {
    assert.ok(typeof c.label === "string" && c.label.length > 0);
  }
});

test("every project lands in exactly one category (no drops, no dupes)", () => {
  const all = CATEGORIES.flatMap((c) => worksFor(c).map((w) => w.slug));
  const slugs = Object.keys(PROJECTS_BY_SLUG);
  assert.equal(new Set(all).size, all.length, "no project appears twice");
  for (const s of slugs) assert.ok(all.includes(s), `missing ${s}`);
});

test("AGENCY_STATS holds the four deck numbers", () => {
  const metrics = AGENCY_STATS.map((s) => s.metric);
  assert.deepEqual(metrics, ["178%", "30+", "500+", "29+"]);
});

test("statsFor: Foodics returns real KPIs", () => {
  const s = statsFor(PROJECTS_BY_SLUG["foodics-boundless"]);
  assert.ok(s.length >= 3 && s.length <= 4);
  assert.ok(s.some((x) => /35\.6%/.test(x.metric)));
});

test("statsFor: a non-case-study returns factual meta stats", () => {
  const p = PROJECTS_BY_SLUG["sol-brand"];
  const s = statsFor(p);
  assert.ok(s.length >= 3);
  assert.ok(s.some((x) => x.metric === p.year), "year present");
  assert.ok(s.some((x) => x.metric === p.category), "category present");
  assert.ok(!s.some((x) => /%/.test(x.metric)));
});

test("mediaFor: flagship with a film returns video; still otherwise returns image", () => {
  const v = mediaFor(PROJECTS_BY_SLUG["foodics-boundless"]);
  assert.equal(v.type, "video");
  assert.ok(v.src && v.poster);
  const i = mediaFor(PROJECTS_BY_SLUG["sol-brand"]);
  assert.equal(i.type, "image");
  assert.ok(i.src);
});

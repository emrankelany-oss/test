import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  AGENCY_STATS,
  statsFor,
  mediaFor,
  worksFor,
  FEATURED,
  GALAXY_STOPS,
  hasVideo,
  FEATURED_SLUGS,
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

test("taxonomy excludes featured; 27 others land in exactly one category", () => {
  const all = CATEGORIES.flatMap((c) => worksFor(c).map((w) => w.slug));
  assert.equal(new Set(all).size, all.length, "no dupes");
  for (const s of FEATURED_SLUGS) assert.ok(!all.includes(s), `${s} excluded from categories`);
  const expected = Object.keys(PROJECTS_BY_SLUG).filter((s) => !FEATURED_SLUGS.includes(s));
  for (const s of expected) assert.ok(all.includes(s), `missing ${s}`);
  assert.equal(all.length, expected.length);
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

test("statsFor: every non-case-study returns a UNIFORM pair (Discipline + Services)", () => {
  const FEATURED_SLUGS = new Set(["foodics-boundless", "zid-ripple"]);
  for (const p of Object.values(PROJECTS_BY_SLUG)) {
    if (FEATURED_SLUGS.has(p.slug) || (Array.isArray(p.results) && p.results.length)) continue;
    const s = statsFor(p);
    assert.equal(s.length, 2, `${p.slug} should have exactly 2 stats`);
    assert.deepEqual(s.map((x) => x.label), ["Discipline", "Services"], `${p.slug} labels`);
    assert.ok(!s.some((x) => /%/.test(x.metric)));
  }
});

test("statsFor: missing-year project never emits an undefined metric", () => {
  for (const p of Object.values(PROJECTS_BY_SLUG)) {
    const s = statsFor(p);
    assert.ok(s.every((x) => x.metric !== undefined && x.metric !== null && x.metric !== ""),
      `undefined/empty metric for ${p.slug}`);
  }
});

test("FEATURED: foodics has 7 films, zid 2; each media has poster + src|youtubeId", () => {
  assert.equal(FEATURED.length, 2);
  const f = FEATURED.find((x) => x.slug === "foodics-boundless");
  const z = FEATURED.find((x) => x.slug === "zid-ripple");
  assert.equal(f.media.length, 7);
  assert.equal(z.media.length, 2);
  for (const m of [...f.media, ...z.media]) {
    assert.ok(m.poster, "poster present");
    assert.ok(m.src || m.youtubeId, "src or youtubeId present");
  }
  assert.ok(f.results.some((r) => /35\.6%/.test(r.metric)), "foodics real KPI present");
});

test("FEATURED entries carry a solution array", () => {
  for (const f of FEATURED) assert.ok(Array.isArray(f.solution));
  const foodics = FEATURED.find((x) => x.slug === "foodics-boundless");
  assert.ok(foodics.solution.length >= 1);
});

test("GALAXY_STOPS: >=10 hex colors", () => {
  assert.ok(GALAXY_STOPS.length >= 10);
  for (const c of GALAXY_STOPS) assert.match(c, /^#[0-9A-Fa-f]{6}$/);
});

test("mediaFor: video project returns video; image-only returns image", () => {
  const v = mediaFor(PROJECTS_BY_SLUG["rubicon-exotic"]);
  assert.equal(v.type, "video"); assert.ok(/media16/.test(v.src));
  assert.ok(hasVideo(PROJECTS_BY_SLUG["rubicon-exotic"]));
  const i = mediaFor(PROJECTS_BY_SLUG["sol-brand"]);
  assert.equal(i.type, "image"); assert.ok(i.src);
  assert.ok(!hasVideo(PROJECTS_BY_SLUG["sol-brand"]));
});

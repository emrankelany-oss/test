import { test } from "node:test";
import assert from "node:assert/strict";
import { foodics } from "../components/portfolio-v14/chapters/foodics.js";
import { zid } from "../components/portfolio-v14/chapters/zid.js";
import { formatMetric } from "../components/portfolio-v14/engine/chapterActs.js";

function check(ch, id, order) {
  assert.equal(ch.id, id);
  assert.equal(ch.order, order);
  assert.equal(ch.acts.length, 4);
  assert.deepEqual(ch.acts.map((a) => a.id), ch.plan.acts.map((a) => a.id));
  assert.deepEqual(ch.acts.map((a) => a.kind), ["hook", "problem", "solution", "results"]);
  assert.ok(typeof ch.bleed === "string" && typeof ch.accent === "string");
  assert.ok(ch.image.startsWith("/assets/"));
}

test("foodics shape + verbatim final metric strings", () => {
  check(foodics, "foodics", 40);
  const r = foodics.acts[3].metrics;
  assert.equal(formatMetric(r[0].to, r[0].format), "$20.8M");
  assert.equal(formatMetric(r[1].to, r[1].format), "32,000+");
  assert.equal(formatMetric(r[2].to, r[2].format), "$1B");
  assert.equal(foodics.acts[0].headline, "Boundless: Launching What's Next for F&B");
  assert.equal(foodics.acts[1].body.length, 4);
  assert.equal(foodics.acts[2].body.length, 4);
});

test("zid shape + verbatim final metric strings", () => {
  check(zid, "zid", 50);
  const r = zid.acts[3].metrics;
  assert.equal(formatMetric(r[0].to, r[0].format), "200%");
  assert.equal(formatMetric(r[1].to, r[1].format), "12,000+");
  assert.equal(formatMetric(r[2].to, r[2].format), "+50%");
  assert.equal(formatMetric(r[3].to, r[3].format), "+25%");
  assert.equal(zid.acts[0].headline, "Ripple: Launching the Total Commerce Era");
  assert.equal(zid.acts[1].body.length, 3);
  assert.equal(zid.acts[2].body.length, 4);
});

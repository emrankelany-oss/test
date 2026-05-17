import { test } from "node:test";
import assert from "node:assert/strict";
import { actState, metricValue, formatMetric } from "../components/portfolio-v14/engine/chapterActs.js";

const plan = {
  acts: [{ id: "hook", weight: 0.2 }, { id: "problem", weight: 0.3 }, { id: "results", weight: 0.5 }],
  inFrac: 0.2,
  outFrac: 0.2,
};

test("maps progress to the weight-sized act band", () => {
  assert.equal(actState(0.05, plan).id, "hook");
  assert.equal(actState(0.30, plan).id, "problem");
  assert.equal(actState(0.90, plan).id, "results");
});

test("local is 0..1 within the act band", () => {
  const s = actState(0.35, plan);
  assert.equal(s.id, "problem");
  assert.ok(Math.abs(s.local - 0.5) < 1e-9, `local ${s.local}`);
});

test("in/hold/out phase + opacity envelope; cross-fade at boundary", () => {
  const hook = actState(0.10, plan);
  assert.equal(hook.phase, "hold");
  assert.equal(hook.opacity, 1);
  const entering = actState(0.01, plan);
  assert.equal(entering.phase, "in");
  assert.ok(entering.opacity > 0 && entering.opacity < 1);
  const leaving = actState(0.19, plan);
  assert.equal(leaving.phase, "out");
  assert.ok(leaving.opacity < 1);
});

test("final act never out-fades — holds opacity 1 (reduced-motion contract)", () => {
  const end = actState(1, plan);
  assert.equal(end.id, "results");
  assert.equal(end.opacity, 1);
  assert.notEqual(end.phase, "out");
  const nearEnd = actState(0.999, plan);
  assert.equal(nearEnd.id, "results");
  assert.equal(nearEnd.opacity, 1);
});

test("first act fades in from 0 at progress 0", () => {
  const s = actState(0, plan);
  assert.equal(s.id, "hook");
  assert.equal(s.opacity, 0);
  assert.equal(s.phase, "in");
});

test("progress clamped; empty/missing acts safe; single act; equal weights", () => {
  assert.equal(actState(-1, plan).id, "hook");
  assert.equal(actState(9, plan).id, "results");
  assert.deepEqual(actState(0.5, { acts: [] }), { index: 0, id: null, local: 0, phase: "hold", opacity: 1 });
  assert.deepEqual(actState(0.5, {}), { index: 0, id: null, local: 0, phase: "hold", opacity: 1 });
  assert.equal(actState(0.9, { acts: [{ id: "only", weight: 1 }] }).id, "only");
  const eq = { acts: [{ id: "a", weight: 0 }, { id: "b", weight: 0 }] };
  assert.equal(actState(0.25, eq).id, "a");
  assert.equal(actState(0.75, eq).id, "b");
});

test("metricValue: endpoints, eased middle, clamp, descending", () => {
  assert.equal(metricValue(0, 8000, 32000), 8000);
  assert.equal(metricValue(1, 8000, 32000), 32000);
  assert.equal(metricValue(-5, 8000, 32000), 8000);
  assert.equal(metricValue(2, 8000, 32000), 32000);
  const mid = metricValue(0.5, 0, 100);
  assert.ok(mid > 0 && mid < 100);
  assert.equal(metricValue(1, 20.8, 15.4), 15.4);
});

test("formatMetric locks the exact final deck strings", () => {
  assert.equal(formatMetric(20.8, "$%sM"), "$20.8M");
  assert.equal(formatMetric(32000, "%s+"), "32,000+");
  assert.equal(formatMetric(1, "$%sB"), "$1B");
  assert.equal(formatMetric(200, "%s%"), "200%");
  assert.equal(formatMetric(12000, "%s+"), "12,000+");
  assert.equal(formatMetric(50, "+%s%"), "+50%");
  assert.equal(formatMetric(25, "+%s%"), "+25%");
  assert.equal(formatMetric(18.27, "$%sM"), "$18.3M");
  assert.equal(formatMetric(20000.4, "%s+"), "20,000+");
});

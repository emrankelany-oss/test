import { test } from "node:test";
import assert from "node:assert/strict";
import { boundaryState } from "../components/portfolio-v14/engine/boundaryState.js";

test("scene inside its seam yields a from/to/t toward the next scene", () => {
  const b = boundaryState([{ id: "a", progress: 0.9 }, { id: "b", progress: 0 }], 0.18);
  assert.equal(b.fromId, "a");
  assert.equal(b.toId, "b");
  assert.ok(Math.abs(b.t - 0.4444444) < 1e-4, `t was ${b.t}`);
});

test("progress exactly at the seam start → t=0; at 1 → t=1", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.82 }, { id: "b", progress: 0 }], 0.18).t, 0);
  assert.equal(boundaryState([{ id: "a", progress: 1 }, { id: "b", progress: 0 }], 0.18).t, 1);
});

test("t is clamped to [0,1] for out-of-range progress", () => {
  assert.equal(boundaryState([{ id: "a", progress: 1.5 }, { id: "b", progress: 0 }], 0.18).t, 1);
});

test("before any seam → null", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.5 }, { id: "b", progress: 0 }], 0.18), null);
});

test("only the LAST scene in its seam → null (no successor)", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.1 }, { id: "b", progress: 0.95 }], 0.18), null);
});

test("fewer than two scenes, empty, or non-positive seam → null", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.95 }], 0.18), null);
  assert.equal(boundaryState([], 0.18), null);
  assert.equal(boundaryState(null, 0.18), null);
  assert.equal(boundaryState([{ id: "a", progress: 0.95 }, { id: "b", progress: 0 }], 0), null);
});

test("first in-seam scene wins when several qualify", () => {
  const b = boundaryState(
    [{ id: "a", progress: 0.99 }, { id: "b", progress: 0.99 }, { id: "c", progress: 0 }],
    0.18
  );
  assert.equal(b.fromId, "a");
  assert.equal(b.toId, "b");
});

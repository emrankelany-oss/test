import { test } from "node:test";
import assert from "node:assert/strict";
import { boundaryState } from "../components/portfolio-v14/engine/boundaryState.js";

test("scene inside its seam yields a from/to/t toward the next scene", () => {
  const b = boundaryState([{ id: "a", progress: 0.9 }, { id: "b", progress: 0 }], 0.18);
  assert.equal(b.fromId, "a");
  assert.equal(b.toId, "b");
  assert.ok(Math.abs(b.t - 0.4444444) < 1e-4, `t was ${b.t}`);
});

test("progress exactly at the float-unsafe seam start → t=0", () => {
  assert.equal(boundaryState([{ id: "a", progress: 0.82 }, { id: "b", progress: 0 }], 0.18).t, 0);
});

test("a completed from-scene (progress 1) in a 2-scene array → null (pair done, no later seam)", () => {
  assert.equal(boundaryState([{ id: "a", progress: 1 }, { id: "b", progress: 0 }], 0.18), null);
  assert.equal(boundaryState([{ id: "a", progress: 1.5 }, { id: "b", progress: 0 }], 0.18), null);
});

test("a completed earlier scene does NOT mask a later in-seam scene", () => {
  const b = boundaryState(
    [{ id: "a", progress: 1 }, { id: "b", progress: 0.9 }, { id: "c", progress: 0 }],
    0.18
  );
  assert.equal(b.fromId, "b");
  assert.equal(b.toId, "c");
  assert.ok(Math.abs(b.t - 0.4444444) < 1e-4, `t was ${b.t}`);
});

test("completed earlier scene + next scene not yet in its seam → null", () => {
  assert.equal(
    boundaryState([{ id: "a", progress: 1 }, { id: "b", progress: 0.5 }, { id: "c", progress: 0 }], 0.18),
    null
  );
});

test("all scenes complete → null", () => {
  assert.equal(
    boundaryState([{ id: "a", progress: 1 }, { id: "b", progress: 1 }, { id: "c", progress: 0 }], 0.18),
    null
  );
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

test("first NON-COMPLETE in-seam scene wins when several qualify", () => {
  const b = boundaryState(
    [{ id: "a", progress: 0.99 }, { id: "b", progress: 0.99 }, { id: "c", progress: 0 }],
    0.18
  );
  assert.equal(b.fromId, "a");
  assert.equal(b.toId, "b");
});

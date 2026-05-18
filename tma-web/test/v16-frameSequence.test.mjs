import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  lerp,
  progressToIndex,
  indexToUrl,
  coverFit,
  TOTAL_FRAMES,
  PAD,
} from "../components/portfolio-v16/engine/frameSequence.js";

test("clamp bounds a value", () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(0.5, 0, 1), 0.5);
  assert.equal(clamp(NaN, 0, 1), 0);
});

test("lerp interpolates", () => {
  assert.equal(lerp(0, 10, 0), 0);
  assert.equal(lerp(0, 10, 1), 10);
  assert.equal(lerp(0, 10, 0.5), 5);
});

test("progressToIndex maps clamped progress to a rounded index", () => {
  assert.equal(progressToIndex(0, 192), 0);
  assert.equal(progressToIndex(1, 192), 191);
  assert.equal(progressToIndex(0.5, 101), 50);
  assert.equal(progressToIndex(-2, 192), 0);
  assert.equal(progressToIndex(9, 192), 191);
  assert.equal(progressToIndex(0.5, 0), 0);
});

test("indexToUrl zero-pads and uses the configured path/ext", () => {
  assert.equal(indexToUrl(0), "/assets/v16/frames/frame-001.webp");
  assert.equal(indexToUrl(191), "/assets/v16/frames/frame-192.webp");
  assert.equal(PAD, 3);
  assert.equal(TOTAL_FRAMES, 192);
  assert.equal(indexToUrl(4, { path: "/f/", ext: "jpg", pad: 4 }), "/f/0005.jpg");
});

test("coverFit centers and scales to cover the destination", () => {
  const r = coverFit(100, 100, 200, 100);
  assert.equal(r.dw, 200);
  assert.equal(r.dh, 200);
  assert.equal(r.dx, 0);
  assert.equal(r.dy, -50);
  const z = coverFit(0, 0, 200, 100);
  assert.deepEqual(z, { dx: 0, dy: 0, dw: 200, dh: 100 });
  const z2 = coverFit(100, 100, 0, 0);
  assert.deepEqual(z2, { dx: 0, dy: 0, dw: 0, dh: 0 });
});

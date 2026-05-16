import { test } from "node:test";
import assert from "node:assert/strict";
import { frameIndexFor, preloadWindow, coverFit } from "../components/portfolio-v14/engine/frameMath.js";

test("frameIndexFor maps progress to clamped rounded index", () => {
  assert.equal(frameIndexFor(0, 100), 0);
  assert.equal(frameIndexFor(1, 100), 99);
  assert.equal(frameIndexFor(0.5, 101), 50);
  assert.equal(frameIndexFor(-2, 100), 0);
  assert.equal(frameIndexFor(9, 100), 99);
  assert.equal(frameIndexFor(0.5, 0), 0);
});

test("preloadWindow returns ahead/behind band clamped to bounds", () => {
  assert.deepEqual(preloadWindow(0, 100, 3, 2), [0, 1, 2, 3]);
  assert.deepEqual(preloadWindow(50, 100, 2, 2), [48, 49, 50, 51, 52]);
  assert.deepEqual(preloadWindow(99, 100, 3, 2), [97, 98, 99]);
  assert.deepEqual(preloadWindow(0, 0, 5, 5), []);
});

test("coverFit centers and scales to cover the destination", () => {
  const r = coverFit(100, 100, 200, 100);
  assert.equal(r.dw, 200);
  assert.equal(r.dh, 200);
  assert.equal(r.dx, 0);
  assert.equal(r.dy, -50);
  const z = coverFit(0, 0, 200, 100);
  assert.deepEqual(z, { dx: 0, dy: 0, dw: 200, dh: 100 });
});

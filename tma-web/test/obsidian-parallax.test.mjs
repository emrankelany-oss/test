import { test } from "node:test";
import assert from "node:assert/strict";
import { parallaxOffset, clamp01, transform3d } from "../components/obsidian-hero/relief/parallax.js";

test("clamp01 clamps to [0,1]", () => {
  assert.equal(clamp01(-0.3), 0);
  assert.equal(clamp01(0.42), 0.42);
  assert.equal(clamp01(1.7), 1);
});

test("zero at progress 0.5 (centered)", () => {
  assert.equal(parallaxOffset({ progress: 0.5, factor: 0.1, vh: 678, sign: 1 }), 0);
});

test("matches OA verified number: factor 0.1, vh 678 saturates at 33.9px", () => {
  assert.equal(
    Math.round(parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1 }) * 10) / 10,
    33.9
  );
  assert.equal(
    Math.round(parallaxOffset({ progress: 0, factor: 0.1, vh: 678, sign: 1 }) * 10) / 10,
    -33.9
  );
});

test("progress is clamped (no overshoot past 1)", () => {
  const at1 = parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1 });
  const past = parallaxOffset({ progress: 3.2, factor: 0.1, vh: 678, sign: 1 });
  assert.equal(at1, past);
});

test("sign flips direction", () => {
  const pos = parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1 });
  const neg = parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: -1 });
  assert.equal(pos, -neg);
});

test("disabled (returns 0) when viewport width <= 1024", () => {
  assert.equal(
    parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1, viewportWidth: 1024 }),
    0
  );
  assert.notEqual(
    parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1, viewportWidth: 1280 }),
    0
  );
});

test("transform3d builds the translate3d string", () => {
  assert.equal(transform3d(33.9), "translate3d(0, 33.9px, 0)");
  assert.equal(transform3d(0), "translate3d(0, 0px, 0)");
  assert.equal(transform3d(-12.5), "translate3d(0, -12.5px, 0)");
});

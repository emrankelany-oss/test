import { test } from "node:test";
import assert from "node:assert/strict";
import { blurAmount, zoomScale, colorBleedAlpha, crossfadeOpacity } from "../components/portfolio-v14/engine/transitions.js";

test("blur peaks at the boundary midpoint, sharp at both ends", () => {
  assert.equal(blurAmount(0, 16), 0);
  assert.equal(blurAmount(1, 16), 0);
  assert.equal(blurAmount(0.5, 16), 16);
});

test("zoom is 1 at the ends and > 1 mid", () => {
  assert.equal(zoomScale(0, 0.08), 1);
  assert.equal(zoomScale(1, 0.08), 1);
  assert.ok(zoomScale(0.5, 0.08) > 1);
});

test("color-bleed alpha peaks mid and clamps to maxAlpha", () => {
  assert.equal(colorBleedAlpha(0, 0.5), 0);
  assert.equal(colorBleedAlpha(0.5, 0.5), 0.5);
});

test("crossfade hands opacity from A to B", () => {
  assert.deepEqual(crossfadeOpacity(0), { a: 1, b: 0 });
  assert.deepEqual(crossfadeOpacity(1), { a: 0, b: 1 });
  const mid = crossfadeOpacity(0.5);
  assert.ok(mid.a > 0 && mid.b > 0);
});

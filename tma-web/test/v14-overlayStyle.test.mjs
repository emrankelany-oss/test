import { test } from "node:test";
import assert from "node:assert/strict";
import { overlayStyle } from "../components/portfolio-v14/engine/overlayStyle.js";

test("endpoints are fully inert", () => {
  for (const t of [0, 1, -0.2, 1.4]) {
    const s = overlayStyle(t, 0, "#08070b", "#0b0708");
    assert.deepEqual(s, { blurPx: 0, scale: 1, bleedColor: "#000000", bleedAlpha: 0, opacity: 0 });
  }
});

test("midpoint peaks (zero velocity)", () => {
  const s = overlayStyle(0.5, 0, "#000000", "#ffffff");
  assert.equal(s.blurPx, 16);
  assert.ok(s.scale > 1);
  assert.equal(s.opacity, 1);
  assert.ok(s.bleedAlpha > 0);
  assert.equal(s.bleedColor, "#808080");
});

test("velocity raises blur and is clamped at 1+VEL_GAIN (1.6x)", () => {
  const slow = overlayStyle(0.5, 0, "#000", "#fff").blurPx;
  const fast = overlayStyle(0.5, 6000, "#000", "#fff").blurPx;
  const huge = overlayStyle(0.5, 999999, "#000", "#fff").blurPx;
  assert.ok(fast > slow, `fast ${fast} > slow ${slow}`);
  assert.ok(Math.abs(huge - 16 * 1.6) < 1e-3, `huge ${huge} ≈ 25.6`);
});

test("color bleed interpolates from→to and tolerates 3-digit hex", () => {
  assert.equal(overlayStyle(0.25, 0, "#000", "#ffffff").bleedColor, "#404040");
  assert.equal(overlayStyle(0.5, 0, "#000", "#fff").bleedColor, "#808080");
});

test("unparseable colors fall back to #000 channels", () => {
  const s = overlayStyle(0.5, 0, "garbage", "#fff");
  assert.equal(s.bleedColor, "#808080");
});

test("all numeric outputs are finite and non-negative", () => {
  const s = overlayStyle(0.37, 4200, "#08070b", "#0b0708");
  for (const k of ["blurPx", "scale", "bleedAlpha", "opacity"]) {
    assert.ok(Number.isFinite(s[k]) && s[k] >= 0, `${k}=${s[k]}`);
  }
});

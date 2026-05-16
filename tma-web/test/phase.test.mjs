import { test } from "node:test";
import assert from "node:assert/strict";
import { phaseFor, PHASES } from "../components/portfolio-v12/phase.js";

test("phase boundaries", () => {
  assert.equal(phaseFor(0), "ignition");
  assert.equal(phaseFor(0.1), "ignition");
  assert.equal(phaseFor(0.15), "liftoff");
  assert.equal(phaseFor(0.3), "liftoff");
  assert.equal(phaseFor(0.35), "ascent");
  assert.equal(phaseFor(0.69), "ascent");
  assert.equal(phaseFor(0.7), "orbit");
  assert.equal(phaseFor(0.87), "orbit");
  assert.equal(phaseFor(0.88), "climax");
  assert.equal(phaseFor(1), "climax");
});

test("clamps out-of-range input", () => {
  assert.equal(phaseFor(-5), "ignition");
  assert.equal(phaseFor(99), "climax");
});

test("PHASES ordered list exported", () => {
  assert.deepEqual(PHASES, ["ignition", "liftoff", "ascent", "orbit", "climax"]);
});

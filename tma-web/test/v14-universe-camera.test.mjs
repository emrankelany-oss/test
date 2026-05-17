import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraForFrame } from "../../remotion/src/universe/cameraArc.js";

const DUR = 180;

test("starts in the void near z~8, drifting slowly (frames 0..40)", () => {
  const c0 = cameraForFrame(0, DUR);
  const c40 = cameraForFrame(40, DUR);
  assert.ok(c0.position[2] > 5, "starts pulled back");
  assert.ok(c0.position[2] - c40.position[2] < 6, "slow drift in void");
});

test("pushes forward monotonically (z strictly decreases 0->160)", () => {
  let prev = Infinity;
  for (let f = 0; f <= 160; f += 8) {
    const z = cameraForFrame(f, DUR).position[2];
    assert.ok(z <= prev + 1e-6, `z non-increasing at ${f} (${z} <= ${prev})`);
    prev = z;
  }
});

test("settles: frames 160..179 are static (no movement)", () => {
  const a = cameraForFrame(160, DUR);
  const b = cameraForFrame(170, DUR);
  const c = cameraForFrame(179, DUR);
  assert.deepEqual(a, b);
  assert.deepEqual(b, c);
});

test("final frame looks at the foodics hero focal point (z ~ -60)", () => {
  const end = cameraForFrame(179, DUR);
  assert.ok(end.lookAt[2] < -40, "looking deep down-corridor");
  assert.ok(end.position[2] < -45, "camera arrived near the hero");
  assert.ok(Math.abs(end.lookAt[0]) < 2 && Math.abs(end.lookAt[1]) < 2,
    "looking at centerline");
});

test("clamps out-of-range frames", () => {
  assert.deepEqual(cameraForFrame(-5, DUR), cameraForFrame(0, DUR));
  assert.deepEqual(cameraForFrame(999, DUR), cameraForFrame(179, DUR));
});

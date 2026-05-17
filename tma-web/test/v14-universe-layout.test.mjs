import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPanelField } from "../../remotion/src/universe/panelLayout.js";
import { ASSET_MANIFEST } from "../../remotion/src/universe/assetManifest.js";

test("produces one panel per manifest entry, deterministically", () => {
  const a = buildPanelField(ASSET_MANIFEST);
  const b = buildPanelField(ASSET_MANIFEST);
  assert.equal(a.length, ASSET_MANIFEST.length);
  assert.deepEqual(a, b); // deterministic — no Math.random at render time
});

test("hero panels are larger and on/near the camera path centerline", () => {
  const field = buildPanelField(ASSET_MANIFEST);
  const heroes = field.filter((p) => p.kind === "hero");
  const logos = field.filter((p) => p.kind === "logo");
  assert.equal(heroes.length, 2);
  for (const h of heroes) {
    assert.ok(h.scale >= 3, "hero scale >= 3");
    assert.ok(Math.abs(h.position[0]) <= 1.5 && Math.abs(h.position[1]) <= 1.5,
      "hero near centerline");
  }
  for (const l of logos) assert.ok(l.scale <= 2, "logo scale <= 2");
});

test("foodics hero is the deepest panel (final settle target, most negative Z)", () => {
  const field = buildPanelField(ASSET_MANIFEST);
  const foodics = field.find((p) => p.id === "foodics-hero");
  const minZ = Math.min(...field.map((p) => p.position[2]));
  assert.equal(foodics.position[2], minZ);
});

test("panels span a deep Z corridor and varied X/Y", () => {
  const field = buildPanelField(ASSET_MANIFEST);
  const zs = field.map((p) => p.position[2]);
  assert.ok(Math.max(...zs) - Math.min(...zs) >= 60, "deep corridor");
  const xs = field.map((p) => p.position[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 8, "spread in X");
});

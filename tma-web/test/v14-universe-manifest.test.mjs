import { test } from "node:test";
import assert from "node:assert/strict";
import { ASSET_MANIFEST } from "../../remotion/src/universe/assetManifest.js";

test("manifest has 2 heroes then 24 logos = 26 entries", () => {
  assert.equal(ASSET_MANIFEST.length, 26);
  const heroes = ASSET_MANIFEST.filter((a) => a.kind === "hero");
  const logos = ASSET_MANIFEST.filter((a) => a.kind === "logo");
  assert.equal(heroes.length, 2);
  assert.equal(logos.length, 24);
});

test("foodics is the first hero (final-settle target)", () => {
  assert.equal(ASSET_MANIFEST[0].kind, "hero");
  assert.equal(ASSET_MANIFEST[0].id, "foodics-hero");
  assert.equal(ASSET_MANIFEST[0].file, "universe/foodics-hero.webp");
});

test("every entry has unique id and a universe/ file path", () => {
  const ids = new Set(ASSET_MANIFEST.map((a) => a.id));
  assert.equal(ids.size, 26);
  for (const a of ASSET_MANIFEST) {
    assert.match(a.file, /^universe\/[a-z0-9-]+\.webp$/);
  }
});

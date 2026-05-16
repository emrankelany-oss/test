import { test } from "node:test";
import assert from "node:assert/strict";
import { createSceneRegistry } from "../components/portfolio-v14/engine/sceneRegistry.js";

test("keeps scenes sorted by order and exposes adjacent pairs", () => {
  const r = createSceneRegistry();
  r.register({ id: "film", order: 20 });
  r.register({ id: "a", order: 10 });
  r.register({ id: "b", order: 30 });
  assert.deepEqual(r.list().map((s) => s.id), ["a", "film", "b"]);
  assert.deepEqual(r.adjacentPairs().map((p) => [p[0].id, p[1].id]), [["a", "film"], ["film", "b"]]);
});

test("unregister removes the scene", () => {
  const r = createSceneRegistry();
  const off = r.register({ id: "a", order: 1 });
  r.register({ id: "b", order: 2 });
  off();
  assert.deepEqual(r.list().map((s) => s.id), ["b"]);
});

test("duplicate id throws", () => {
  const r = createSceneRegistry();
  r.register({ id: "a", order: 1 });
  assert.throws(() => r.register({ id: "a", order: 2 }), /already registered/);
});

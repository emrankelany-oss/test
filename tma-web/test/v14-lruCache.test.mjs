import { test } from "node:test";
import assert from "node:assert/strict";
import { createLruCache } from "../components/portfolio-v14/engine/lruCache.js";

test("evicts least-recently-used and reports evictions", () => {
  const evicted = [];
  const c = createLruCache(2, (k) => evicted.push(k));
  c.set("a", 1);
  c.set("b", 2);
  c.get("a");            // a now most-recent
  c.set("c", 3);         // evicts b
  assert.equal(c.has("b"), false);
  assert.equal(c.has("a"), true);
  assert.deepEqual(evicted, ["b"]);
  assert.equal(c.size, 2);
});

test("re-setting an existing key refreshes recency, not size", () => {
  const c = createLruCache(2);
  c.set("a", 1);
  c.set("b", 2);
  c.set("a", 11);
  c.set("c", 3);          // evicts b (a was refreshed)
  assert.equal(c.get("a"), 11);
  assert.equal(c.has("b"), false);
});

test("clear() calls onEvict for every entry", () => {
  const evicted = [];
  const c = createLruCache(5, (k) => evicted.push(k));
  c.set("x", 1);
  c.set("y", 2);
  c.clear();
  assert.deepEqual(evicted.sort(), ["x", "y"]);
  assert.equal(c.size, 0);
});

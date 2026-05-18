import { test } from "node:test";
import assert from "node:assert/strict";
import { createFramePreloader } from "../components/portfolio-v16/engine/framePreloader.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

test("priority frames resolve the gate, then background frames load", async () => {
  const loaded = [];
  const pre = createFramePreloader({
    total: 10,
    priority: 4,
    concurrency: 2,
    load: async (i) => {
      loaded.push(i);
      return { id: i, width: 1280, height: 720 };
    },
  });
  pre.start();
  await pre.whenPriorityReady();
  for (let i = 0; i < 4; i++) assert.equal(pre.has(i), true, `priority ${i} ready`);
  // drain background
  for (let k = 0; k < 20 && pre.stats().loaded < 10; k++) await tick();
  assert.equal(pre.stats().loaded, 10);
  assert.deepEqual(pre.getBitmap(7), { id: 7, width: 1280, height: 720 });
});

test("a failing frame is skipped, warns once, others still load", async () => {
  const origWarn = console.warn;
  let warnCount = 0;
  console.warn = () => {
    warnCount++;
  };
  try {
    const pre = createFramePreloader({
      total: 5,
      priority: 5,
      concurrency: 2,
      load: async (i) => {
        if (i === 2) throw new Error("boom");
        return { id: i, width: 10, height: 10 };
      },
    });
    pre.start();
    await pre.whenPriorityReady();
    for (let k = 0; k < 20 && pre.stats().loaded < 4; k++) await tick();
    assert.equal(pre.has(2), false);
    assert.equal(pre.has(3), true);
    assert.equal(pre.stats().failed, 1);
    assert.equal(pre.stats().loaded, 4);
    assert.equal(warnCount, 1);
  } finally {
    console.warn = origWarn;
  }
});

test("destroy() mid-flight closes any raced bitmap and stops writing into a cleared map", async () => {
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  let closed = 0;
  const pre = createFramePreloader({
    total: 4,
    priority: 2,
    concurrency: 2,
    load: async (i) => {
      if (i >= 2) await gate; // background frames hang until released
      return { id: i, width: 1, height: 1, close: () => { closed++; } };
    },
  });
  pre.start();
  await pre.whenPriorityReady();
  assert.equal(pre.stats().loaded, 2); // priority block in
  pre.destroy(); // clears map; background frames still hanging
  release(); // background frames resolve AFTER destroy
  for (let k = 0; k < 20; k++) await tick();
  assert.equal(pre.has(0), false); // map stayed cleared
  assert.equal(pre.stats().loaded, 0);
  assert.equal(closed >= 1, true); // raced background bitmap(s) were closed
});

import {
  TOTAL_FRAMES,
  PRELOAD_PRIORITY,
  PRELOAD_CONCURRENCY,
  indexToUrl,
} from "./frameSequence.js";

// Default browser loader: fetch → decode to ImageBitmap.
async function defaultLoad(index) {
  const res = await fetch(indexToUrl(index));
  if (!res.ok) throw new Error(`HTTP ${res.status} for frame ${index}`);
  return createImageBitmap(await res.blob());
}

/**
 * Tiered frame preloader.
 *   - priority block (0..priority-1) loads first; whenPriorityReady() resolves
 *     once that block has settled (loaded or failed).
 *   - remaining frames load in the background, concurrency-capped.
 *   - a frame that throws is skipped (held, warned once), never aborts the run.
 *
 * `load` is injectable for tests; defaults to fetch+createImageBitmap.
 */
export function createFramePreloader(opts = {}) {
  const {
    total = TOTAL_FRAMES,
    priority = PRELOAD_PRIORITY,
    concurrency = PRELOAD_CONCURRENCY,
    load = defaultLoad,
  } = opts;

  const bitmaps = new Map();
  const failed = new Set();
  let warned = false;
  let resolvePriority;
  const priorityReady = new Promise((r) => {
    resolvePriority = r;
  });

  async function loadOne(i) {
    if (bitmaps.has(i) || failed.has(i)) return;
    try {
      bitmaps.set(i, await load(i));
    } catch (err) {
      failed.add(i);
      if (!warned) {
        console.warn("[v16] frame load failed; skipping", err);
        warned = true;
      }
    }
  }

  async function runQueue(indices) {
    let cursor = 0;
    const lanes = Math.max(1, Math.min(concurrency, indices.length || 1));
    await Promise.all(
      Array.from({ length: lanes }, async () => {
        while (cursor < indices.length) {
          await loadOne(indices[cursor++]);
        }
      })
    );
  }

  async function start() {
    const pri = Math.min(priority, total);
    await runQueue(Array.from({ length: pri }, (_, i) => i));
    resolvePriority();
    const rest = [];
    for (let i = pri; i < total; i++) rest.push(i);
    runQueue(rest); // background — intentionally not awaited
  }

  return {
    start,
    whenPriorityReady: () => priorityReady,
    getBitmap: (i) => bitmaps.get(i),
    has: (i) => bitmaps.has(i),
    stats: () => ({ loaded: bitmaps.size, failed: failed.size, total }),
    destroy() {
      for (const b of bitmaps.values()) {
        if (b && typeof b.close === "function") b.close();
      }
      bitmaps.clear();
      failed.clear();
    },
  };
}

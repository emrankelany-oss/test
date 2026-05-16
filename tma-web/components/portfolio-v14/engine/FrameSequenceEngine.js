import { frameIndexFor, preloadWindow } from "./frameMath.js";
import { createLruCache } from "./lruCache.js";

const CACHE_CAP = 60;
const AHEAD = 20;
const BEHIND = 5;

/**
 * source: { count, drawProcedural(i) -> canvas }  OR  { count, getUrl(i) -> string }
 * renderer: a FrameRenderer instance (already mounted + resized by the caller)
 */
export function createFrameSequenceEngine(source, renderer) {
  const cache = createLruCache(CACHE_CAP, (_k, v) => {
    if (v && typeof v.close === "function") v.close(); // ImageBitmap
  });
  const inflight = new Set();
  let targetProgress = 0;
  let lastDrawnIndex = -1;
  let lastGood = null;
  let rafId = 0;
  let running = false;
  let loggedError = false;
  const debug = { drawCount: 0, frameIndex: 0, count: source.count };

  async function ensure(index) {
    if (cache.has(index) || inflight.has(index)) return;
    inflight.add(index);
    try {
      if (source.drawProcedural) {
        cache.set(index, source.drawProcedural(index));
      } else {
        const res = await fetch(source.getUrl(index));
        const blob = await res.blob();
        cache.set(index, await createImageBitmap(blob));
      }
    } catch (err) {
      if (!loggedError) {
        console.warn("[v14] frame load failed; holding last frame", err);
        loggedError = true;
      }
    } finally {
      inflight.delete(index);
    }
  }

  function preload(index) {
    for (const i of preloadWindow(index, source.count, AHEAD, BEHIND)) ensure(i);
  }

  function tick() {
    if (!running) return;
    const index = frameIndexFor(targetProgress, source.count);
    if (index !== lastDrawnIndex) {
      const frame = cache.get(index) || lastGood;
      if (frame) {
        try {
          renderer.draw(frame);
          lastGood = frame;
          lastDrawnIndex = index;
          debug.drawCount += 1;
          debug.frameIndex = index;
        } catch (err) {
          if (!loggedError) {
            console.warn("[v14] frame draw failed; skipping frame", err);
            loggedError = true;
          }
        }
      }
      preload(index);
    }
    rafId = requestAnimationFrame(tick);
  }

  return {
    debug,
    setProgress(p) {
      targetProgress = p;
    },
    start() {
      if (running) return;
      running = true;
      preload(frameIndexFor(targetProgress, source.count));
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
    destroy() {
      this.stop();
      cache.clear();
      lastGood = null;
    },
  };
}

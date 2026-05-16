"use client";
import { useEffect } from "react";

/* Virtual scroll engine — accumulates wheel/touch/key into target, lerps to current.
 * progress is normalized [0, 1] across the whole story. No native page scroll involved.
 *
 *   targetRef   : useRef(0)   raw accumulator
 *   progressRef : useRef(0)   smoothed current (read in useFrame by R3F)
 *   onProgress  : (p) => void called each frame for DOM-side state (cheap, rAF-batched)
 *   locked      : boolean     when true, ignore input (preloader / mobile)
 *
 *   tuning:
 *     STEP   — wheel deltaY scale (smaller = slower scroll)
 *     LERP   — smoothing factor (lower = more cinematic, higher = more responsive)
 */
const STEP = 1 / 6500;
const LERP = 0.07;

export function useV8Scroll({ targetRef, progressRef, onProgress, locked }) {
  useEffect(() => {
    if (locked) return;

    let touchY = null;
    let raf = 0;
    let lastUIPush = 0;

    const onWheel = e => {
      e.preventDefault();
      targetRef.current = clamp(targetRef.current + e.deltaY * STEP, 0, 1);
    };

    const onKey = e => {
      const map = {
        ArrowDown:  +0.06,
        ArrowUp:    -0.06,
        PageDown:   +0.18,
        PageUp:     -0.18,
        Home:       -1,
        End:        +1,
        " ":        +0.18,
      };
      if (map[e.key] !== undefined) {
        e.preventDefault();
        if (e.key === "Home") targetRef.current = 0;
        else if (e.key === "End") targetRef.current = 1;
        else targetRef.current = clamp(targetRef.current + map[e.key], 0, 1);
      }
    };

    const onTouchStart = e => { touchY = e.touches[0].clientY; };
    const onTouchMove  = e => {
      if (touchY == null) return;
      const dy = touchY - e.touches[0].clientY;
      targetRef.current = clamp(targetRef.current + dy * STEP * 2.5, 0, 1);
      touchY = e.touches[0].clientY;
      e.preventDefault();
    };
    const onTouchEnd = () => { touchY = null; };

    const tick = () => {
      const t = targetRef.current;
      const cur = progressRef.current;
      const next = cur + (t - cur) * LERP;
      progressRef.current = next;
      const now = performance.now();
      if (now - lastUIPush > 33) {
        lastUIPush = now;
        onProgress?.(next);
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
    window.addEventListener("touchend",   onTouchEnd);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, [locked, targetRef, progressRef, onProgress]);
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

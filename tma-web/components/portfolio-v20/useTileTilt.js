"use client";

/* =====================================================================
   useTileTilt — cursor-driven 3D tilt on Our Work tiles.
   ---------------------------------------------------------------------
   One document-level pointermove handler finds the tile under the cursor
   and writes CSS variables (--tilt-rx / --tilt-ry / --tilt-s) on it. The
   element's CSS rule turns those vars into a perspective+rotate+scale
   transform. While the tile is "active" we use a snappy transition; on
   leave we restore a longer ease so the tile glides back flat.

   Disabled on touch and reduced-motion devices.
   ===================================================================== */

import { useEffect } from "react";

export function useTileTilt(selector, opts = {}) {
  const maxTilt = opts.maxTilt ?? 7;       // degrees at the tile edges
  const scale = opts.scale ?? 1.03;        // hover scale-up

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarse || reduce) return;

    let active = null;

    const reset = (el) => {
      if (!el) return;
      el.classList.remove("is-tilting");
      el.style.setProperty("--tilt-rx", "0deg");
      el.style.setProperty("--tilt-ry", "0deg");
      el.style.setProperty("--tilt-s", "1");
    };

    const onMove = (e) => {
      const tile = e.target.closest?.(selector);
      if (!tile) {
        if (active) {
          reset(active);
          active = null;
        }
        return;
      }
      if (tile !== active) {
        if (active) reset(active);
        active = tile;
        active.classList.add("is-tilting");
      }
      const r = tile.getBoundingClientRect();
      // -0.5..0.5 across the tile in both axes
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      // rotateY follows horizontal cursor; rotateX inverts so cursor-up tilts toward viewer
      const ry = nx * maxTilt * 2;
      const rx = -ny * maxTilt * 2;
      tile.style.setProperty("--tilt-rx", `${rx.toFixed(2)}deg`);
      tile.style.setProperty("--tilt-ry", `${ry.toFixed(2)}deg`);
      tile.style.setProperty("--tilt-s", String(scale));
    };

    const onLeaveDoc = () => {
      if (active) {
        reset(active);
        active = null;
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeaveDoc, true);
    document.addEventListener("blur", onLeaveDoc);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeaveDoc, true);
      document.removeEventListener("blur", onLeaveDoc);
      if (active) reset(active);
    };
  }, [selector, maxTilt, scale]);
}

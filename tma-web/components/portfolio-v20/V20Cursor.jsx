"use client";

/* =====================================================================
   V20Cursor — magnetic "READ MORE" cursor
   ---------------------------------------------------------------------
   Tracks the pointer with rAF easing and renders a black pill that
   replaces the native cursor over any element marked
   `data-cursor="read-more"`. When active, the pill expands and reveals
   a small "READ MORE →" label.

   Skipped (renders nothing) under:
     - touch-only devices (pointer: coarse)
     - prefers-reduced-motion
     - SSR (uses useEffect)

   The page-level CSS rule
       body.has-magnetic-cursor [data-cursor="read-more"] { cursor: none; }
   hides the system cursor only when this component is actually mounted,
   so keyboard / touch users keep their native cursor.
   ===================================================================== */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function V20Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef(null);
  const labelRef = useRef(null);
  const stateRef = useRef({
    tx: 0, ty: 0, x: 0, y: 0,
    active: false,
    label: "READ MORE",
  });

  // gate on environment capability
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduce);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.body.classList.add("has-magnetic-cursor");

    const dot = dotRef.current;
    const label = labelRef.current;
    if (!dot) return;

    const s = stateRef.current;
    s.tx = window.innerWidth / 2;
    s.ty = window.innerHeight / 2;
    s.x = s.tx;
    s.y = s.ty;

    const onMove = (e) => {
      s.tx = e.clientX;
      s.ty = e.clientY;
    };

    const findZone = (el) =>
      el && el.closest ? el.closest("[data-cursor='read-more']") : null;

    const onOver = (e) => {
      const zone = findZone(e.target);
      if (!zone) return;
      s.active = true;
      const customLabel = zone.getAttribute("data-cursor-label");
      s.label = customLabel || "READ MORE";
      if (label) label.textContent = s.label;
      dot.classList.add("is-active");
    };
    const onOut = (e) => {
      const zone = findZone(e.target);
      const toZone = findZone(e.relatedTarget);
      if (zone && !toZone) {
        s.active = false;
        dot.classList.remove("is-active");
      }
    };

    let rafId = 0;
    const tick = () => {
      // critically-damped lerp toward target
      s.x += (s.tx - s.x) * 0.22;
      s.y += (s.ty - s.y) * 0.22;
      dot.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.body.classList.remove("has-magnetic-cursor");
    };
  }, [enabled]);

  if (!enabled || typeof document === "undefined") return null;

  return createPortal(
    <div ref={dotRef} className="v20cursor" aria-hidden="true">
      <span ref={labelRef} className="v20cursor-label">READ MORE</span>
    </div>,
    document.body
  );
}

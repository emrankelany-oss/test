"use client";

/* =====================================================================
   V21Cursor — premium "Read more" follow-button
   ---------------------------------------------------------------------
   Tracks the pointer with rAF easing. Over any element marked
   `data-cursor="read-more"` it reveals a premium pill button — an arrow
   + "Read more" label — and the native cursor is hidden (see the
   body.has-magnetic-cursor rule in v21.css). Idle (off a tile) it is
   invisible, so the rest of the page keeps the normal cursor.

   Skipped (renders nothing) under touch-only devices, reduced-motion, SSR.
   ===================================================================== */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function V21Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef(null);
  const stateRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 });

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
      if (!findZone(e.target)) return;
      dot.classList.add("is-active");
    };
    const onOut = (e) => {
      const zone = findZone(e.target);
      const toZone = findZone(e.relatedTarget);
      if (zone && !toZone) dot.classList.remove("is-active");
    };

    let rafId = 0;
    const tick = () => {
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
    <div ref={dotRef} className="v21cursor" aria-hidden="true">
      <span className="v21cursor-inner">
        <svg
          className="v21cursor-arrow"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M7 17L17 7M9 7h8v8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="v21cursor-label">Read more</span>
      </span>
    </div>,
    document.body
  );
}

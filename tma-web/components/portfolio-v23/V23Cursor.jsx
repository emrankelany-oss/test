"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Clim-style magnetic cursor:
 *  - a small lerping dot (mix-blend difference)
 *  - an accent "blob" that grows + rotates over [data-cursor="blob"] zones
 *  - a frosted "Drag" pill over [data-cursor="drag"] zones (the carousel)
 *  - magnetic pull on [data-magnetic] elements (label drifts toward pointer)
 */
export default function V23Cursor() {
  const [enabled, setEnabled] = useState(false);
  const rootRef = useRef(null);
  const pillLabelRef = useRef(null);
  const s = useRef({ tx: 0, ty: 0, x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduce);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("v23-has-cursor");
    const root = rootRef.current;
    if (!root) return;
    const st = s.current;
    st.tx = st.x = window.innerWidth / 2;
    st.ty = st.y = window.innerHeight / 2;

    const onMove = (e) => { st.tx = e.clientX; st.ty = e.clientY; };
    const zoneOf = (el) => (el && el.closest ? el.closest("[data-cursor]") : null);
    const magOf = (el) => (el && el.closest ? el.closest("[data-magnetic]") : null);

    const onOver = (e) => {
      const zone = zoneOf(e.target);
      if (zone) {
        const kind = zone.getAttribute("data-cursor"); // drag (blob removed)
        root.classList.toggle("is-pill", kind === "drag");
        if (kind === "drag" && pillLabelRef.current) {
          pillLabelRef.current.textContent =
            zone.getAttribute("data-cursor-label") || "Drag";
        }
      }
    };
    const onOut = (e) => {
      if (zoneOf(e.target) && !zoneOf(e.relatedTarget)) {
        root.classList.remove("is-pill");
      }
    };

    // magnetic buttons — translate label toward the pointer at 0.25 strength
    const onMagMove = (e) => {
      const mag = magOf(e.target);
      if (!mag) return;
      const r = mag.getBoundingClientRect();
      const mx = (e.clientX - (r.left + r.width / 2)) * 0.25;
      const my = (e.clientY - (r.top + r.height / 2)) * 0.25;
      mag.style.setProperty("--xM", `${mx.toFixed(1)}px`);
      mag.style.setProperty("--yM", `${my.toFixed(1)}px`);
    };
    const onMagOut = (e) => {
      const mag = magOf(e.target);
      if (mag && !magOf(e.relatedTarget)) {
        mag.style.setProperty("--xM", "0px");
        mag.style.setProperty("--yM", "0px");
      }
    };

    let raf = 0;
    const tick = () => {
      st.x += (st.tx - st.x) * 0.22;
      st.y += (st.ty - st.y) * 0.22;
      root.style.transform = `translate3d(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointermove", onMagMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    document.addEventListener("pointerout", onMagOut, true);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointermove", onMagMove);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.removeEventListener("pointerout", onMagOut, true);
      document.body.classList.remove("v23-has-cursor");
    };
  }, [enabled]);

  if (!enabled || typeof document === "undefined") return null;
  return createPortal(
    <div ref={rootRef} className="v23-cursor" aria-hidden="true">
      <span className="v23-cursor-dot" />
      <span className="v23-cursor-pill"><span ref={pillLabelRef}>Drag</span></span>
    </div>,
    document.body
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function V22Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef(null);
  const labelRef = useRef(null);
  const s = useRef({ tx: 0, ty: 0, x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduce);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("v22-has-cursor");
    const dot = dotRef.current, label = labelRef.current;
    const st = s.current;
    st.tx = st.x = window.innerWidth / 2;
    st.ty = st.y = window.innerHeight / 2;

    const onMove = (e) => { st.tx = e.clientX; st.ty = e.clientY; };
    const zoneOf = (el) => (el && el.closest ? el.closest("[data-cursor]") : null);

    const onOver = (e) => {
      const zone = zoneOf(e.target);
      if (!zone) return;
      const kind = zone.getAttribute("data-cursor"); // view | drag | sound
      const text = zone.getAttribute("data-cursor-label") || kind.toUpperCase();
      if (label) label.textContent = text;
      dot.dataset.kind = kind;
      dot.classList.add("is-active");
    };
    const onOut = (e) => {
      if (zoneOf(e.target) && !zoneOf(e.relatedTarget)) {
        dot.classList.remove("is-active");
        delete dot.dataset.kind;
      }
    };

    let raf = 0;
    const tick = () => {
      st.x += (st.tx - st.x) * 0.22;
      st.y += (st.ty - st.y) * 0.22;
      dot.style.transform = `translate3d(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.body.classList.remove("v22-has-cursor");
    };
  }, [enabled]);

  if (!enabled || typeof document === "undefined") return null;
  return createPortal(
    <div ref={dotRef} className="v22-cursor" aria-hidden="true">
      <span ref={labelRef} className="v22-cursor-label" />
    </div>,
    document.body
  );
}

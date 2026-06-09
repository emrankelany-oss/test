"use client";
import { useEffect, useRef } from "react";

// Keeps the page black (as before) but adds a small, subtle gradient effect in
// the brand's slide-2 colors: two soft blurred iridescent glows that parallax
// up as the user scrolls (writes scrollY to --sp; CSS translates the glows).
export default function V26Backdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--sp", String(window.scrollY));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="v26-backdrop" aria-hidden="true">
      <span className="v26-glow v26-glow-a" />
      <span className="v26-glow v26-glow-b" />
      <span className="v26-glow v26-glow-c" />
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";

// The TMA brand guidelines (p5) use a tiled, repeating "THE MOTION AGENCY"
// wordmark grid as the signature background pattern. We recreate it as a fixed,
// very-low-opacity layer that slowly drifts upward (continuous CSS loop) and
// parallax-shifts with scroll — the "scrolling background grid" from the guide.
// Two identical blocks stacked + translateY:-50% loop = seamless.

const PER_BLOCK = 60;

function Block() {
  return (
    <div className="v26-bg-block">
      {Array.from({ length: PER_BLOCK }).map((_, i) => (
        <span className="v26-bg-mark" key={i}>
          THE
          <br />
          MOTION
          <br />
          AGENCY
        </span>
      ))}
    </div>
  );
}

export default function V26BrandGrid() {
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
        el.style.setProperty("--bg-scroll", `${window.scrollY * 0.06}px`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="v26-brandgrid" aria-hidden="true">
      <div className="v26-brandgrid-scroll">
        <Block />
        <Block />
      </div>
    </div>
  );
}

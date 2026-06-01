"use client";
import { useEffect, useRef } from "react";

const DEFAULT_ITEMS = [
  "END-TO-END PRODUCTION", "BRAND", "EVENTS", "MOTION DESIGN",
  "CONTENT", "STRATEGY", "CAMPAIGNS", "STORYTELLING",
];

export default function V22Marquee({ items = DEFAULT_ITEMS }) {
  const trackRef = useRef(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = 0, lastY = window.scrollY, vel = 0, raf = 0;
    const BASE = 0.6; // baseline px/frame drift
    const tick = () => {
      const y = window.scrollY;
      vel += (Math.abs(y - lastY) - vel) * 0.1; // eased scroll speed
      lastY = y;
      x -= BASE + vel * 0.25;
      const half = track.scrollWidth / 2;
      if (half > 0 && -x >= half) x += half;
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const row = [...items, ...items]; // duplicate for seamless loop
  return (
    <div className="v22-marquee" aria-hidden="true">
      <div ref={trackRef} className="v22-marquee-track">
        {row.map((t, i) => (
          <span key={i} className="v22-marquee-item">{t}<i className="v22-marquee-dot" /></span>
        ))}
      </div>
    </div>
  );
}

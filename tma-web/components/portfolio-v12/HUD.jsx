"use client";

import { useEffect, useRef } from "react";
import { useLaunchProgressRef } from "./LaunchSequenceContext.jsx";

export default function HUD() {
  const altRef = useRef(null);
  const velRef = useRef(null);
  const { getProgress } = useLaunchProgressRef();

  useEffect(() => {
    let raf;
    const tick = () => {
      const p = getProgress();
      if (altRef.current) altRef.current.textContent = (p * 420).toFixed(1).padStart(5, "0");
      if (velRef.current) velRef.current.textContent = (p * 27).toFixed(2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getProgress]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", left: "2vw", bottom: "2vh", zIndex: 4,
        fontVariantNumeric: "tabular-nums", fontSize: "0.72rem",
        letterSpacing: "0.18em", color: "var(--v12-silver)", pointerEvents: "none",
      }}
    >
      <div>ALT <span ref={altRef}>000.0</span> KM</div>
      <div>VEL ↑ <span ref={velRef}>0.00</span> KM/S</div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useLaunchProgressRef } from "./LaunchSequenceContext.jsx";

const MAX = 140;

export default function AtmosphereLayer() {
  const canvasRef = useRef(null);
  const { getProgress } = useLaunchProgressRef();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf, w, h, dpr;
    const parts = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = () => ({
      x: Math.random() * w,
      y: h + Math.random() * h * 0.3,
      r: (Math.random() * 2 + 0.5) * dpr,
      vy: -(Math.random() * 0.4 + 0.2) * dpr,
      vx: (Math.random() - 0.5) * 0.3 * dpr,
      life: Math.random(),
    });
    for (let i = 0; i < MAX; i++) parts.push(spawn());

    const draw = () => {
      const p = getProgress();
      const active = Math.floor(20 + p * (MAX - 20));
      const speed = 1 + p * 3.2;
      const hue = 24 + p * 6;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < active; i++) {
        const a = parts[i];
        a.y += a.vy * speed;
        a.x += a.vx * speed;
        a.life -= 0.004 * speed;
        if (a.y < -10 || a.life <= 0) Object.assign(a, spawn());
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue}, 95%, ${55 + p * 10}%, ${0.12 + a.life * 0.5})`;
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);
    if (!reduced) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [getProgress]);

  return (
    <div className="v12-fixed-layer" aria-hidden="true">
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 100%, rgba(255,106,26,0.18), transparent 60%), radial-gradient(100% 60% at 50% 0%, rgba(46,107,255,0.10), transparent 55%)",
        }}
      />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

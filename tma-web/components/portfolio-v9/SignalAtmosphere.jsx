"use client";

import { useEffect, useRef } from "react";

// Animated atmosphere: drifting particles, ribbon/spline curves that evolve
// with scroll progress, all painted on a single canvas for performance.
export default function SignalAtmosphere({ progressRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let w = 0;
    let h = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // particle field
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * 1600,
      y: Math.random() * 900,
      z: 0.3 + Math.random() * 0.7,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: 0.6 + Math.random() * 1.4,
      hue: 180 + Math.random() * 80,
    }));

    // ribbon curves — the "signal" itself
    const ribbons = Array.from({ length: 5 }, (_, i) => ({
      offset: i * 0.18,
      amp: 80 + i * 32,
      speed: 0.00018 + i * 0.00005,
      hue: 190 + i * 14,
      width: 0.6 + i * 0.4,
    }));

    let t0 = performance.now();

    const draw = () => {
      const t = performance.now() - t0;
      const p = progressRef && progressRef.current ? progressRef.current : 0;

      ctx.clearRect(0, 0, w, h);

      // chapter-tied energy: birth=0 → infinite=1
      const energy = Math.pow(p, 0.85);

      // soft moving fog
      const grad = ctx.createRadialGradient(
        w * (0.3 + 0.4 * Math.sin(t * 0.00015)),
        h * (0.4 + 0.3 * Math.cos(t * 0.00018)),
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.9,
      );
      const fogA = 0.04 + 0.06 * energy;
      grad.addColorStop(0, `rgba(80,160,255,${fogA})`);
      grad.addColorStop(0.5, `rgba(30,40,90,${fogA * 0.5})`);
      grad.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // ribbons (the Signal threads)
      ribbons.forEach((r, ri) => {
        ctx.beginPath();
        const yBase = h * 0.5;
        const points = 80;
        const offsetT = t * r.speed + r.offset * 6;
        for (let i = 0; i <= points; i++) {
          const x = (i / points) * (w + 200) - 100;
          const sway = Math.sin(i * 0.18 + offsetT) + Math.cos(i * 0.07 - offsetT * 1.3) * 0.6;
          const fall = Math.sin(i * 0.04 + offsetT * 0.4) * 0.5;
          const y =
            yBase +
            sway * (r.amp * (0.6 + energy * 0.9)) +
            fall * 60 * (1 - energy) +
            (ri - 2) * 60;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const alpha = 0.06 + 0.22 * energy;
        ctx.strokeStyle = `hsla(${r.hue}, 95%, 65%, ${alpha})`;
        ctx.lineWidth = r.width * (1 + energy * 1.2);
        ctx.shadowColor = `hsla(${r.hue}, 95%, 70%, ${0.4 * energy})`;
        ctx.shadowBlur = 28 * energy;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // particle drift
      particles.forEach((pt) => {
        pt.x += pt.vx * (0.4 + energy * 1.6);
        pt.y += pt.vy * (0.4 + energy * 1.6);
        if (pt.x < -20) pt.x = w + 20;
        if (pt.x > w + 20) pt.x = -20;
        if (pt.y < -20) pt.y = h + 20;
        if (pt.y > h + 20) pt.y = -20;
        const r = pt.r * (0.5 + pt.z) * (0.6 + energy * 0.9);
        const a = 0.18 + 0.55 * pt.z * (0.4 + energy * 0.9);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${pt.hue},95%,75%,${a})`;
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // timeline grid (emerges in later chapters)
      if (energy > 0.35) {
        const gridA = (energy - 0.35) * 0.6;
        ctx.strokeStyle = `rgba(160,200,255,${0.05 + gridA * 0.12})`;
        ctx.lineWidth = 1;
        const step = 80;
        const phase = (t * 0.025) % step;
        for (let x = -step + phase; x < w + step; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 80, h);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [progressRef]);

  return <canvas ref={canvasRef} className="v9-atmosphere" aria-hidden="true" />;
}

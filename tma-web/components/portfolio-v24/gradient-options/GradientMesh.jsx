"use client";
import { useEffect, useRef } from "react";
import { GALAXY_STOPS } from "@/components/portfolio-v24/data";

// Option 2 — flowing mesh gradient. Bold brand-color blobs morph continuously
// AND the whole field pans up as you scroll (blobs wrap), so it clearly travels.
export default function GradientMesh() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = (W * dpr) | 0; canvas.height = (H * dpr) | 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    let sN = 0;
    const onScroll = () => {
      const m = document.documentElement.scrollHeight - window.innerHeight;
      sN = m > 0 ? window.scrollY / m : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const hexA = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    };
    let seed = 99;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const blobs = Array.from({ length: 6 }, (_, i) => ({
      bx: rnd(), by: rnd(),
      ax: 0.12 + rnd() * 0.14, ay: 0.12 + rnd() * 0.14,
      sx: 0.2 + rnd() * 0.3, sy: 0.18 + rnd() * 0.28,
      ph: rnd() * 6.28, c: GALAXY_STOPS[(i * 2) % GALAXY_STOPS.length], r: 0.34 + rnd() * 0.16,
    }));

    let raf = 0, last = 0, phase = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const span = H * 1.5;
      blobs.forEach((b) => {
        const x = (b.bx + Math.sin(phase * b.sx + b.ph) * b.ax) * W;
        let y = (b.by + Math.cos(phase * b.sy + b.ph) * b.ay) * H - sN * span; // pan up on scroll
        y = (((y % span) + span) % span) - H * 0.25; // wrap so it never empties
        const r = b.r * Math.min(W, H);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, hexA(b.c, 0.7));
        g.addColorStop(0.5, hexA(b.c, 0.32));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.filter = "blur(70px)";
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
        ctx.restore();
      });
    };
    const frame = (now) => {
      now = now || 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now; phase += dt; draw();
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    if (reduce) { cancelAnimationFrame(raf); draw(); }
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) { last = 0; raf = requestAnimationFrame(frame); }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return <div className="go-bg go-bg-bold" aria-hidden="true"><canvas ref={ref} /></div>;
}

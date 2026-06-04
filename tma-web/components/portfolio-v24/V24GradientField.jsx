"use client";
import { useEffect, useRef } from "react";

// Fixed full-viewport canvas: a prismatic spectrum beam + two drifting
// iridescent blobs on black. Drifts continuously and "swims" with scroll.
// Screen-blended over black; respects reduced motion (static frame).
const STOPS = ["#02146c", "#033da2", "#027eca", "#24c3db", "#4dd4c8", "#f8e557", "#f5a422", "#da210c", "#c41e5a"];

export default function V24GradientField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let scrollN = 0; // 0..1 normalized scroll
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollN = max > 0 ? window.scrollY / max : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const drawBeam = (t) => {
      // diagonal beam whose angle/offset shift with time + scroll
      const ang = -0.9 + Math.sin(t * 0.05) * 0.15 + scrollN * 0.6;
      const cx = W * (0.28 + Math.sin(t * 0.03) * 0.04 + scrollN * 0.12);
      const len = Math.hypot(W, H);
      const x0 = cx + Math.cos(ang) * len, y0 = Math.sin(ang) * len;
      const x1 = cx - Math.cos(ang) * len, y1 = H - Math.sin(ang) * len;
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      STOPS.forEach((c, i) => g.addColorStop(i / (STOPS.length - 1), c));
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.filter = "blur(40px)";
      ctx.fillStyle = g;
      ctx.translate(cx - W * 0.5, 0);
      ctx.fillRect(W * 0.18, -H, W * 0.34, H * 3);
      ctx.restore();
    };

    const blob = (t, seed, hueStops) => {
      const x = W * (0.5 + 0.32 * Math.sin(t * 0.07 + seed)) ;
      const y = H * (0.5 + 0.30 * Math.cos(t * 0.05 + seed * 1.7) + (scrollN - 0.5) * 0.4);
      const r = Math.min(W, H) * 0.34;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, hueStops[0]); g.addColorStop(0.5, hueStops[1]); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.globalAlpha = 0.5; ctx.filter = "blur(50px)";
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    let raf = 0, t = 0, t0 = 0;
    const frame = (now) => {
      if (!t0) t0 = now || 0;
      t = ((now || 0) - t0) / 1000; // seconds since first frame
      ctx.clearRect(0, 0, W, H);
      drawBeam(t);
      blob(t, 0.0, ["#027eca", "#24c3db"]);
      blob(t, 2.4, ["#da210c", "#f5a422"]);
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    if (reduce) { cancelAnimationFrame(raf); frame(0); }

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="v24-gradient-field" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

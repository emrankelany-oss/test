"use client";
import { useEffect, useRef } from "react";
import { GALAXY_STOPS } from "@/components/portfolio-v24/data";

// Option 1 — scroll-swept aurora beams. Beam angle + position are driven
// strongly by scroll progress, so the beams visibly sweep/rotate as you scroll.
export default function GradientAurora() {
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

    const beams = [
      { c: [GALAXY_STOPS[0], GALAXY_STOPS[2], GALAXY_STOPS[3]], a0: -0.7, w: 0.30, off: 0.18 },
      { c: [GALAXY_STOPS[5], GALAXY_STOPS[6], GALAXY_STOPS[8]], a0: -1.0, w: 0.24, off: 0.5 },
      { c: [GALAXY_STOPS[4], GALAXY_STOPS[10], GALAXY_STOPS[1]], a0: -0.5, w: 0.20, off: 0.82 },
    ];

    let raf = 0, last = 0, phase = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const len = Math.hypot(W, H) * 1.7;
      beams.forEach((b, i) => {
        const ang = b.a0 + sN * 1.4 + Math.sin(phase * 0.2 + i) * 0.08; // scroll sweeps the angle
        const cx = W * (b.off + (sN - 0.5) * 0.45) + Math.sin(phase * 0.15 + i) * 40;
        const cy = H * 0.5;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        const g = ctx.createLinearGradient(0, -len / 2, 0, len / 2);
        b.c.forEach((col, k) => g.addColorStop(k / (b.c.length - 1), col));
        ctx.globalAlpha = 0.5;
        ctx.filter = "blur(55px)";
        ctx.fillStyle = g;
        ctx.fillRect((-b.w * W) / 2, -len / 2, b.w * W, len);
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
  return <div className="go-bg" aria-hidden="true"><canvas ref={ref} /></div>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { WORK_GRID, FEATURED } from "./projects";

// Critical assets to genuinely preload before revealing the page. We block on
// the hero loop + above-the-fold imagery + the two featured lead films, and let
// everything deeper lazy-load (as designed) so the wait stays honest, not endless.
function criticalAssets() {
  const imgs = new Set(["/assets/v5/slide8-poster.jpg"]);
  WORK_GRID.slice(0, 10).forEach((c) => c.image && imgs.add(c.image));
  FEATURED.forEach((f) => f.media[0]?.poster && imgs.add(f.media[0].poster));
  const vids = new Set([
    "/assets/v5/slide8-loop.mp4",
    ...FEATURED.map((f) => f.media.find((m) => m.kind === "video")?.src).filter(Boolean),
  ]);
  return {
    images: [...imgs],
    videos: [...vids],
  };
}

const STATUSES = ["Booting the studio", "Loading the films", "Preparing the work", "Almost there"];

export default function V23Preloader() {
  const rootRef = useRef(null);
  const numRef = useRef(null);
  const barRef = useRef(null);
  const statusRef = useRef(null);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || window.__V23_SKIP_PRELOADER) { setMounted(false); return; }

    const docEl = document.documentElement;
    docEl.classList.add("v23-loading");
    docEl.style.overflow = "hidden";

    const { images, videos } = criticalAssets();
    const total = images.length + videos.length + 1; // +1 for fonts
    let done = 0;
    const bump = () => { done = Math.min(total, done + 1); };

    const loadImg = (src) =>
      new Promise((res) => {
        const im = new Image();
        im.onload = im.onerror = () => { bump(); res(); };
        im.src = src;
      });
    const loadVid = (src) =>
      new Promise((res) => {
        const v = document.createElement("video");
        v.muted = true; v.preload = "metadata";
        let settled = false;
        const fin = () => { if (settled) return; settled = true; bump(); res(); };
        // metadata is enough to know the file is reachable & decodable; the hero
        // loop keeps buffering behind the reveal. Don't let one file stall us.
        v.onloadedmetadata = fin; v.oncanplay = fin; v.onerror = fin;
        setTimeout(fin, 3500);
        v.src = src;
      });

    const fontsP = (document.fonts ? document.fonts.ready : Promise.resolve()).then(bump);
    const work = Promise.all([fontsP, ...images.map(loadImg), ...videos.map(loadVid)]);

    const start = performance.now();
    const MIN_MS = 1400; // keep the moment premium even on fast loads
    let shown = 0;        // smoothed % actually displayed
    let raf = 0;
    let revealed = false;
    let si = -1;

    const tick = () => {
      const real = (done / total) * 100;
      // ease the shown number toward the real progress
      shown += (real - shown) * 0.08;
      const elapsed = performance.now() - start;
      // never quite hit 100 until both loaded AND min-time elapsed
      let display = Math.min(shown, done >= total && elapsed >= MIN_MS ? 100 : 99);
      display = Math.round(display);
      if (numRef.current) numRef.current.textContent = String(display).padStart(2, "0");
      if (barRef.current) barRef.current.style.transform = `scaleX(${display / 100})`;
      const stage = Math.min(STATUSES.length - 1, Math.floor((display / 100) * STATUSES.length));
      if (stage !== si && statusRef.current) { si = stage; statusRef.current.textContent = STATUSES[stage]; }

      if (display >= 100 && !revealed) { revealed = true; reveal(); return; }
      raf = requestAnimationFrame(tick);
    };

    const reveal = () => {
      const tl = gsap.timeline({
        onComplete: () => {
          docEl.classList.remove("v23-loading");
          docEl.style.overflow = "";
          window.dispatchEvent(new CustomEvent("v23:loaded"));
          setMounted(false);
        },
      });
      tl.to(root.querySelector(".v23-pl-inner"), { opacity: 0, duration: 0.4, ease: "power2.in" })
        .to(root.querySelectorAll(".v23-pl-panel-top"), { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, 0.15)
        .to(root.querySelectorAll(".v23-pl-panel-bot"), { yPercent: 100, duration: 0.9, ease: "expo.inOut" }, 0.15);
    };

    raf = requestAnimationFrame(tick);
    // safety: never trap the user if something hangs
    const hardStop = setTimeout(() => { done = total; }, 8000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hardStop);
      docEl.classList.remove("v23-loading");
      docEl.style.overflow = "";
      work.catch(() => {});
    };
  }, []);

  if (!mounted) return null;
  return (
    <div className="v23-preloader" ref={rootRef} aria-hidden="true">
      <span className="v23-pl-panel v23-pl-panel-top" />
      <span className="v23-pl-panel v23-pl-panel-bot" />
      <div className="v23-pl-inner">
        <span className="v23-pl-mark">THE MOTION AGENCY</span>
        <div className="v23-pl-status" ref={statusRef}>Booting the studio</div>
        <div className="v23-pl-count">
          <span ref={numRef}>00</span><i>%</i>
        </div>
        <div className="v23-pl-track"><span className="v23-pl-bar" ref={barRef} /></div>
      </div>
    </div>
  );
}

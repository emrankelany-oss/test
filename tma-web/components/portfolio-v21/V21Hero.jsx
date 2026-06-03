"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * V21Hero — "Narrative Meets Design"
 *
 * Left: a stacked display headline. Right: a contained hero video that floats
 * toward the cursor — the Clim/V22 "magnetic" technique (GSAP quickTo on x/y,
 * smooth power3 easing). The whole card drifts toward the pointer while it's
 * anywhere in the hero and springs back when the pointer leaves.
 */
export default function V21Hero() {
  const cardRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = v.play();
    if (tryPlay && typeof tryPlay.catch === "function") tryPlay.catch(() => {});
  }, []);

  // Magnetic float toward the cursor (matches V22's useMagnetic / Clim).
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const hero = card.closest(".v21-hero");
    if (!hero) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const xTo = gsap.quickTo(card, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3" });
    const clamp = (val, max) => Math.max(-max, Math.min(max, val));

    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      xTo(clamp((e.clientX - cx) * 0.55, 320));
      yTo(clamp((e.clientY - cy) * 0.55, 220));
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      gsap.killTweensOf(card, "x,y");
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <header className="v21-hero" id="top">
      <div className="v21-hero-bg" aria-hidden="true">
        <div className="v21-prism">
          <div className="v21-prism-cone v21-prism-cone--blue" />
          <div className="v21-prism-cone v21-prism-cone--rim" />
          <div className="v21-prism-grain" />
        </div>
        <div className="v21-bg-grid" />
      </div>

      <div className="v21-hero-inner container">
        <div className="v21-hero-grid">
          <div className="v21-hero-left">
            <h1 className="v21-headline">
              <span className="v21-line v21-line-1">
                <span>Narrative</span>
              </span>
              <span className="v21-line v21-line-italic">
                <span><em>where vision</em></span>
              </span>
              <span className="v21-line v21-line-3">
                <span>Meets</span>
              </span>
              <span className="v21-line v21-line-4">
                <span>Design</span>
              </span>
            </h1>
          </div>

          <div className="v21-hero-right">
            <div className="v21-big-video" ref={cardRef}>
              <video
                ref={videoRef}
                src="/assets/hero2.mp4"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
              />
              <span className="v21-big-video-tint" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="v21-scroll" aria-hidden="true">
        Scroll <span className="line" /> 01 / 01
      </div>
    </header>
  );
}

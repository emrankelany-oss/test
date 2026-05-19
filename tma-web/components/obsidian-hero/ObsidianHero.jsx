"use client";
import "./obsidian-hero.css";
import { useCallback, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";
import { useReliefLamp } from "./useReliefLamp.js";
import { useScrollProgress } from "./useScrollProgress.js";
import DecodeHeadline from "./DecodeHeadline.jsx";

export default function ObsidianHero({
  headline = "Motion in every frame",
  caption = "The Motion Agency — Reel 2026",
  eyebrow = "The Motion Agency",
  imageSrc = "/assets/obsidian-engine.webp",
  fallbackSrc = "/assets/obsidian-engine-lqip.webp",
  parallaxFactor = 0.1,
  className = "",
}) {
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const disabled = reduced || failed;

  const sectionRef = useRef(null);
  const captionRef = useRef(null);
  const { canvasRef, engineRef } = useReliefLamp({ imageSrc, disabled, onFail });

  const onScroll = useCallback(
    (y) => {
      if (engineRef.current) engineRef.current.setScroll(y);
      if (sectionRef.current) {
        sectionRef.current.dataset.scrolled = y > 40 ? "true" : "false";
      }
    },
    [engineRef]
  );

  useScrollProgress({ sectionRef, captionRef, onScroll, factor: parallaxFactor, disabled });

  return (
    <section ref={sectionRef} className={`oh-root ${className}`} data-scrolled="false">
      {disabled ? (
        <img className="oh-fallback" src={imageSrc} alt="" aria-hidden="true" />
      ) : (
        <div className="oh-canvas-wrap">
          <canvas ref={canvasRef} />
        </div>
      )}
      <div className="oh-content">
        <p className="oh-eyebrow">{eyebrow}</p>
        <div>
          <DecodeHeadline text={headline} className="oh-headline" reducedMotion={disabled} />
          <div className="oh-footer">
            <p ref={captionRef} className="oh-caption">{caption}</p>
            <p className="oh-cue">Scroll to enter</p>
          </div>
        </div>
      </div>
    </section>
  );
}

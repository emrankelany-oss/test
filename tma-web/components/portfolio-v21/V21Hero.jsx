"use client";

import { useEffect, useRef } from "react";

/**
 * V21Hero — "The Continuum" type-first editorial hero.
 *
 * A calm, spacious opening: an oversized display-serif headline that reveals
 * line-by-line, a short meta row, and the showreel as a FRAMED inset (not
 * full-bleed). Filament/atmosphere/comet (mounted at the page level) thread
 * through behind it. No internal nav — the page mounts <Nav/> separately.
 */
export default function V21Hero() {
  const reelRef = useRef(null);

  useEffect(() => {
    const v = reelRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  return (
    <header className="v21-hero" id="top">
      <div className="v21-hero-inner v21-measure">
        <p className="v21h-kicker">Creative motion studio · GCC</p>

        <h1 className="v21h-headline">
          <span className="v21h-line"><span>Where strategy</span></span>
          <span className="v21h-line"><span>meets <em>bold</em></span></span>
          <span className="v21h-line"><span>storytelling</span></span>
          <span className="v21h-line v21h-line--reel">
            <span>
              <a className="v21h-reel" href="#contact" data-cursor="play" aria-label="Play showreel">
                <video
                  ref={reelRef}
                  src="/assets/hero2.mp4"
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                />
                <span className="v21h-reel-play" aria-hidden="true">▶</span>
                <span className="v21h-reel-label">Showreel 2025</span>
              </a>
            </span>
          </span>
        </h1>

        <div className="v21h-meta">
          <span>EST. 2019</span>
          <span>AMMAN · RIYADH</span>
          <span className="v21h-scrollcue">↓ scroll</span>
        </div>
      </div>
    </header>
  );
}

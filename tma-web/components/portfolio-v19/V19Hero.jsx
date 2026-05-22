"use client";

import { useEffect, useRef } from "react";

/**
 * V19Hero — "Narrative Meets Design"
 *
 * Layout copied from the v19 reference frame:
 *   left  → stacked display headline (3 lines) with the showreel card
 *           tucked under the first line
 *   right → large hero video stacked above a "Let's Talk" glass card
 *
 * Visual language inherits from the homepage hero: black canvas, Inter Tight
 * 900, the prism cones, a faint grid drift. The screenshot's red theme is
 * intentionally dropped — the brief asked for the homepage's bg + font.
 */
export default function V19Hero() {
  const bigVideoRef = useRef(null);

  useEffect(() => {
    const v = bigVideoRef.current;
    if (!v) return;
    const tryPlay = v.play();
    if (tryPlay && typeof tryPlay.catch === "function") tryPlay.catch(() => {});
  }, []);

  return (
    <header className="v19-hero" id="top">
      <div className="v19-hero-bg" aria-hidden="true">
        <div className="v19-prism">
          <div className="v19-prism-cone v19-prism-cone--blue" />
          <div className="v19-prism-cone v19-prism-cone--warm" />
          <div className="v19-prism-cone v19-prism-cone--rim" />
          <div className="v19-prism-grain" />
        </div>
        <div className="v19-bg-grid" />
      </div>

      <div className="v19-hero-inner container">
        <div className="v19-hero-meta">
          <div className="v19-meta-block">
            <span>EST.</span>
            <span className="v">2019</span>
          </div>
          <div className="v19-meta-block">
            <span>AMMAN</span>
            <span className="v">·</span>
            <span>RIYADH</span>
          </div>
          <div className="v19-meta-block">
            <span>SHOWREEL</span>
            <span className="v">2025</span>
          </div>
        </div>

        <div className="v19-hero-grid">
          <div className="v19-hero-left">
            {/*
              One unified h1 = one sentence. Edit any word in place; the
              line stack and spacing stay perfectly consistent.
                NARRATIVE → where vision → MEETS → DESIGN
            */}
            <h1 className="v19-headline">
              <span className="v19-line v19-line-1">
                <span>Narrative</span>
              </span>
              <span className="v19-line v19-line-italic">
                <span><em>where vision</em></span>
              </span>
              <span className="v19-line v19-line-3">
                <span>Meets</span>
              </span>
              <span className="v19-line v19-line-4">
                <span>Design</span>
              </span>
            </h1>
          </div>

          <div className="v19-hero-right">
            <div className="v19-big-video">
              <video
                ref={bigVideoRef}
                src="/assets/hero2.mp4"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
              />
              <span className="v19-big-video-tint" aria-hidden="true" />
            </div>

            <a className="v19-contact-card" href="#contact">
              <img
                className="v19-avatar"
                src="/assets/team/mohamed-sabha.png"
                alt=""
                loading="lazy"
              />
              <div className="v19-contact-info">
                <span className="v19-contact-label">Let's talk</span>
                <span className="v19-contact-name">Mohamed Sabha</span>
                <span className="v19-contact-role">Chief Executive Officer</span>
              </div>
              <span className="v19-contact-bars" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="v19-contact-arrow" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="v19-scroll" aria-hidden="true">
        Scroll <span className="line" /> 01 / 01
      </div>
    </header>
  );
}

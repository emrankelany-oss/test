"use client";
import { useState } from "react";
import { showreel } from "@/data/portfolio";

const reelTiles = [
  { cls: "stripe", label: "REEL · BOUNDLESS '23" },
  { cls: "dim", label: "FILM · ZID RIPPLE" },
  { cls: "bright", label: "STAGE · DIRIYAH" },
  { cls: "dot", label: "MOTION · LOOP 04" },
  { cls: "bright", label: "BTS · SHOOT DAY 2" },
  { cls: "stripe", label: "TITLE CARD · 04" },
  { cls: "dim", label: "PORTRAIT · CEO" },
  { cls: "dot", label: "PRODUCT · POS" },
  { cls: "stripe", label: "EVENT · KEYNOTE" },
  { cls: "bright", label: "REEL · BOUNDLESS '22" },
  { cls: "dim", label: "AERIAL · RIYADH" },
  { cls: "dot", label: "ID · LOGO LOOP" },
];

export default function PortfolioHero() {
  const [reelOpen, setReelOpen] = useState(false);

  return (
    <header className="hero pf-hero" id="top">
      <div className="hero-bg">
        <div className="hero-prism" aria-hidden="true">
          <div className="hero-prism-cone hero-prism-cone--blue" />
          <div className="hero-prism-cone hero-prism-cone--warm" />
          <div className="hero-prism-cone hero-prism-cone--rim" />
          <div className="hero-prism-grain" />
        </div>
        <div className="hero-reel" aria-hidden="true">
          {reelTiles.map((t, i) => (
            <div key={i} className={`hero-reel-tile ${t.cls}`} data-label={t.label}>
              {i % 4 === 0 && <span className="pulse" />}
            </div>
          ))}
        </div>
        <div className="hero-bg-grid" />
      </div>

      <div className="container">
        <div className="hero-meta">
          <div className="hero-meta-block">
            <span>EST.</span>
            <span className="v">2019</span>
          </div>
          <div className="hero-meta-block">
            <span>AMMAN</span>
            <span className="v">·</span>
            <span>RIYADH</span>
          </div>
          <div className="hero-meta-block">
            <span>SHOWREEL</span>
            <span className="v">2025</span>
          </div>
        </div>

        <h1 className="hero-title pf-hero-title">
          <span className="word w1"><span>BUILDING</span></span>
          <br />
          <span className="word w2"><span className="ital">CATEGORY</span></span>{" "}
          <span className="word w3"><span className="ital">LEADERS</span></span>
          <br />
          <span className="word w4"><span>ACROSS THE</span></span>{" "}
          <span className="word w5"><span>GCC.</span></span>
        </h1>

        <div className="pf-hero-foot">
          <p className="hero-blurb">
            <b>We don&apos;t pitch campaigns.</b> We embed with B2B brands and turn them into
            category leaders. Brand strategy, design, GTM and content — under one roof, in
            lockstep, with ROI at the core.
          </p>
          <div className="pf-hero-ctas">
            <a className="pf-cta primary" href="#featured">
              View case studies <span>↗</span>
            </a>
            <button
              type="button"
              className="pf-cta ghost"
              onClick={() => setReelOpen(true)}
            >
              <span className="play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <polygon points="6,4 20,12 6,20" fill="currentColor" />
                </svg>
              </span>
              Watch showreel
            </button>
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        Scroll <span className="line" /> 01 / 05
      </div>

      {reelOpen && (
        <div
          className="pf-reel-lightbox"
          onClick={(e) => {
            if (e.target.classList.contains("pf-reel-lightbox")) setReelOpen(false);
          }}
        >
          <button
            type="button"
            className="pf-reel-close"
            onClick={() => setReelOpen(false)}
            aria-label="Close showreel"
          >
            <span>CLOSE</span>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" />
              <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <div className="pf-reel-frame-wrap">
            <div className="pf-reel-meta">
              <span>Now playing</span>
              <span>{showreel.title}</span>
            </div>
            <div className="pf-reel-frame">
              <iframe
                src={`https://www.youtube.com/embed/${showreel.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={showreel.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

"use client";
import { useRef } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";

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

export default function V2Hero() {
  const ref = useRef(null);
  useScrollProgress(ref, [{ name: "--progress", start: 0, end: 1 }]);

  return (
    <section ref={ref} className="v2-hero hero" data-section="hero" id="top">
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
        <div className="v2-hero-chip-row">
          <span className="v2-chip">
            <span className="x">×</span> Our Portfolio
          </span>
        </div>

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

        <h1 className="hero-title v2-hero-title">
          <span className="word w1"><span>BUILDING</span></span>
          <br />
          <span className="word w2"><span className="ital">CATEGORY</span></span>{" "}
          <span className="word w3"><span className="ital">LEADERS</span></span>
          <br />
          <span className="word w4"><span>ACROSS THE</span></span>{" "}
          <span className="word w5"><span>GCC.</span></span>
        </h1>

        <div className="v2-hero-foot">
          <p className="hero-blurb">
            <b>We don&apos;t pitch campaigns.</b> We embed with B2B brands and turn them into
            category leaders. Brand strategy, design, GTM and content — under one roof,
            in lockstep, with ROI at the core.
          </p>
          <div className="v2-hero-ctas">
            <a className="v2-cta primary" href="#featured">
              View case studies <span>↗</span>
            </a>
            <a className="v2-cta ghost" href="#close">
              Start a project <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        Scroll <span className="line" /> 01 / 06
      </div>
    </section>
  );
}

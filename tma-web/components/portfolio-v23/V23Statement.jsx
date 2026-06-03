"use client";
import { useEffect, useRef, useState } from "react";
import { STATEMENT } from "./projects";
import { useLineReveal } from "./useV23Reveal";

export default function V23Statement() {
  const [open, setOpen] = useState(false);
  const leadRef = useRef(null);
  const moreRef = useRef(null);
  const panelVidRef = useRef(null);
  useLineReveal(leadRef, { start: "top 88%" });

  // play the studio-motion panel video only while it's on screen
  useEffect(() => {
    const v = panelVidRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([en]) => { if (en.isIntersecting) v.play?.().catch(() => {}); else v.pause?.(); },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // animate the detail panel height (CSS can't transition to auto)
    const panel = moreRef.current;
    if (panel) panel.style.height = next ? `${panel.scrollHeight}px` : "0px";
    // tell the work grid to reflow (Clim's .el-A behaviour)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("v23:info", { detail: { open: next } }));
    }
  };

  return (
    <section
      className={`v23-section v23-statement${open ? " is-open" : ""}`}
      data-v23-section="statement"
    >
      <div className="v23-grid">
        <p className="v23-eyebrow">{STATEMENT.eyebrow}</p>
        <div className="v23-statement-row">
          <div>
            <p ref={leadRef} className="v23-statement-lead v23-rv">
              {STATEMENT.lead}
            </p>
            <div className="v23-statement-more" ref={moreRef}>
              <p>{STATEMENT.more}</p>
            </div>
            <button
              type="button"
              className="v23-more-bt"
              data-magnetic
              data-cursor="blob"
              aria-expanded={open}
              onClick={toggle}
            >
              <span className="v23-more-ic" aria-hidden="true" />
              {open ? "Less information" : "More information"}
            </button>
          </div>

          <div className="v23-panel" data-cursor="blob" aria-hidden="true">
            <video
              ref={panelVidRef}
              className="v23-panel-media"
              src="/assets/v23/studio-motion.mp4"
              poster="/assets/v23/studio-motion.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

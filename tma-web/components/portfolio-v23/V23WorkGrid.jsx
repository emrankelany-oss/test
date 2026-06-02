"use client";
import { useEffect, useRef } from "react";
import { WORK_GRID } from "./projects";
import { useIrisRevealAll, useLazyAutoplayVideos } from "./useV23Reveal";

export default function V23WorkGrid() {
  const rootRef = useRef(null);
  const elsRef = useRef(null);
  useIrisRevealAll(rootRef, ".v23-im");
  useLazyAutoplayVideos(rootRef);

  // reflow when the statement's "More information" opens (Clim's .el-A)
  useEffect(() => {
    const els = elsRef.current;
    if (!els) return;
    const onInfo = (e) => els.classList.toggle("is-open", !!e.detail?.open);
    window.addEventListener("v23:info", onInfo);
    return () => window.removeEventListener("v23:info", onInfo);
  }, []);

  return (
    <section className="v23-section v23-work" ref={rootRef} data-v23-section="work">
      <div className="v23-grid">
        <p className="v23-eyebrow v23-work-kicker">Selected Work — {WORK_GRID.length} Projects</p>
        <div className="v23-els" ref={elsRef}>
          {WORK_GRID.map((cell, i) => {
            const p = cell.project;
            return (
              <article
                key={p.slug}
                className={`v23-el v23-el-${cell.span}`}
                data-cursor="blob"
              >
                <div className="v23-el-media" style={{ aspectRatio: cell.ratio }}>
                  <span className="v23-im">
                    {p.video ? (
                      <video
                        data-lazy
                        data-src={p.video}
                        poster={p.hero || p.thumb}
                        muted
                        loop
                        playsInline
                        preload="none"
                        aria-hidden="true"
                      />
                    ) : (
                      <img src={p.hero || p.thumb} alt={`${p.client} — ${p.title}`} loading="lazy" />
                    )}
                  </span>
                </div>
                <div className="v23-el-cap">
                  <span className="t">{p.client} — {p.title}</span>
                  <span className="c">{p.category}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

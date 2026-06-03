"use client";
import { useEffect, useRef } from "react";
import { WORK_GRID, deckFit } from "./projects";
import { useIrisRevealAll, useLazyAutoplayVideos } from "./useV23Reveal";
import { openProject } from "./useV23ProjectModal";

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
            const fit = deckFit(p.slug);
            return (
              <article key={p.slug} className={`v23-el v23-el-${cell.span}`}>
                <button
                  type="button"
                  className={`v23-el-media v23-el-open${fit ? " v23-im-contain" : ""}`}
                  style={{ aspectRatio: cell.ratio, ...(fit ? { background: fit } : null) }}
                  onClick={(e) => openProject(p.slug, e.currentTarget)}
                  aria-label={`Open ${p.client} — ${p.title}`}
                  data-cursor="blob"
                  data-cursor-label="View"
                >
                  <span className="v23-im">
                    <span className="v23-im-h">
                      {p.video ? (
                        <video data-lazy data-src={p.video} poster={p.hero || p.thumb} muted loop playsInline preload="none" aria-hidden="true" />
                      ) : (
                        <img src={cell.image} alt={`${p.client} — ${p.title}`} loading="lazy" />
                      )}
                    </span>
                    {!deckFit(p.slug) && (
                      <span className="v23-im-hv" aria-hidden="true">
                        {p.video ? (
                          <video data-lazy data-src={p.video} poster={p.hero || p.thumb} muted loop playsInline preload="none" aria-hidden="true" />
                        ) : (
                          <img src={cell.image} alt="" loading="lazy" />
                        )}
                      </span>
                    )}
                  </span>
                  <span className="v23-el-scrim" aria-hidden="true" />
                  <span className="v23-el-cta" aria-hidden="true">
                    <span className="v23-el-cta-t">View project</span>
                    <span className="v23-el-cta-arw">→</span>
                  </span>
                </button>
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

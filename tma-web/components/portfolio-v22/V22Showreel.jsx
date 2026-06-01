"use client";
import { useEffect, useRef, useState } from "react";
import { SHOWREEL } from "./showreel";
import { openProject } from "./useProjectModal";
import { openFilm } from "./useFilmLightbox";
import { useOrbitTimeline } from "./hooks/useOrbitTimeline";

function FilmTile({ film }) {
  const vref = useRef(null);
  const enter = () => { const v = vref.current; if (v && v.play) v.play().catch(() => {}); };
  const leave = () => { const v = vref.current; if (v) v.pause(); };
  return (
    <button
      className="v22-sr-tile"
      data-kind={film.kind}
      data-cursor="view" data-cursor-label="Play"
      onMouseEnter={enter} onMouseLeave={leave}
      onClick={() => openFilm(film)}
    >
      <span className="v22-sr-tile-media">
        {film.kind === "mp4" ? (
          <video ref={vref} src={film.src} poster={film.poster} muted loop playsInline preload="none" />
        ) : (
          <img src={film.poster} alt="" loading="lazy" />
        )}
      </span>
      <span className="v22-sr-tile-meta">
        <span className="v22-eyebrow">{film.group}</span>
        <span className="v22-sr-tile-title">{film.title}</span>
      </span>
    </button>
  );
}

export default function V22Showreel() {
  const sectionRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia("(min-width: 861px)").matches;
    setEnabled(fine && !reduce && wide);
  }, []);

  useOrbitTimeline(sectionRef, { enabled });

  return (
    <section id="v22-featured" ref={sectionRef} className="v22-section v22-showreel" data-mode="static">
      <h2 className="v22-eyebrow">Selected work</h2>
      <div className="v22-sr-stage">
        {SHOWREEL.map((proj) => (
          <div key={proj.slug} className="v22-sr-group" data-slug={proj.slug}>
            <span className="v22-sr-word v22-sr-word-l" aria-hidden="true">{proj.client}</span>
            <span className="v22-sr-word v22-sr-word-r" aria-hidden="true">Gallery</span>
            <button
              className="v22-sr-card"
              data-cursor="view" data-cursor-label="See project"
              onClick={(e) => openProject(proj.slug, e.currentTarget)}
            >
              <span className="v22-sr-card-media"><img src={proj.poster} alt="" /></span>
              <span className="v22-sr-card-label">
                <span className="v22-eyebrow">{proj.client}</span>
                <span className="v22-sr-card-title">{proj.title}</span>
              </span>
            </button>
            <div className="v22-sr-tiles">
              {proj.films.map((f) => <FilmTile key={f.id} film={f} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

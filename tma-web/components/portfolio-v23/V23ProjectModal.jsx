"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PROJECTS_BY_SLUG, projectGallery } from "./projects";
import { useV23ProjectModal } from "./useV23ProjectModal";
import { openFilm } from "./useV23Lightbox";

export default function V23ProjectModal() {
  const { openSlug, close } = useV23ProjectModal();
  const p = openSlug ? PROJECTS_BY_SLUG[openSlug] : null;

  useEffect(() => {
    if (!p) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [p, close]);

  if (!p || typeof document === "undefined") return null;

  const gallery = projectGallery(p);
  const para = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  return createPortal(
    <div className="v23-modal" role="dialog" aria-modal="true" aria-label={`${p.client} — ${p.title}`}>
      <button className="v23-modal-scrim" aria-label="Close" onClick={close} />
      <div className="v23-modal-panel">
        <button className="v23-modal-close" onClick={close} aria-label="Close project">✕</button>

        <header className="v23-modal-head">
          <p className="v23-eyebrow">{p.category}{p.year ? ` · ${p.year}` : ""}</p>
          <h2 className="v23-modal-title">{p.client}</h2>
          <p className="v23-modal-sub">{p.title}{p.tagline ? ` — ${p.tagline}` : ""}</p>
        </header>

        <div className="v23-modal-body">
          <div className="v23-modal-copy">
            <h3 className="v23-modal-h3">What we did</h3>
            {para(p.intro).map((t, i) => <p key={i}>{t}</p>)}

            {p.problem ? (
              <>
                <h3 className="v23-modal-h3">The challenge</h3>
                <ul>{para(p.problem).map((t, i) => <li key={i}>{t}</li>)}</ul>
              </>
            ) : null}
            {p.solution ? (
              <>
                <h3 className="v23-modal-h3">Our solution</h3>
                <ul>{para(p.solution).map((t, i) => <li key={i}>{t}</li>)}</ul>
              </>
            ) : null}

            {p.services?.length ? (
              <>
                <h3 className="v23-modal-h3">Services</h3>
                <ul className="v23-modal-tags">{p.services.map((s) => <li key={s}>{s}</li>)}</ul>
              </>
            ) : null}

            {p.video ? (
              <button
                type="button"
                className="v23-modal-play"
                onClick={() => openFilm({ kind: "video", src: p.video, poster: p.hero || p.thumb, title: p.title, client: p.client })}
              >
                <span className="v23-play" aria-hidden="true" /> Watch the film
              </button>
            ) : null}
          </div>

          <div className="v23-modal-side">
            {p.results?.length ? (
              <ul className="v23-modal-stats">
                {p.results.slice(0, 4).map((r, i) => (
                  <li key={i}><span className="m">{r.metric}</span><span className="l">{r.label}</span></li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {gallery.length ? (
          <div className="v23-modal-gallery">
            {gallery.map((src, i) => (
              <img key={i} src={src} alt={`${p.client} — work ${i + 1}`} loading="lazy" />
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useFilmLightbox } from "./useFilmLightbox";

export default function V22FilmLightbox() {
  const { film, close } = useFilmLightbox();
  useEffect(() => {
    if (!film) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [film, close]);

  if (!film || typeof document === "undefined") return null;
  return createPortal(
    <div className="v22-film" role="dialog" aria-modal="true" aria-label={film.title}>
      <button className="v22-film-scrim" aria-label="Close" onClick={close} />
      <div className="v22-film-frame">
        <button className="v22-film-close" onClick={close} aria-label="Close film">✕</button>
        {film.kind === "youtube" ? (
          <iframe
            className="v22-film-media"
            src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0`}
            title={film.title}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : (
          <video className="v22-film-media" src={film.src} poster={film.poster} controls autoPlay playsInline />
        )}
        <p className="v22-film-title">{film.title}</p>
      </div>
    </div>,
    document.body
  );
}

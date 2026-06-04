"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useV24Lightbox } from "./useV24Lightbox";

export default function V24VideoLightbox() {
  const { film, close } = useV24Lightbox();
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
    <div className="v24-film" role="dialog" aria-modal="true" aria-label={film.title || "Film"}>
      <button className="v24-film-scrim" aria-label="Close" onClick={close} />
      <div className="v24-film-frame">
        <button className="v24-film-close" onClick={close} aria-label="Close film">✕</button>
        {film.kind === "youtube" ? (
          <iframe
            className="v24-film-media"
            src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0`}
            title={film.title || "Film"}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : (
          <video className="v24-film-media" src={film.src} poster={film.poster} controls autoPlay playsInline />
        )}
        {film.title ? (
          <p className="v24-film-title">
            {film.client ? <span className="c">{film.client}</span> : null}
            {film.title}
          </p>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useV24FilmsModal } from "./useV24FilmsModal";
import { openFilm } from "./useV24Lightbox";

const filmOf = (m, client) =>
  m.kind === "youtube"
    ? { kind: "youtube", youtubeId: m.youtubeId, title: m.title, client, poster: m.poster }
    : { kind: "video", src: m.src, poster: m.poster, title: m.title, client };

export default function V24FilmsModal() {
  const { data, close } = useV24FilmsModal();
  useEffect(() => {
    if (!data) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [data, close]);

  if (!data || typeof document === "undefined") return null;
  const kpis = data.results?.slice(0, 4) || [];

  return createPortal(
    <div className="v24-films" role="dialog" aria-modal="true" aria-label={`${data.client} — all films`}>
      <button className="v24-films-scrim" aria-label="Close" onClick={close} />
      <div className="v24-films-frame" data-lenis-prevent>
        <header className="v24-films-head">
          <div>
            <p className="v24-eyebrow">{data.client} — Case Study</p>
            <h2 className="v24-films-title">{data.title}</h2>
          </div>
          <button className="v24-films-close" onClick={close} aria-label="Close">✕</button>
        </header>

        {(data.intro || kpis.length) ? (
          <div className="v24-films-summary">
            {data.intro ? <p className="v24-films-intro">{data.intro}</p> : <span />}
            {kpis.length ? (
              <dl className="v24-films-kpis">
                {kpis.map((r, i) => (
                  <div key={i}><dd className="m">{r.metric}</dd><dt className="l">{r.label}</dt></div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : null}

        <h3 className="v24-films-subhead">{data.media.length} films in this case</h3>
        <div className="v24-films-grid">
          {data.media.map((m, i) => (
            <button
              key={i}
              type="button"
              className="v24-films-tile v24-im-play"
              onClick={() => openFilm(filmOf(m, data.client))}
              aria-label={`Play ${data.client} — ${m.title}`}
            >
              <span className="v24-films-thumb" style={{ aspectRatio: "16 / 9" }}>
                {m.kind === "youtube" ? (
                  <img src={m.poster} alt={`${data.client} — ${m.title}`} loading="lazy" />
                ) : (
                  <video src={m.src} poster={m.poster} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
                )}
                <span className="v24-play" aria-hidden="true" />
              </span>
              <span className="v24-films-cap">
                {m.group ? <span className="v24-films-group">{m.group}</span> : null}
                <span className="v24-films-ftitle">{m.title}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

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
  const solution = data.solution && data.solution.length ? data.solution : (data.intro ? [data.intro] : []);
  const whatWeDid = (i) => (solution.length ? solution[i % solution.length] : "");

  return createPortal(
    <div className="v24-films" role="dialog" aria-modal="true" aria-label={`${data.client} — all films`}>
      <button className="v24-films-scrim" aria-label="Close" onClick={close} />
      <div className="v24-films-frame">
        <header className="v24-films-head">
          <div>
            <p className="v24-eyebrow">{data.client} — Case Study</p>
            <h2 className="v24-films-title">{data.title}</h2>
          </div>
          <button className="v24-films-close" onClick={close} aria-label="Close">✕</button>
        </header>
        <div className="v24-films-list">
          {data.media.map((m, i) => (
            <article key={i} className={`v24-films-row${i % 2 === 1 ? " alt" : ""}`}>
              <button
                type="button"
                className="v24-films-media v24-im-play"
                style={{ aspectRatio: "16 / 9" }}
                onClick={() => openFilm(filmOf(m, data.client))}
                aria-label={`Play ${data.client} — ${m.title}`}
              >
                {m.kind === "youtube" ? (
                  <img src={m.poster} alt={`${data.client} — ${m.title}`} loading="lazy" />
                ) : (
                  <video src={m.src} poster={m.poster} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
                )}
                <span className="v24-play" aria-hidden="true" />
              </button>
              <div className="v24-films-info">
                <span className="v24-films-group">{m.group}</span>
                <h3 className="v24-films-ftitle">{m.title}</h3>
                {whatWeDid(i) ? <p className="v24-films-desc">{whatWeDid(i)}</p> : null}
                {data.results?.length ? (
                  <dl className="v24-films-stats">
                    {data.results.slice(0, 4).map((r, k) => (
                      <div key={k}><dd className="m">{r.metric}</dd><dt className="l">{r.label}</dt></div>
                    ))}
                  </dl>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

"use client";
import { useEffect, useRef } from "react";
import { FEATURED } from "./data";
import { useV24Reveal } from "./useV24Reveal";
import { openFilm } from "./useV24Lightbox";
import { openFilms } from "./useV24FilmsModal";

const filmOf = (m, client) =>
  m.kind === "youtube"
    ? { kind: "youtube", youtubeId: m.youtubeId, title: m.title, client, poster: m.poster }
    : { kind: "video", src: m.src, poster: m.poster, title: m.title, client };

// One italic accent word per featured case (the home/brand "MEETS" treatment).
const ACCENT = { "foodics-boundless": "next", "zid-ripple": "era" };

// Wrap a single word in the title with the italic accent, keep the rest plain.
function withAccent(text, word) {
  if (!word) return text;
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return text;
  return [
    text.slice(0, i),
    <em key="ital" className="v24-ital">{text.slice(i, i + word.length)}</em>,
    text.slice(i + word.length),
  ];
}

function FilmCell({ m, client, lead = false }) {
  const vidRef = useRef(null);
  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <button
      type="button"
      className="v24-im v24-im-play"
      style={{ aspectRatio: lead ? "16 / 9" : (m.ratio || "4 / 5") }}
      onClick={() => openFilm(filmOf(m, client))}
      aria-label={`Play ${client} — ${m.title}`}
      data-cursor="blob"
      data-cursor-label="Play"
    >
      {m.kind === "youtube" ? (
        <img src={m.poster} alt={`${client} — ${m.title}`} loading="lazy" />
      ) : (
        <video ref={vidRef} src={m.src} poster={m.poster} muted loop playsInline preload="metadata" aria-hidden="true" />
      )}
      <span className="v24-play" aria-hidden="true" />
    </button>
  );
}

function FeaturedBlock({ data }) {
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  useV24Reveal(titleRef, { start: "top 90%", end: "top 62%" });
  useV24Reveal(gridRef, { start: "top 88%", end: "top 56%" });

  const leadIndex = Math.max(0, data.media.findIndex((m) => m.kind === "video"));
  const lead = data.media[leadIndex] || data.media[0];

  return (
    <article className="v24-feat" data-v24-featured={data.slug}>
      <header className="v24-feat-head">
        <p className="v24-eyebrow">{data.client} — Featured Case</p>
        <h2 ref={titleRef} className="v24-feat-title v24-rv">{data.title}. {withAccent(data.tagline, ACCENT[data.slug])}.</h2>
      </header>

      <div className="v24-feat-grid v24-rv" ref={gridRef}>
        <div className="v24-feat-media">
          <FilmCell m={lead} client={data.client} lead />
          <div className="v24-el-cap"><span className="t">{lead.title}</span><span className="c">{lead.group}</span></div>
        </div>
        <div className="v24-feat-side">
          {data.intro ? <p className="v24-feat-intro">{data.intro}</p> : null}
          {data.results?.length ? (
            <dl className="v24-feat-stats">
              {data.results.slice(0, 4).map((r, i) => (
                <div key={i}><dd className="m">{r.metric}</dd><dt className="l">{r.label}</dt></div>
              ))}
            </dl>
          ) : null}
          <button type="button" className="v24-more-bt" data-magnetic data-cursor="blob" onClick={() => openFilms(data)}>
            <span className="v24-more-ic" aria-hidden="true" />
            View all {data.media.length} films
          </button>
        </div>
      </div>
    </article>
  );
}

export default function V24Featured() {
  return (
    <div className="v24-section v24-featured" data-v24-section="featured">
      {FEATURED.map((f) => (<FeaturedBlock key={f.slug} data={f} />))}
    </div>
  );
}

"use client";
import { useRef } from "react";
import { FEATURED } from "./projects";
import { useLineReveal, useIrisRevealAll, useLazyAutoplayVideos } from "./useV23Reveal";

function FeaturedBlock({ data }) {
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  useLineReveal(titleRef, { start: "top 85%" });
  useIrisRevealAll(rootRef, ".v23-im");
  useLazyAutoplayVideos(rootRef);

  return (
    <article className="v23-feat" ref={rootRef} data-v23-featured={data.slug}>
      <header className="v23-feat-head v23-grid">
        <div className="v23-feat-headl">
          <p className="v23-eyebrow">{data.client} — Featured Case</p>
          <h2 ref={titleRef} className="v23-feat-title v23-rv" data-cursor="blob">
            {data.title}. {data.tagline}.
          </h2>
        </div>
        <div className="v23-feat-meta">
          {data.intro ? <p className="v23-feat-intro">{data.intro}</p> : null}
          {data.results?.length ? (
            <ul className="v23-feat-stats">
              {data.results.slice(0, 4).map((r, i) => (
                <li key={i}>
                  <span className="m">{r.metric}</span>
                  <span className="l">{r.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <div className="v23-grid">
        <div className="v23-els">
          {data.media.map((m, i) => (
            <div
              key={i}
              className={`v23-el v23-el-${m.span}`}
              data-cursor={m.kind === "youtube" ? undefined : "blob"}
            >
              <div className="v23-el-media" style={{ aspectRatio: m.ratio }}>
                {m.kind === "youtube" ? (
                  <a
                    className="v23-im v23-im-play"
                    href={m.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Watch ${data.client} — ${m.title}`}
                    data-cursor="blob"
                    data-cursor-label="Watch"
                  >
                    <img src={m.poster} alt={`${data.client} — ${m.title}`} loading="lazy" />
                    <span className="v23-play" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="v23-im">
                    <video
                      data-lazy
                      data-src={m.src}
                      poster={m.poster}
                      muted
                      loop
                      playsInline
                      preload="none"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </div>
              <div className="v23-el-cap">
                <span className="t">{m.title}</span>
                <span className="c">{m.group}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function V23Featured() {
  if (!FEATURED.length) return null;
  return (
    <section className="v23-section v23-featured" data-v23-section="featured">
      <div className="v23-grid">
        <p className="v23-eyebrow v23-featured-kicker">Featured Work</p>
      </div>
      {FEATURED.map((data) => (
        <FeaturedBlock key={data.slug} data={data} />
      ))}
    </section>
  );
}

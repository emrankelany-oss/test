"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FEATURED } from "./projects";
import { useLineReveal, useIrisReveal, useLazyAutoplayVideos } from "./useV23Reveal";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

function MediaCell({ m, client, lazy = true }) {
  if (m.kind === "youtube") {
    return (
      <div className="v23-el-media" style={{ aspectRatio: m.ratio }}>
        <a
          className="v23-im v23-im-play"
          href={m.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Watch ${client} — ${m.title}`}
          data-cursor="blob"
          data-cursor-label="Watch"
        >
          <img src={m.poster} alt={`${client} — ${m.title}`} loading="lazy" />
          <span className="v23-play" aria-hidden="true" />
        </a>
      </div>
    );
  }
  return (
    <div className="v23-el-media" style={{ aspectRatio: m.ratio }}>
      <span className="v23-im">
        <video
          {...(lazy ? { "data-lazy": true, "data-src": m.src, preload: "none" } : { src: m.src, autoPlay: true, preload: "metadata" })}
          poster={m.poster}
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      </span>
    </div>
  );
}

function FeaturedBlock({ data }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const leadRef = useRef(null);
  const restRef = useRef(null);

  // lead = the first real film (autoplay video if present, else first item)
  const leadIndex = Math.max(0, data.media.findIndex((m) => m.kind === "video"));
  const lead = data.media[leadIndex] || data.media[0];
  const rest = data.media.filter((_, i) => i !== leadIndex);

  useLineReveal(titleRef, { start: "top 85%" });
  useIrisReveal(leadRef, { start: "top 88%" });
  useLazyAutoplayVideos(rootRef);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    const panel = restRef.current;
    if (panel) {
      if (next) {
        panel.style.height = `${panel.scrollHeight}px`;
        // iris-open the revealed media in a soft cascade
        const ims = panel.querySelectorAll(".v23-im");
        gsap.fromTo(
          ims,
          { "--mask": "0%" },
          { "--mask": "75%", duration: 0.9, ease: "power3.out", stagger: 0.08 }
        );
        // let the panel settle to auto height, then sync ScrollTrigger/Lenis
        const onEnd = () => {
          panel.style.height = "auto";
          ScrollTrigger.refresh();
          panel.removeEventListener("transitionend", onEnd);
        };
        panel.addEventListener("transitionend", onEnd);
      } else {
        panel.style.height = `${panel.scrollHeight}px`;
        requestAnimationFrame(() => {
          panel.style.height = "0px";
        });
        ScrollTrigger.refresh();
      }
    }
  };

  return (
    <article
      className={`v23-feat${open ? " is-open" : ""}`}
      ref={rootRef}
      data-v23-featured={data.slug}
    >
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

      {/* single lead film */}
      <div className="v23-grid">
        <div className="v23-feat-lead">
          <div className="v23-el v23-el-1">
            <MediaCellLead m={lead} client={data.client} mediaRef={leadRef} />
            <div className="v23-el-cap">
              <span className="t">{lead.title}</span>
              <span className="c">{lead.group}</span>
            </div>
          </div>
        </div>

        {rest.length ? (
          <>
            <button
              type="button"
              className="v23-more-bt v23-feat-more"
              data-magnetic
              data-cursor="blob"
              aria-expanded={open}
              onClick={toggle}
            >
              <span className="v23-more-ic" aria-hidden="true" />
              {open ? "Hide films" : `View all ${data.media.length} films`}
            </button>

            <div className="v23-feat-rest" ref={restRef} aria-hidden={!open}>
              <div className="v23-els">
                {rest.map((m, i) => (
                  <div
                    key={i}
                    className={`v23-el v23-el-${m.span}`}
                    data-cursor={m.kind === "youtube" ? undefined : "blob"}
                  >
                    <MediaCell m={m} client={data.client} />
                    <div className="v23-el-cap">
                      <span className="t">{m.title}</span>
                      <span className="c">{m.group}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}

// Lead cell renders eagerly (autoplay) and exposes the iris ref on its .v23-im.
function MediaCellLead({ m, client, mediaRef }) {
  if (m.kind === "youtube") {
    return (
      <div className="v23-el-media v23-feat-lead-media" style={{ aspectRatio: "16 / 9" }}>
        <a
          ref={mediaRef}
          className="v23-im v23-im-play"
          href={m.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Watch ${client} — ${m.title}`}
          data-cursor="blob"
          data-cursor-label="Watch"
        >
          <img src={m.poster} alt={`${client} — ${m.title}`} />
          <span className="v23-play" aria-hidden="true" />
        </a>
      </div>
    );
  }
  return (
    <div className="v23-el-media v23-feat-lead-media" style={{ aspectRatio: "16 / 9" }}>
      <span ref={mediaRef} className="v23-im">
        <video src={m.src} poster={m.poster} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
      </span>
    </div>
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

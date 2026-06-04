"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FEATURED } from "./data";
import { useV24Reveal } from "./useV24Reveal";
import { openFilm } from "./useV24Lightbox";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const filmOf = (m, client) =>
  m.kind === "youtube"
    ? { kind: "youtube", youtubeId: m.youtubeId, title: m.title, client, poster: m.poster }
    : { kind: "video", src: m.src, poster: m.poster, title: m.title, client };

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
      style={{ aspectRatio: m.ratio || (lead ? "16 / 9" : "4 / 5") }}
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
  const [open, setOpen] = useState(false);
  const titleRef = useRef(null);
  const leadRef = useRef(null);
  const restRef = useRef(null);
  useV24Reveal(titleRef, { start: "top 90%", end: "top 62%" });
  useV24Reveal(leadRef, { start: "top 88%", end: "top 58%" });

  const leadIndex = Math.max(0, data.media.findIndex((m) => m.kind === "video"));
  const lead = data.media[leadIndex] || data.media[0];
  const rest = data.media.filter((_, i) => i !== leadIndex);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    const panel = restRef.current;
    if (!panel) return;
    if (next) {
      panel.style.height = `${panel.scrollHeight}px`;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        const ims = panel.querySelectorAll(".v24-im");
        gsap.fromTo(ims, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out", stagger: 0.08 });
      }
      const onEnd = (e) => {
        if (e.target !== panel || e.propertyName !== "height") return;
        panel.style.height = "auto";
        ScrollTrigger.refresh();
        panel.removeEventListener("transitionend", onEnd);
      };
      panel.addEventListener("transitionend", onEnd);
    } else {
      panel.style.height = `${panel.scrollHeight}px`;
      requestAnimationFrame(() => { panel.style.height = "0px"; });
      ScrollTrigger.refresh();
    }
  };

  return (
    <article className={`v24-feat${open ? " is-open" : ""}`} data-v24-featured={data.slug}>
      <header className="v24-feat-head">
        <div className="v24-feat-headl">
          <p className="v24-eyebrow">{data.client} — Featured Case</p>
          <h2 ref={titleRef} className="v24-feat-title v24-rv">
            {data.title}. {data.tagline}.
          </h2>
        </div>
        <div className="v24-feat-meta">
          {data.intro ? <p className="v24-feat-intro">{data.intro}</p> : null}
          {data.results?.length ? (
            <ul className="v24-feat-stats">
              {data.results.slice(0, 4).map((r, i) => (
                <li key={i}><span className="m">{r.metric}</span><span className="l">{r.label}</span></li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <div className="v24-feat-lead v24-rv" ref={leadRef}>
        <FilmCell m={lead} client={data.client} lead />
        <div className="v24-el-cap"><span className="t">{lead.title}</span><span className="c">{lead.group}</span></div>
      </div>

      {rest.length ? (
        <>
          <button type="button" className="v24-more-bt" data-magnetic data-cursor="blob" aria-expanded={open} onClick={toggle}>
            <span className="v24-more-ic" aria-hidden="true" />
            {open ? "Hide films" : `View all ${data.media.length} films`}
          </button>
          <div className="v24-feat-rest" ref={restRef} aria-hidden={!open}>
            <div className="v24-els">
              {rest.map((m, i) => (
                <div key={i} className={`v24-el v24-el-${m.span || 2}`}>
                  <FilmCell m={m} client={data.client} />
                  <div className="v24-el-cap"><span className="t">{m.title}</span><span className="c">{m.group}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
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

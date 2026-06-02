"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { CAROUSEL } from "./projects";
import { openFilm } from "./useV23Lightbox";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

export default function V23Carousel() {
  const trackRef = useRef(null);
  const proxyRef = useRef(null);

  // duplicate the set so the loop wraps seamlessly
  const items = [...CAROUSEL, ...CAROUSEL];

  useEffect(() => {
    const track = trackRef.current;
    const proxy = proxyRef.current;
    if (!track || !proxy) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // play card videos on mount (they're light thumbnails)
    const playVids = () =>
      track.querySelectorAll("video").forEach((v) => v.play?.().catch(() => {}));
    playVids();

    if (reduce) {
      // static: let it scroll natively
      track.style.overflowX = "auto";
      track.dataset.v23Drag = "static";
      return;
    }

    let half = track.scrollWidth / 2;
    const wrapX = gsap.utils.wrap(-half, 0);
    const render = (x) => gsap.set(track, { x: wrapX(x) });

    const drag = Draggable.create(proxy, {
      type: "x",
      trigger: track,
      inertia: true,
      allowContextMenu: true,
      onPress() {
        document.documentElement.classList.add("v23-dragging");
      },
      onRelease() {
        document.documentElement.classList.remove("v23-dragging");
      },
      onDrag() {
        render(this.x);
      },
      onThrowUpdate() {
        render(this.x);
      },
    })[0];

    track.dataset.v23Drag = "ready";

    const onResize = () => {
      half = track.scrollWidth / 2;
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      document.documentElement.classList.remove("v23-dragging");
      drag && drag.kill();
    };
  }, []);

  return (
    <section className="v23-section v23-related" data-v23-section="related">
      <div className="v23-related-head">
        <h2 className="v23-related-title">More Work</h2>
        <div className="v23-drg" aria-hidden="true">
          <span>Drag<i /></span>
        </div>
      </div>

      {/* off-DOM-flow proxy that Draggable tracks */}
      <div ref={proxyRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none" }} />

      <div className="v23-track" ref={trackRef} data-cursor="drag" data-cursor-label="Drag">
        {items.map((p, i) => (
          <button
            type="button"
            key={`${p.slug}-${i}`}
            className="v23-card"
            aria-label={`Play ${p.client} — ${p.title}`}
            onClick={() => {
              if (document.documentElement.classList.contains("v23-dragging")) return;
              if (p.video) openFilm({ kind: "video", src: p.video, poster: p.hero || p.thumb, title: p.title, client: p.client });
            }}
          >
            <div className="v23-card-media">
              {p.video ? (
                <>
                  <video src={p.video} poster={p.hero || p.thumb} muted loop playsInline preload="metadata" aria-hidden="true" />
                  <span className="v23-play" aria-hidden="true" />
                </>
              ) : (
                <img src={p.hero || p.thumb} alt="" loading="lazy" />
              )}
            </div>
            <div className="v23-card-meta">
              <span className="t">{p.client}</span>
              <span className="c">{p.category}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

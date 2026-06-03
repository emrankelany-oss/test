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
    let pos = 0;
    const render = () => gsap.set(track, { x: wrapX(pos) });

    const SPEED = 150; // px/sec — marquee drift
    const DIR = 1; // +1 = cards travel left → right
    let hovering = false; // pause while a card is hovered
    let visible = true; // pause when the section is off-screen

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
        pos = this.x;
        render();
      },
      onThrowUpdate() {
        pos = this.x;
        render();
      },
    })[0];

    // continuous auto-scroll — paused on hover, while dragging/throwing, or off-screen
    const tick = (time, dt) => {
      if (hovering || !visible || drag.isPressed || drag.isThrowing) return;
      pos += (SPEED * DIR * dt) / 1000;
      gsap.set(proxy, { x: pos }); // keep Draggable in sync so a grab continues seamlessly
      render();
    };
    gsap.ticker.add(tick);

    // pause when hovering any card
    const onOver = (e) => { if (e.target.closest?.(".v23-card")) hovering = true; };
    const onOut = (e) => { const to = e.relatedTarget; if (!to || !to.closest?.(".v23-card")) hovering = false; };
    track.addEventListener("pointerover", onOver);
    track.addEventListener("pointerout", onOut);

    // pause the drift while the section is scrolled out of view
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 });
    io.observe(track);

    track.dataset.v23Drag = "ready";

    const onResize = () => { half = track.scrollWidth / 2; };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      track.removeEventListener("pointerover", onOver);
      track.removeEventListener("pointerout", onOut);
      io.disconnect();
      gsap.ticker.remove(tick);
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

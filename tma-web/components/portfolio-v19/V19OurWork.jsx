"use client";

import { useEffect, useRef } from "react";

/* =====================================================================
   V19 — Our Work
   ---------------------------------------------------------------------
   Part 1: a looping, draggable marquee of important works (one row that
           auto-scrolls; pointer-drag scrubs it and throws with momentum).
   Part 2: a premium grid of the other works, clip/rise revealed on scroll.
   The background filament continues here in a slightly darker blue and
   wipes the "Our" heading word as the line crosses it.
   Real imagery cropped from the agency deck (public/assets/work/*).
   ===================================================================== */

const SLIDER = [
  { img: "/assets/work/foodics-pos.jpg", client: "Foodics", title: "POS Launch Film", tag: "3D / Product" },
  { img: "/assets/work/bk-taste.jpg", client: "Burger King", title: "Taste is King", tag: "Campaign" },
  { img: "/assets/work/lg.jpg", client: "LG", title: "Life's Good", tag: "Brand" },
  { img: "/assets/work/zain.jpg", client: "Zain", title: "Made for You", tag: "Social" },
  { img: "/assets/work/almarai.jpg", client: "Almarai", title: "Quality You Trust", tag: "OOH / Fleet" },
  { img: "/assets/work/sigma-paints.jpg", client: "Sigma Paints", title: "Wild Side of Paints", tag: "Campaign" },
  { img: "/assets/work/mccafe.jpg", client: "McCafé", title: "Everyday Treats", tag: "Campaign" },
];

const GRID = [
  { img: "/assets/work/bae.jpg", client: "BAE Systems", title: "Inspired Work", tag: "Print" },
  { img: "/assets/work/electrolux.jpg", client: "Electrolux", title: "Thinking of You", tag: "Product" },
  { img: "/assets/work/aramco.jpg", client: "Aramco", title: "Brand Mark", tag: "Identity" },
  { img: "/assets/work/batania.jpg", client: "Batania", title: "Pure by Nature", tag: "Campaign" },
  { img: "/assets/work/bk-drivethru.jpg", client: "Burger King", title: "5-Minute Drive Thru", tag: "Campaign" },
  { img: "/assets/work/tgahwa.jpg", client: "T-GAH-WA", title: "Bedouin Impression", tag: "Packaging" },
];

export default function V19OurWork() {
  return (
    <section className="v19ow">
      <header className="v19ow-header container">
        <span className="v19ow-eyebrow">
          <span className="v19ow-eyebrow-tick" />
          The archive · selected clients
        </span>
        <h2 className="v19ow-title">
          <span className="v19ow-title-word">Our</span> <em>work</em>
        </h2>
        <p className="v19ow-lede">
          Campaigns, identities and films across the GCC — drag the reel, then
          dig into the grid below.
        </p>
      </header>

      <WorkSlider items={SLIDER} />
      <WorkGrid items={GRID} />
    </section>
  );
}

/* ---------- Part 1: looping draggable slider ---------- */
function WorkSlider({ items }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let setWidth = 0; // exact width of one copy (period of the loop)
    let x = 0;
    let vel = 0; // momentum after a drag throw
    let dragging = false;
    let lastX = 0;
    let rafId = 0;
    const AUTO = 0.45; // px/frame idle drift

    const measure = () => {
      // distance from slide[0] to slide[N] = one full copy incl. its trailing
      // gap, so wrapping by it is perfectly seamless.
      const first = track.children[0];
      const mid = track.children[items.length];
      setWidth =
        first && mid
          ? mid.offsetLeft - first.offsetLeft
          : track.scrollWidth / 2;
    };

    const wrap = () => {
      if (setWidth <= 0) return;
      // keep x within (-setWidth, 0] so the duplicated copy hides the seam
      while (x <= -setWidth) x += setWidth;
      while (x > 0) x -= setWidth;
    };

    const tick = () => {
      if (!dragging) {
        x -= AUTO;
        x += vel;
        vel *= 0.92;
        if (Math.abs(vel) < 0.01) vel = 0;
      }
      wrap();
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      rafId = requestAnimationFrame(tick);
    };

    const onDown = (e) => {
      dragging = true;
      vel = 0;
      lastX = e.clientX;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      x += dx;
      vel = dx; // last delta becomes throw velocity
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
      viewport.releasePointerCapture?.(e.pointerId);
    };

    measure();
    if (reduce) {
      // static: no auto-scroll, but dragging still works
      track.style.transform = "translate3d(0,0,0)";
    }
    rafId = requestAnimationFrame(tick);

    viewport.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    return () => {
      cancelAnimationFrame(rafId);
      viewport.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
    };
  }, []);

  // two copies back-to-back for a seamless loop
  const loop = [...items, ...items];

  return (
    <div ref={viewportRef} className="v19ow-slider" aria-label="Selected work reel">
      <ul ref={trackRef} className="v19ow-track">
        {loop.map((it, i) => (
          <li className="v19ow-slide" key={`${it.img}-${i}`} aria-hidden={i >= items.length}>
            <div className="v19ow-slide-media">
              <img src={it.img} alt={`${it.client} — ${it.title}`} draggable="false" loading="lazy" decoding="async" />
              <span className="v19ow-slide-tint" aria-hidden="true" />
            </div>
            <div className="v19ow-slide-info">
              <span className="v19ow-slide-client">{it.client}</span>
              <span className="v19ow-slide-title">{it.title}</span>
              <span className="v19ow-slide-tag">{it.tag}</span>
            </div>
          </li>
        ))}
      </ul>
      <span className="v19ow-drag-hint" aria-hidden="true">↤ drag ↦</span>
    </div>
  );
}

/* ---------- Part 2: scroll-revealed grid ---------- */
function WorkGrid({ items }) {
  const gridRef = useRef(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll(".v19ow-card"));
    if (!cards.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => c.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <ul ref={gridRef} className="v19ow-grid container">
      {items.map((it, i) => (
        <li className="v19ow-card" style={{ "--i": i }} key={it.img}>
          <a className="v19ow-card-link" href="#contact" aria-label={`${it.client} — ${it.title}`}>
            <div className="v19ow-card-media">
              <img src={it.img} alt="" loading="lazy" decoding="async" />
              <span className="v19ow-card-tint" aria-hidden="true" />
              <span className="v19ow-card-tag" aria-hidden="true">{it.tag}</span>
            </div>
            <div className="v19ow-card-info">
              <span className="v19ow-card-client">{it.client}</span>
              <h3 className="v19ow-card-title">{it.title}</h3>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}

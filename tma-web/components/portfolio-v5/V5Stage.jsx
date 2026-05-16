"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import V5Card from "./V5Card";
import { featuredWork } from "@/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CARDS = featuredWork.slice(0, 5);

// Per-card choreography for the deck → cluster fly-in. Different paths so
// the motion feels alive rather than uniform.
const CHOREO = [
  { tx: 0, ty: -10, rot: -4, depth: 0.18, delay: 0.0, ease: "power3.out", overshoot: 0 },
  { tx: -8, ty: 12, rot: 6, depth: 0.06, delay: 0.05, ease: "power2.out", overshoot: 0 },
  { tx: 14, ty: -2, rot: -9, depth: 0.0, delay: 0.04, ease: "power3.out", overshoot: 0 },
  { tx: -4, ty: -14, rot: 4, depth: 0.22, delay: 0.07, ease: "power2.inOut", overshoot: 0 },
  { tx: 6, ty: 8, rot: -2, depth: 0.04, delay: 0.03, ease: "back.out(1.5)", overshoot: 1 },
];

// --- ZoomParallax phase (faithful port of the supplied component) -------
// After the deck lands in the centred cluster, continued scroll scales each
// full-viewport LAYER (not the card) by its own factor around the viewport
// centre — exactly like the source `useTransform(scrollYProgress,[0,1],
// [1,N])`. Centre image (i0) fills the screen; the offset tiles balloon and
// fly past the edges. Source scales[0..4] = [4,5,6,5,6].
const ZOOM_SCALE = [4, 5, 6, 5, 6];
const ZOOM_START = 1.25; // timeline position — safely after the cluster settles
const ZOOM_DUR = 1.1;
// Empty timeline time AFTER the zoom completes. Because ScrollTrigger
// scrub maps the WHOLE timeline across the pin distance, timeline-end ==
// pin-release. This hold makes the full zoom finish well before the end,
// then dwell on the fully-zoomed frame while STILL pinned (the user is
// held "inside" the image) before the pin releases.
const ZOOM_HOLD = 0.9;

export default function V5Stage() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const heroTextRef = useRef(null);
  const gridLabelRef = useRef(null);
  const cardRefs = useRef([]);
  const slotRefs = useRef([]);
  const layerRefs = useRef([]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);
      const slots = slotRefs.current.filter(Boolean);
      const layers = layerRefs.current.filter(Boolean);
      if (
        cards.length !== CARDS.length ||
        slots.length !== CARDS.length ||
        layers.length !== CARDS.length
      )
        return;

      // Deck-state transform RELATIVE to each card's cluster slot, so
      // "progress=1" is identity (card resting in its cluster tile) and
      // "progress=0" places it on the cinematic deck on the right.
      const compute = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const deckAnchorX = vw * 0.74;
        const deckAnchorY = vh * 0.55;

        return cards.map((card, i) => {
          const slot = slots[i];
          const sRect = slot.getBoundingClientRect();
          const naturalCx = sRect.left + sRect.width / 2;
          const naturalCy = sRect.top + sRect.height / 2;
          const stackJitterX = (i - 2.5) * 14;
          const stackJitterY = (i - 2.5) * 10;
          return {
            deckX: deckAnchorX + stackJitterX - naturalCx,
            deckY: deckAnchorY + stackJitterY - naturalCy,
          };
        });
      };

      let measurements = compute();

      // Initial state — cards stacked on the deck, layers un-scaled.
      const placeOnDeck = () => {
        layers.forEach((layer) =>
          gsap.set(layer, { scale: 1, transformOrigin: "50% 50%" })
        );
        cards.forEach((card, i) => {
          const m = measurements[i];
          const ch = CHOREO[i];
          gsap.set(card, {
            x: m.deckX,
            y: m.deckY,
            rotation: ch.rot * 2.2 + (i - 2.5) * 2,
            scale: 0.78 + ch.depth * 0.18,
            transformOrigin: "50% 60%",
            zIndex: 30 + i,
          });
        });
      };

      placeOnDeck();
      gsap.set(heroTextRef.current, { autoAlpha: 1, y: 0 });
      gsap.set(gridLabelRef.current, { autoAlpha: 0, y: 24 });

      sectionRef.current?.classList.add("is-ready");

      if (prefersReducedMotion) {
        // Snap into the cluster, no cinematic, no zoom.
        cards.forEach((card) =>
          gsap.set(card, { x: 0, y: 0, rotation: 0, scale: 1 })
        );
        layers.forEach((layer) => gsap.set(layer, { scale: 1 }));
        gsap.set(heroTextRef.current, { autoAlpha: 1 });
        gsap.set(gridLabelRef.current, { autoAlpha: 1, y: 0 });
        return;
      }

      // Idle float on the deck while it sits in the hero.
      const idleTweens = cards.map((card, i) =>
        gsap.to(card, {
          y: `+=${6 + (i % 3) * 3}`,
          rotation: `+=${(i % 2 === 0 ? 1 : -1) * 1.2}`,
          duration: 4 + (i % 4) * 0.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        })
      );

      // Master pinned timeline: deck → cluster, then ZoomParallax.
      // Pin long enough that the full zoom (timeline ≈ 2.35) completes at
      // ~0.8 of the pin and the last ~20% HOLDS the fully-zoomed frame
      // while still pinned (scrub clamps the timeline at 1), so the user
      // dwells "inside" the image before it releases.
      const isMobile = window.matchMedia("(max-width: 720px)").matches;
      const pinViewports = isMobile ? 6 : 10;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * pinViewports}`,
          pin: pinRef.current,
          pinSpacing: true,
          scrub: 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            measurements = compute();
            placeOnDeck();
          },
        },
      });

      // Hero text fades out across the first part of the transition.
      tl.to(
        heroTextRef.current,
        { autoAlpha: 0, y: -40, ease: "power2.in", duration: 0.55 },
        0
      );

      // Section label fades in once the cluster is mostly settled…
      tl.fromTo(
        gridLabelRef.current,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.4 },
        0.7
      );
      // …then fades back out so the zoom dive is pure image.
      tl.to(
        gridLabelRef.current,
        { autoAlpha: 0, y: -20, ease: "power2.in", duration: 0.3 },
        ZOOM_START
      );

      // Each card flies from the deck into its cluster tile.
      cards.forEach((card, i) => {
        const ch = CHOREO[i];
        tl.to(
          card,
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            ease: ch.ease,
            duration: 0.78,
            overwrite: "auto",
          },
          0.05 + i * 0.045
        );

        if (ch.overshoot) {
          tl.to(card, { y: -10, duration: 0.12, ease: "power1.in" }, 0.05 + i * 0.045 + 0.5);
          tl.to(card, { y: 0, duration: 0.18, ease: "power2.out" }, 0.05 + i * 0.045 + 0.62);
        }

        tl.fromTo(
          card,
          { filter: "brightness(0.78) saturate(0.85)" },
          {
            filter: "brightness(1) saturate(1)",
            ease: "power2.out",
            duration: 0.8,
            overwrite: "auto",
          },
          0.05 + i * 0.045
        );
      });

      // --- ZoomParallax: scale each full-viewport layer by its factor ---
      // (mirrors the source's `style={{ scale }}` on the full-screen
      // motion.div — origin is the viewport centre).
      layers.forEach((layer, i) => {
        tl.set(layer, { zIndex: i === 0 ? 60 : 30 + i }, ZOOM_START);
        tl.to(
          layer,
          {
            scale: ZOOM_SCALE[i],
            ease: i === 0 ? "power2.inOut" : "power2.in",
            duration: ZOOM_DUR,
            overwrite: "auto",
          },
          ZOOM_START
        );
      });

      // Hold the fully-zoomed frame while still pinned (see ZOOM_HOLD).
      tl.to({}, { duration: ZOOM_HOLD }, ZOOM_START + ZOOM_DUR);

      // Kill the idle float when the scroll timeline takes over.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        once: true,
        onEnter: () => idleTweens.forEach((t) => t.progress(0).kill()),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="v5-stage" data-section="v5-stage">
      <div ref={pinRef} className="v5-stage-pin">
        <div className="hero-bg v5-stage-bg" aria-hidden="true">
          <div className="hero-prism">
            <div className="hero-prism-cone hero-prism-cone--blue" />
            <div className="hero-prism-grain" />
          </div>
          <div className="hero-bg-grid" />
        </div>

        <div className="v5-stage-hero" ref={heroTextRef}>
          <div className="container v5-stage-hero-inner">
            <div className="hero-meta v5-hero-meta-row">
              <div className="hero-meta-block">
                <span>EST.</span>
                <span className="v">2019</span>
              </div>
              <div className="hero-meta-block">
                <span>AMMAN</span>
                <span className="v">·</span>
                <span>RIYADH</span>
              </div>
              <div className="hero-meta-block">
                <span>SHOWREEL</span>
                <span className="v">2025</span>
              </div>
            </div>

            <h1 className="hero-title pf-hero-title v5-hero-title">
              <span className="word w1"><span>CASES</span></span>
              <br />
              <span className="word w2"><span className="ital">WORTH</span></span>
              <br />
              <span className="word w3"><span>TELLING.</span></span>
            </h1>
          </div>
        </div>

        <div className="v5-stage-grid-head" ref={gridLabelRef}>
          <div className="container">
            <div className="section-head">
              <div className="num">
                <span className="dot" />Featured work
              </div>
              <div className="meta">2019 — 2025</div>
              <h2>
                Five cases.<br />
                <span className="ital">One throughline.</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Centred cluster — faithful ZoomParallax structure: each card is
            a full-viewport flex-centred LAYER (scaled on scroll) with a
            per-index positioned tile (the card) inside it. */}
        <div className="v5-grid">
          {CARDS.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => (layerRefs.current[i] = el)}
              className="v5-zoom-layer"
            >
              <div
                ref={(el) => (slotRefs.current[i] = el)}
                className="v5-zoom-slot"
                data-slot-index={i}
              >
                <V5Card
                  ref={(el) => (cardRefs.current[i] = el)}
                  item={item}
                  index={i}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

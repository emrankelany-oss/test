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

// Per-card choreography — different paths so the motion feels alive and
// editorial rather than uniform. Values are in viewport units & degrees,
// applied to the deck-state offset from each card's natural grid slot.
const CHOREO = [
  { tx: 0, ty: -10, rot: -4, depth: 0.18, delay: 0.0, ease: "power3.out", overshoot: 0 },
  { tx: -8, ty: 12, rot: 6, depth: 0.06, delay: 0.05, ease: "power2.out", overshoot: 0 },
  { tx: 14, ty: -2, rot: -9, depth: 0.0, delay: 0.04, ease: "power3.out", overshoot: 0 },
  { tx: -4, ty: -14, rot: 4, depth: 0.22, delay: 0.07, ease: "power2.inOut", overshoot: 0 },
  { tx: 6, ty: 8, rot: -2, depth: 0.04, delay: 0.03, ease: "back.out(1.5)", overshoot: 1 },
];

export default function V5Stage() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const heroTextRef = useRef(null);
  const gridLabelRef = useRef(null);
  const cardRefs = useRef([]);
  const slotRefs = useRef([]);

  // useLayoutEffect runs synchronously after DOM mutation, BEFORE paint —
  // so GSAP positions the cards into the deck before the user ever sees
  // the natural grid layout. The previous `mounted` flag delayed this by
  // one render cycle, causing the flash-of-grid-state on reload.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);
      const slots = slotRefs.current.filter(Boolean);
      if (cards.length !== CARDS.length || slots.length !== CARDS.length) return;

      // For each card, compute the deck-state transform RELATIVE to its
      // natural grid slot. That way "progress=1" is identity (the card
      // sits in its grid slot via normal CSS) and "progress=0" places it
      // on the cinematic deck on the right side of the hero.
      const compute = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Anchor for the floating deck — right half of the viewport.
        // The hero title is capped to the left 50%, so the deck owns
        // the right 50% without overlap.
        const deckAnchorX = vw * 0.74;
        const deckAnchorY = vh * 0.55;

        return cards.map((card, i) => {
          const slot = slots[i];
          const sRect = slot.getBoundingClientRect();
          const cRect = card.getBoundingClientRect();

          // Card's natural center in viewport coords (before any transform).
          // Since cards may already be transformed from a previous run,
          // we use the slot's rect — they share the same untransformed
          // position because the card is absolutely positioned inside
          // the slot.
          const naturalCx = sRect.left + sRect.width / 2;
          const naturalCy = sRect.top + sRect.height / 2;

          // Stagger the deck stack a little per card so they feel like a
          // tactile pile rather than a perfect overlay.
          const stackJitterX = (i - 2.5) * 14;
          const stackJitterY = (i - 2.5) * 10;

          const deckX = deckAnchorX + stackJitterX - naturalCx;
          const deckY = deckAnchorY + stackJitterY - naturalCy;

          return {
            deckX,
            deckY,
            cardWidth: cRect.width,
          };
        });
      };

      let measurements = compute();

      // Initial state — cards on the deck.
      const placeOnDeck = () => {
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

      // Reveal the stage now that cards + grid label are positioned. This
      // sits BEFORE the reduced-motion early return so both paths reveal.
      sectionRef.current?.classList.add("is-ready");

      if (prefersReducedMotion) {
        // Skip the cinematic — snap into grid layout immediately.
        cards.forEach((card) => {
          gsap.set(card, {
            x: 0, y: 0, rotation: 0, scale: 1,
          });
        });
        gsap.set(heroTextRef.current, { autoAlpha: 1 });
        gsap.set(gridLabelRef.current, { autoAlpha: 1, y: 0 });
        return;
      }

      // Idle float — slow vertical drift on every card so the deck feels
      // alive while sitting in the hero. Yoyo'd, independent per card.
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

      // Master scroll timeline. Pins the stage and drives every card from
      // deck-state to natural grid position over the full pin distance.
      const isMobile = window.matchMedia("(max-width: 720px)").matches;
      const pinViewports = isMobile ? 2.5 : 4;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          // 4 viewports of scroll on desktop, 2.5 on mobile — long enough
          // to feel cinematic, not so long the user gets bored.
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

      // Hero text fades out across the first 55% of the transition.
      tl.to(
        heroTextRef.current,
        { autoAlpha: 0, y: -40, ease: "power2.in", duration: 0.55 },
        0
      );

      // Featured-section label fades in once cards are mostly settled.
      tl.fromTo(
        gridLabelRef.current,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.4 },
        0.7
      );

      // Each card flies from deck to grid, with its own choreography.
      cards.forEach((card, i) => {
        const ch = CHOREO[i];

        // Stop the idle tween's contribution as the scroll-driven motion
        // takes over — kill at the moment scroll progress > 0.04.
        // We achieve this by overwriting the property during the main
        // tween (overwrite: "auto" handles this).
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
          // Stagger start times so cards don't all leave the deck at once.
          0.05 + i * 0.045
        );

        // Card 5 needs an overshoot — extra tween that nudges past the
        // resting point and settles back.
        if (ch.overshoot) {
          tl.to(
            card,
            { y: -10, duration: 0.12, ease: "power1.in" },
            0.05 + i * 0.045 + 0.5
          );
          tl.to(
            card,
            { y: 0, duration: 0.18, ease: "power2.out" },
            0.05 + i * 0.045 + 0.62
          );
        }

        // Subtle parallax depth tilt during the travel — adds 3D feel.
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

      // Cleanup idle tweens when the timeline starts driving the cards.
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
        {/* --- Hero prism background (mirrors home Hero's color treatment).
            Reuses .hero-prism CSS verbatim so the blue cone / warm
            rainbow cone / rim glow / grain match the home hero pixel-
            for-pixel. Scoped to .v5-stage-pin so it stays bounded to
            the pinned hero region and doesn't leak into the grid. */}
        <div className="hero-bg v5-stage-bg" aria-hidden="true">
          <div className="hero-prism">
            <div className="hero-prism-cone hero-prism-cone--blue" />
            <div className="hero-prism-grain" />
          </div>
          <div className="hero-bg-grid" />
        </div>

        {/* --- Hero text layer (left side) — V1 typography & copy ------ */}
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

        {/* --- Featured-section label (revealed at end of transition) -- */}
        {/* Uses the home page's .section-head pattern exactly: border-top
            rule, mono num+dot left, mono meta right, big weight-900
            uppercase H2 below with italic word fade. */}
        <div className="v5-stage-grid-head" ref={gridLabelRef}>
          <div className="container">
            <div className="section-head">
              <div className="num">
                <span className="dot" />Featured work
              </div>
              <div className="meta">2019 — 2025</div>
              <h2>
                Six cases.<br />
                <span className="ital">One throughline.</span>
              </h2>
            </div>
          </div>
        </div>

        {/* --- Grid slots: the cards' natural resting positions -------- */}
        <div className="v5-grid">
          <div className="container v5-grid-inner">
            {CARDS.map((item, i) => (
              <div
                key={item.id}
                ref={(el) => (slotRefs.current[i] = el)}
                className="v5-grid-slot"
                data-slot-index={i}
              >
                <V5Card
                  ref={(el) => (cardRefs.current[i] = el)}
                  item={item}
                  index={i}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

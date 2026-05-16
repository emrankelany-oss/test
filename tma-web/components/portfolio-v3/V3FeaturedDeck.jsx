"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { featuredWork } from "@/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DECK = featuredWork.slice(0, 4);

export default function V3FeaturedDeck() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const cards = cardsRef.current.filter(Boolean);
      const N = cards.length;
      if (!N) return;

      const settleOffsetsX = cards.map((_, i) => (i - (N - 1) / 2) * 18);
      const settleOffsetsY = cards.map((_, i) => (i - (N - 1) / 2) * 14);
      const settleRotation = cards.map((_, i) => (i - (N - 1) / 2) * 3.5);

      if (prefersReducedMotion) {
        cards.forEach((card, i) => {
          gsap.set(card, {
            xPercent: 0,
            yPercent: 0,
            x: settleOffsetsX[i],
            y: settleOffsetsY[i],
            rotation: settleRotation[i],
            opacity: 1,
          });
        });
        return;
      }

      gsap.set(cards, {
        xPercent: 130,
        yPercent: -8,
        rotation: -4,
        opacity: 0,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * N}`,
          pin: stageRef.current,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      cards.forEach((card, i) => {
        tl.to(
          card,
          {
            xPercent: 0,
            yPercent: 0,
            x: settleOffsetsX[i],
            y: settleOffsetsY[i],
            rotation: settleRotation[i],
            opacity: 1,
            ease: "power3.out",
            duration: 1,
          },
          i
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="v3-deck"
      data-section="featured"
      aria-label="Featured work"
    >
      <div ref={stageRef} className="v3-deck-stage">
        <div className="container v3-deck-inner">
          <div className="v3-deck-right">
            <div className="v3-deck-copy">
              <div className="v3-eyebrow">
                <span className="dot" /> 02 / Featured work
              </div>
              <h2 className="v3-deck-title">
                A deck of <span className="ital">cases.</span>
              </h2>
              <p className="v3-deck-sub">
                Four selected projects. Every one shipped, every one measurable.
                Scroll to deal the next card.
              </p>
            </div>

            <div className="v3-deck-pile" aria-label="Featured projects">
              {DECK.map((item, i) => (
                <a
                  key={item.id}
                  href={item.href}
                  ref={(el) => {
                    cardsRef.current[i] = el;
                  }}
                  className="v3-deck-card"
                  style={{ zIndex: 10 + i }}
                  aria-label={`${item.client} — ${item.project}`}
                >
                  <div
                    className="v3-deck-card-img"
                    style={{ backgroundImage: `url("${item.image}")` }}
                    role="img"
                  />
                  <div className="v3-deck-card-shade" aria-hidden="true" />
                  <div className="v3-deck-card-body">
                    <div className="v3-deck-card-top">
                      <span className="v3-deck-card-num">{item.n}</span>
                      <span className="v3-deck-card-kpi">
                        <em>{item.kpi.v}</em>
                        <span>{item.kpi.l}</span>
                      </span>
                    </div>
                    <div className="v3-deck-card-bottom">
                      <span className="v3-deck-card-client">{item.client}</span>
                      <span className="v3-deck-card-title">{item.project}</span>
                      <span className="v3-deck-card-headline">
                        {item.headline}
                      </span>
                      <ul className="v3-deck-card-tags">
                        {item.tags.slice(0, 3).map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="v3-deck-count" aria-hidden="true">
              {DECK.length} featured · scroll
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { galleryItems } from "@/data/portfolio";
import { filmCredits } from "@/data/portfolio-film";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// All gallery items become film "B-roll" cut-aways. We don't filter —
// the b-roll's job is to show breadth (39 items from the studio floor).
const FRAMES = galleryItems;

export default function V6BRoll() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const stripRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      gsap.set([titleRef.current, subtitleRef.current], { autoAlpha: 0, y: 24 });

      if (prefersReducedMotion) {
        gsap.set([titleRef.current, subtitleRef.current], { autoAlpha: 1, y: 0 });
        return;
      }

      const strip = stripRef.current;
      if (!strip) return;

      // Compute how far the strip needs to translate left so the last
      // frame ends roughly aligned with the viewport's right edge.
      const compute = () => {
        const stripWidth = strip.scrollWidth;
        const viewportWidth = window.innerWidth;
        return Math.max(0, stripWidth - viewportWidth + 64);
      };

      let travel = compute();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.4}`,
          pin: pinRef.current,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            travel = compute();
          },
        },
      });

      tl.to([titleRef.current, subtitleRef.current], {
        autoAlpha: 1,
        y: 0,
        ease: "power2.out",
        duration: 0.4,
        stagger: 0.08,
      }, 0);

      // Translate the strip leftward as the user scrolls — film-reel feel.
      tl.to(strip, {
        x: () => -travel,
        ease: "none",
        duration: 1.6,
      }, 0.35);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="v6-broll"
      data-section="v6-broll"
      aria-label="B-roll reel"
    >
      <div ref={pinRef} className="v6-broll-pin">
        <header className="v6-broll-header">
          <h3 ref={titleRef} className="v6-broll-title">{filmCredits.title}</h3>
          <p ref={subtitleRef} className="v6-broll-subtitle">{filmCredits.subtitle}</p>
        </header>

        <div className="v6-broll-track" aria-hidden="false">
          <div ref={stripRef} className="v6-broll-strip">
            {FRAMES.map((f, i) => (
              <figure
                key={`${f.image}-${i}`}
                className="v6-broll-frame"
                aria-label={`${f.client} — ${f.title}`}
              >
                <div
                  className="v6-broll-frame-img"
                  style={{ backgroundImage: `url("${f.image}")` }}
                />
                <figcaption className="v6-broll-frame-cap">
                  <span className="client">{f.client}</span>
                  <span className="title">{f.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function V6ShortFilm({ short, index = 0 }) {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const posterRef = useRef(null);
  const taglineRef = useRef(null);
  const blurbRef = useRef(null);
  const framesRef = useRef([]);
  const closingRef = useRef(null);
  const paletteRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const frames = framesRef.current.filter(Boolean);

      gsap.set(posterRef.current, { scale: 1.08, filter: "brightness(0.45)" });
      gsap.set([taglineRef.current, blurbRef.current, closingRef.current], {
        autoAlpha: 0,
        y: 30,
      });
      gsap.set(frames, { autoAlpha: 0, y: 50, scale: 0.9 });
      if (paletteRef.current) gsap.set(paletteRef.current, { autoAlpha: 0, y: 20 });

      if (prefersReducedMotion) {
        gsap.set(posterRef.current, { scale: 1, filter: "brightness(0.7)" });
        gsap.set(
          [taglineRef.current, blurbRef.current, closingRef.current, ...frames, paletteRef.current].filter(Boolean),
          { autoAlpha: 1, y: 0, scale: 1 }
        );
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.2}`,
          pin: pinRef.current,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(posterRef.current, {
        scale: 1,
        filter: "brightness(0.7)",
        ease: "power2.out",
        duration: 0.6,
      }, 0);

      tl.to(taglineRef.current, {
        autoAlpha: 1,
        y: 0,
        ease: "power3.out",
        duration: 0.5,
      }, 0.3);

      tl.to(blurbRef.current, {
        autoAlpha: 1,
        y: 0,
        ease: "power2.out",
        duration: 0.4,
      }, 0.55);

      tl.to(frames, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        duration: 0.5,
        stagger: 0.12,
      }, 0.75);

      if (paletteRef.current) {
        tl.to(paletteRef.current, {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
          duration: 0.4,
        }, 1.2);
      }

      tl.to(closingRef.current, {
        autoAlpha: 1,
        y: 0,
        ease: "power2.out",
        duration: 0.5,
      }, 1.55);
    }, sectionRef);

    return () => ctx.revert();
  }, [short]);

  return (
    <section
      ref={sectionRef}
      className="v6-short"
      data-section="v6-short"
      data-short-index={index}
      aria-label={`${short.label} — ${short.client}`}
    >
      <div ref={pinRef} className="v6-short-pin">
        <div
          ref={posterRef}
          className="v6-short-poster"
          style={{ backgroundImage: `url("${short.poster}")` }}
          aria-hidden="true"
        />
        <div className="v6-short-vignette" aria-hidden="true" />

        <div className="v6-short-content">
          <header className="v6-short-header">
            <span className="v6-short-kind">{short.label.toUpperCase()}</span>
            <span className="v6-short-client">{short.client}</span>
            <span className="v6-ep-divider">/</span>
            <span className="v6-short-project">{short.project}</span>
          </header>

          <h3 ref={taglineRef} className="v6-short-tagline">
            {short.tagline}
            {short.taglineEn && (
              <span className="v6-short-tagline-en">{short.taglineEn}</span>
            )}
          </h3>

          <p ref={blurbRef} className="v6-short-blurb">{short.blurb}</p>

          <div className="v6-short-frames">
            {short.frames.map((src, i) => (
              <div
                key={`${src}-${i}`}
                ref={(el) => (framesRef.current[i] = el)}
                className="v6-short-frame"
                style={{ backgroundImage: `url("${src}")` }}
                aria-hidden="true"
              />
            ))}
          </div>

          {short.palette && (
            <div ref={paletteRef} className="v6-short-palette" aria-label="Brand palette">
              {short.palette.map((c) => (
                <span
                  key={c}
                  className="v6-short-swatch"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          )}

          <p ref={closingRef} className="v6-short-closing">{short.closing}</p>
        </div>
      </div>
    </section>
  );
}

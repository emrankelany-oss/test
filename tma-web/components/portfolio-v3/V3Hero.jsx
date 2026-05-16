"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * V3Hero — V1-style typography, plus a word-by-word reveal that fires
 * once on mount. Each word in the title gets wrapped in a clipping
 * outer span and an inner span that animates y: 110% → 0 with stagger.
 */
export default function V3Hero() {
  const titleRef = useRef(null);
  const metaRef = useRef(null);
  const footRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const inners = titleRef.current?.querySelectorAll(".v3-word-inner");
      if (inners?.length) {
        gsap.set(inners, { yPercent: 110 });
        gsap.to(inners, {
          yPercent: 0,
          duration: 1.15,
          ease: "expo.out",
          stagger: 0.08,
          delay: 0.15,
        });
      }
      if (metaRef.current) {
        gsap.fromTo(
          metaRef.current.children,
          { y: 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.06,
            delay: 0.05,
          }
        );
      }
      if (footRef.current) {
        gsap.fromTo(
          footRef.current.children,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.1,
            delay: 0.7,
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="v3-hero" data-section="hero">
      <div className="container v3-hero-inner">
        <div className="v3-hero-meta-top" ref={metaRef}>
          <div className="v3-hero-meta-block">
            <span>EST.</span>
            <span className="v">2019</span>
          </div>
          <div className="v3-hero-meta-block">
            <span>AMMAN</span>
            <span className="v">·</span>
            <span>RIYADH</span>
          </div>
          <div className="v3-hero-meta-block">
            <span>PORTFOLIO</span>
            <span className="v">V3</span>
          </div>
        </div>

        <h1 ref={titleRef} className="v3-hero-title pf-hero-title">
          <span className="v3-word"><span className="v3-word-inner">We</span></span>{" "}
          <span className="v3-word"><span className="v3-word-inner">make</span></span>
          <br />
          <span className="v3-word"><span className="v3-word-inner ital">moments</span></span>
          <br />
          <span className="v3-word"><span className="v3-word-inner">you</span></span>{" "}
          <span className="v3-word"><span className="v3-word-inner">can&apos;t</span></span>{" "}
          <span className="v3-word"><span className="v3-word-inner">scroll</span></span>{" "}
          <span className="v3-word"><span className="v3-word-inner">past.</span></span>
        </h1>

        <div className="v3-hero-foot" ref={footRef}>
          <p className="v3-hero-sub">
            Brand systems, films, and product motion for the GCC&apos;s most
            ambitious teams. Built one frame at a time, then handed to the scroll.
          </p>
          <div className="v3-hero-meta">
            <span>
              <em>30+</em> brands
            </span>
            <span>
              <em>14</em> years
            </span>
            <span>
              <em>1</em> obsession
            </span>
          </div>
        </div>
      </div>
      <div className="v3-hero-scroll-hint" aria-hidden="true">
        <span>scroll</span>
        <div className="v3-hero-scroll-line" />
      </div>
    </section>
  );
}

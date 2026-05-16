"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { filmOpening } from "@/data/portfolio-film";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const formatCounter = (val, suffix) => {
  const rounded = Math.round(val);
  return `${rounded.toLocaleString("en-US")}${suffix || ""}`;
};

export default function V6ColdOpen() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const lineRef = useRef(null);
  const counterBlockRef = useRef(null);
  const counterNumRef = useRef(null);
  const subtitleRef = useRef(null);
  const grainRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const words = lineRef.current?.querySelectorAll(".v6-word") || [];
      const numEl = counterNumRef.current;
      const { from, to, suffix } = filmOpening.counter;

      // Initial state: hidden so the on-mount entry animation runs.
      gsap.set(words, { autoAlpha: 0, y: 36 });
      gsap.set([counterBlockRef.current, subtitleRef.current], { autoAlpha: 0, y: 20 });
      if (numEl) numEl.textContent = formatCounter(from, suffix);
      sectionRef.current?.classList.add("is-ready");

      if (prefersReducedMotion) {
        gsap.set(words, { autoAlpha: 1, y: 0 });
        gsap.set([counterBlockRef.current, subtitleRef.current], { autoAlpha: 1, y: 0 });
        if (numEl) numEl.textContent = formatCounter(to, suffix);
        return;
      }

      // === Auto-play entry on mount — film cold-open opening beat. ===
      const intro = gsap.timeline();
      intro
        .to(words, {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
          duration: 0.65,
          stagger: 0.18,
          delay: 0.3,
        })
        .to(
          counterBlockRef.current,
          { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.45 },
          "-=0.1"
        )
        .to(
          subtitleRef.current,
          { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.4 },
          "-=0.15"
        );

      // Grain shimmer — independent of scroll.
      gsap.to(grainRef.current, {
        opacity: 0.18,
        duration: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // === Scroll timeline — counter scrub + exit fade. ===
      const scrubTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 1.2}`,
          pin: pinRef.current,
          pinSpacing: true,
          scrub: 0.9,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Counter ticks 8K → 32K across the pinned scroll.
      const driver = { val: from };
      scrubTl.to(driver, {
        val: to,
        ease: "power1.inOut",
        duration: 1,
        onUpdate: () => {
          if (numEl) numEl.textContent = formatCounter(driver.val, suffix);
        },
      }, 0);

      // Towards the end of the pin, everything fades out for the title card.
      scrubTl.to(
        [lineRef.current, counterBlockRef.current, subtitleRef.current],
        { autoAlpha: 0, y: -28, ease: "power2.in", duration: 0.5 },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const words = filmOpening.line.split(" ");

  return (
    <section
      ref={sectionRef}
      className="v6-cold-open"
      data-section="v6-cold-open"
      aria-label="Opening sequence"
    >
      <div ref={pinRef} className="v6-cold-pin">
        <div ref={grainRef} className="v6-grain" aria-hidden="true" />
        <div className="v6-cold-inner">
          <p ref={lineRef} className="v6-cold-line">
            {words.map((w, i) => (
              <span key={i}>
                <span className="v6-word">{w}</span>
                {i < words.length - 1 && " "}
              </span>
            ))}
          </p>
          <div ref={counterBlockRef} className="v6-cold-counter">
            <span ref={counterNumRef} className="v6-cold-counter-num">
              {formatCounter(filmOpening.counter.from, filmOpening.counter.suffix)}
            </span>
            <span className="v6-cold-counter-label">restaurants on the platform</span>
          </div>
          <p ref={subtitleRef} className="v6-cold-subtitle">{filmOpening.subtitle}</p>
        </div>
      </div>
    </section>
  );
}

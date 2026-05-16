"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Format a number with optional prefix/suffix and decimals.
const fmt = (val, opts = {}) => {
  const { prefix = "", suffix = "", decimals = 0 } = opts;
  const v = decimals
    ? Number(val).toFixed(decimals)
    : Math.round(val).toLocaleString("en-US");
  return `${prefix}${v}${suffix}`;
};

export default function V6Episode({ episode, index = 0 }) {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);

  const plateRef = useRef(null);
  const headerRef = useRef(null);
  const problemRef = useRef(null);
  const ideaRef = useRef(null);
  const resultRef = useRef(null);

  const problemBulletsRef = useRef([]);
  const ideaParallaxRef = useRef([]);
  const statNumRefs = useRef([]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const problemBullets = problemBulletsRef.current.filter(Boolean);
      const ideaParallax = ideaParallaxRef.current.filter(Boolean);
      const statNums = statNumRefs.current.filter(Boolean);
      const stats = episode.acts.result.stats;

      // Initial state: only the problem act visible (header + plate),
      // others hidden in DOM-order behind it.
      gsap.set(plateRef.current, { filter: "grayscale(1) brightness(0.55) saturate(0.6)" });
      gsap.set(headerRef.current, { autoAlpha: 1, y: 0 });
      gsap.set(problemRef.current, { autoAlpha: 1, y: 0 });
      gsap.set(problemBullets, { autoAlpha: 0, y: 18 });
      gsap.set(ideaRef.current, { autoAlpha: 0, y: 40 });
      gsap.set(ideaParallax, { autoAlpha: 0, y: 60, scale: 0.92 });
      gsap.set(resultRef.current, { autoAlpha: 0, y: 40 });
      gsap.set(statNums, { autoAlpha: 0, y: 30 });

      if (prefersReducedMotion) {
        // Snap to "fully assembled" view: plate in color, all acts visible.
        gsap.set(plateRef.current, { filter: "grayscale(0) brightness(1) saturate(1)" });
        gsap.set([problemBullets, ideaRef.current, ideaParallax, resultRef.current, statNums], {
          autoAlpha: 1,
          y: 0,
          scale: 1,
        });
        statNums.forEach((el, i) => {
          const s = stats[i];
          if (s) el.textContent = fmt(s.to, s);
        });
        return;
      }

      // Set the initial stat values to "from".
      statNums.forEach((el, i) => {
        const s = stats[i];
        if (s) el.textContent = fmt(s.from, s);
      });

      const isMobile = window.matchMedia("(max-width: 720px)").matches;
      const pinViewports = isMobile ? 3.6 : 5.2;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * pinViewports}`,
          pin: pinRef.current,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // === Act I: Problem bullets fade in across first ~22% ===
      tl.to(problemBullets, {
        autoAlpha: 1,
        y: 0,
        ease: "power2.out",
        duration: 0.5,
        stagger: 0.15,
      }, 0);

      // Hold the plate in greyscale during problem act.
      tl.to(plateRef.current, {
        filter: "grayscale(1) brightness(0.55) saturate(0.6)",
        duration: 0.5,
      }, 0);

      // === Transition: greyscale → color, Problem out, Idea in ===
      tl.to(problemRef.current, {
        autoAlpha: 0,
        y: -30,
        ease: "power2.in",
        duration: 0.35,
      }, 0.95);

      tl.to(plateRef.current, {
        filter: "grayscale(0) brightness(1) saturate(1)",
        ease: "power2.inOut",
        duration: 0.6,
      }, 1.05);

      tl.to(ideaRef.current, {
        autoAlpha: 1,
        y: 0,
        ease: "power3.out",
        duration: 0.5,
      }, 1.2);

      tl.to(ideaParallax, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        duration: 0.55,
        stagger: 0.12,
      }, 1.35);

      // Slow parallax drift on idea images during the idea hold.
      ideaParallax.forEach((el, i) => {
        tl.to(el, {
          y: -30 - i * 8,
          ease: "none",
          duration: 0.6,
        }, 1.9);
      });

      // === Transition: Idea out, Result in ===
      tl.to(ideaRef.current, {
        autoAlpha: 0,
        y: -30,
        ease: "power2.in",
        duration: 0.35,
      }, 2.6);

      tl.to(ideaParallax, {
        autoAlpha: 0,
        scale: 1.05,
        ease: "power2.in",
        duration: 0.35,
      }, 2.6);

      tl.to(resultRef.current, {
        autoAlpha: 1,
        y: 0,
        ease: "power3.out",
        duration: 0.5,
      }, 2.8);

      tl.to(statNums, {
        autoAlpha: 1,
        y: 0,
        ease: "power2.out",
        duration: 0.4,
        stagger: 0.12,
      }, 2.9);

      // Animate each stat counter from "from" → "to".
      stats.forEach((s, i) => {
        const el = statNums[i];
        if (!el) return;
        const driver = { val: s.from };
        tl.to(driver, {
          val: s.to,
          ease: "power1.inOut",
          duration: 0.7,
          onUpdate: () => {
            el.textContent = fmt(driver.val, s);
          },
        }, 3.0 + i * 0.12);
      });

      // Hold the result a beat before releasing the pin.
      tl.to({}, { duration: 0.5 }, 3.9);
    }, sectionRef);

    return () => ctx.revert();
  }, [episode]);

  const { problem, idea, result } = episode.acts;
  const stats = result.stats;

  return (
    <section
      ref={sectionRef}
      className="v6-episode"
      data-section="v6-episode"
      data-episode-index={index}
      aria-label={`Episode ${episode.n} — ${episode.client}`}
    >
      <div ref={pinRef} className="v6-episode-pin">
        {/* Background plate — greyscale during problem, color during idea/result. */}
        <div
          ref={plateRef}
          className="v6-episode-plate"
          style={{ backgroundImage: `url("${problem.plate}")` }}
          aria-hidden="true"
        />
        <div className="v6-episode-vignette" aria-hidden="true" />

        <div className="v6-episode-content">
          {/* Persistent header — episode tag stays through all three acts. */}
          <header ref={headerRef} className="v6-episode-header">
            <span className="v6-ep-badge">EP. {episode.n}</span>
            <span className="v6-ep-client">{episode.client}</span>
            <span className="v6-ep-divider">/</span>
            <span className="v6-ep-project">{episode.project}</span>
          </header>

          {/* === Act I: Problem === */}
          <div ref={problemRef} className="v6-act v6-act--problem">
            <span className="v6-act-kicker">{problem.kicker}</span>
            <h3 className="v6-act-quote">{problem.quote}</h3>
            <ul className="v6-bullet-ticker">
              {problem.bullets.map((b, i) => (
                <li
                  key={i}
                  ref={(el) => (problemBulletsRef.current[i] = el)}
                  className="v6-bullet"
                >
                  <span className="v6-bullet-dash">—</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* === Act II: Idea === */}
          <div ref={ideaRef} className="v6-act v6-act--idea">
            <span className="v6-act-kicker">{idea.kicker}</span>
            <h3 className="v6-act-quote">{idea.quote}</h3>
            <ul className="v6-bullet-list">
              {idea.bullets.map((b, i) => (
                <li key={i} className="v6-bullet">
                  <span className="v6-bullet-dash">—</span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="v6-parallax-row" aria-hidden="true">
              {idea.parallax.map((src, i) => (
                <div
                  key={src}
                  ref={(el) => (ideaParallaxRef.current[i] = el)}
                  className="v6-parallax-tile"
                  style={{ backgroundImage: `url("${src}")` }}
                />
              ))}
            </div>
          </div>

          {/* === Act III: Result === */}
          <div ref={resultRef} className="v6-act v6-act--result">
            <span className="v6-act-kicker">{result.kicker}</span>
            <h3 className="v6-act-quote">{result.quote}</h3>
            <div className="v6-stat-grid">
              {stats.map((s, i) => (
                <div key={i} className="v6-stat">
                  <span
                    ref={(el) => (statNumRefs.current[i] = el)}
                    className="v6-stat-num"
                  >
                    {fmt(s.from, s)}
                  </span>
                  <span className="v6-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="v6-act-closing">{result.closing}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

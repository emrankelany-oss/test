"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { filmCredits } from "@/data/portfolio-film";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Logo list pulled from the public assets folder. Keep in sync with the
// home page logo wall. (Source of truth is the deck — see auto-memory.)
const LOGOS = [
  "abu-kass", "alissar", "arab-bank", "aramco", "bank-of-jordan",
  "buffalo-wild-wings", "burger-king", "cairo-amman-bank", "cyberx",
  "electrolux", "flex", "foodics", "invoiceq", "jadwa", "lsc",
  "ministry-economy", "reflect", "salasa", "shaker-group", "sol",
  "webook", "western-union", "zaintech", "zid",
];

export default function V6EndCredits() {
  const sectionRef = useRef(null);
  const rowsRef = useRef([]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const rows = rowsRef.current.filter(Boolean);
      gsap.set(rows, { autoAlpha: 0, y: 26 });

      if (prefersReducedMotion) {
        gsap.set(rows, { autoAlpha: 1, y: 0 });
        return;
      }

      ScrollTrigger.batch(rows, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            ease: "power2.out",
            duration: 0.5,
            stagger: 0.07,
          }),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="v6-credits"
      data-section="v6-credits"
      aria-label="End credits"
    >
      <div className="container v6-credits-inner">
        <header className="v6-credits-head">
          <span className="v6-credits-kicker">END CREDITS</span>
          <h3 className="v6-credits-title">
            Strategy. Design. Production. <span className="ital">By TMA.</span>
          </h3>
        </header>

        <div className="v6-credits-roles">
          {filmCredits.rolesRoll.map((r, i) => (
            <div
              key={r.role}
              ref={(el) => (rowsRef.current[i] = el)}
              className="v6-credits-row"
            >
              <span className="v6-credits-role">{r.role}</span>
              <span className="v6-credits-dots" aria-hidden="true" />
              <span className="v6-credits-by">{r.by}</span>
            </div>
          ))}
        </div>

        <div className="v6-credits-cast">
          <span className="v6-credits-cast-label">FEATURING — IN ORDER OF APPEARANCE</span>
          <div className="v6-credits-cast-grid">
            {LOGOS.map((slug, i) => (
              <div
                key={slug}
                ref={(el) => (rowsRef.current[filmCredits.rolesRoll.length + i] = el)}
                className="v6-credits-logo"
              >
                <img
                  src={`/assets/logos/${slug}.png`}
                  alt={slug.replace(/-/g, " ")}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

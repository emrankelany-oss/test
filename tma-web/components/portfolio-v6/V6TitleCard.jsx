"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { filmTitleCard } from "@/data/portfolio-film";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function V6TitleCard() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const markersRef = useRef([]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const markers = markersRef.current.filter(Boolean);

      if (prefersReducedMotion) {
        gsap.set([titleRef.current, subRef.current, ...markers], {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0 0 0)",
        });
        return;
      }

      gsap.set(titleRef.current, { autoAlpha: 0, y: 40, clipPath: "inset(0 100% 0 0)" });
      gsap.set(subRef.current, { autoAlpha: 0, y: 20 });
      gsap.set(markers, { autoAlpha: 0, x: -40 });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 70%",
        once: true,
        onEnter: () => {
          gsap.to(titleRef.current, {
            autoAlpha: 1,
            y: 0,
            clipPath: "inset(0 0% 0 0)",
            duration: 0.9,
            ease: "power3.out",
          });
          gsap.to(subRef.current, {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.5,
          });
          gsap.to(markers, {
            autoAlpha: 1,
            x: 0,
            duration: 0.45,
            ease: "power2.out",
            stagger: 0.12,
            delay: 0.8,
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="v6-title-card"
      data-section="v6-title-card"
      aria-label="Title card"
    >
      <div className="v6-title-inner">
        <span className="v6-eyebrow">A FILM BY THE MOTION AGENCY</span>
        <h2 ref={titleRef} className="v6-title">
          {filmTitleCard.title}
        </h2>
        <p ref={subRef} className="v6-subtitle">{filmTitleCard.subtitle}</p>

        <ul className="v6-marker-list" aria-label="Episode list">
          {filmTitleCard.markers.map((m, i) => (
            <li
              key={`${m.kind}-${m.n}-${m.label}`}
              ref={(el) => (markersRef.current[i] = el)}
              className={`v6-marker v6-marker--${m.kind.toLowerCase()}`}
            >
              <span className="v6-marker-kind">{m.kind}</span>
              <span className="v6-marker-num">{m.n}</span>
              <span className="v6-marker-label">{m.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

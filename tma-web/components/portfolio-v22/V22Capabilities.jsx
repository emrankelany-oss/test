"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CAPABILITIES } from "./projects";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function V22Capabilities() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll(".v22-cap-card"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => c.classList.add("is-in"));
      return;
    }
    const triggers = cards.map((card) =>
      ScrollTrigger.create({
        trigger: card, start: "top 80%", once: true,
        onEnter: () => card.classList.add("is-in"),
      })
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section ref={rootRef} className="v22-section v22-caps">
      <h2 className="v22-eyebrow">How we work</h2>
      <div className="v22-cap-grid">
        {CAPABILITIES.map((c) => (
          <article key={c.key} className="v22-cap-card" data-skin={c.key}>
            <h3 className="v22-cap-title">{c.title}</h3>
            <p className="v22-cap-body">{c.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

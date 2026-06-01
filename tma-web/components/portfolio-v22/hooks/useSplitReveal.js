"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function useSplitReveal(ref, { by = "chars", stagger = 0.025, start = "top 85%" } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const original = el.textContent;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      return;
    }
    el.setAttribute("aria-label", original);
    el.textContent = "";
    const units = by === "words" ? original.split(/(\s+)/) : Array.from(original);
    const spans = units.map((u) => {
      const span = document.createElement("span");
      span.className = "rv-u";
      span.setAttribute("aria-hidden", "true");
      span.textContent = u === " " ? " " : u;
      el.appendChild(span);
      return span;
    });
    const tween = gsap.from(spans, {
      yPercent: 45, opacity: 0, filter: "blur(12px)", scale: 0.92,
      duration: 0.55, ease: "back.out(1.6)", stagger,
      scrollTrigger: { trigger: el, start, once: true },
      onComplete: () => el.classList.add("is-in"),
    });
    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      el.textContent = original; // restore for HMR / unmount
    };
  }, [ref, by, stagger, start]);
}

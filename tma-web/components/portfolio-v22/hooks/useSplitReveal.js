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
    // Split on whitespace but KEEP whole words together so a word never breaks
    // mid-line. Each word is wrapped in a non-wrapping .rv-w; the actual spaces
    // are emitted as real text nodes so lines still break between words.
    const spans = [];
    original.split(/(\s+)/).forEach((token) => {
      if (token.length === 0) return;
      if (/^\s+$/.test(token)) {
        el.appendChild(document.createTextNode(token));
        return;
      }
      if (by === "words") {
        const span = document.createElement("span");
        span.className = "rv-u";
        span.setAttribute("aria-hidden", "true");
        span.textContent = token;
        el.appendChild(span);
        spans.push(span);
        return;
      }
      const word = document.createElement("span");
      word.className = "rv-w";
      word.setAttribute("aria-hidden", "true");
      Array.from(token).forEach((ch) => {
        const span = document.createElement("span");
        span.className = "rv-u";
        span.textContent = ch;
        word.appendChild(span);
        spans.push(span);
      });
      el.appendChild(word);
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

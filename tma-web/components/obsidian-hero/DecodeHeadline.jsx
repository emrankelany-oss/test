"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+/<>";

export default function DecodeHeadline({ text, className = "", reducedMotion = false }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;
    const spans = Array.from(root.querySelectorAll("[data-ch]"));
    const ctx = gsap.context(() => {
      spans.forEach((span) => {
        const finalCh = span.dataset.ch;
        if (finalCh === " ") return;
        const delay = Math.random() * 0.5;
        const scrambleEnd = delay + 0.35 + Math.random() * 0.35;
        const obj = { t: 0 };
        gsap.to(obj, {
          t: 1,
          duration: scrambleEnd,
          delay,
          ease: "none",
          onUpdate: () => {
            span.textContent =
              obj.t >= 1 ? finalCh : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          },
          onComplete: () => { span.textContent = finalCh; },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [text, reducedMotion]);

  return (
    <h1 ref={rootRef} className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} data-ch={ch} aria-hidden="true">
          {reducedMotion ? ch : ch === " " ? " " : ch}
        </span>
      ))}
    </h1>
  );
}

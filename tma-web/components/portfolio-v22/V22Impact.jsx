"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMPACT } from "./projects";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const fmt = (n, item) => {
  const rounded = item.value % 1 === 0 ? Math.round(n) : n.toFixed(1);
  const withThousands = Number(rounded).toLocaleString("en-US");
  return `${item.prefix}${withThousands}${item.suffix}`;
};

export default function V22Impact() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const valEls = Array.from(root.querySelectorAll(".v22-stat-value"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tweens = [];
    valEls.forEach((el, i) => {
      const item = IMPACT[i];
      if (reduce) { el.textContent = fmt(item.value, item); return; }
      const obj = { n: 0 };
      const tw = gsap.to(obj, {
        n: item.value, duration: 1.4, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate: () => { el.textContent = fmt(obj.n, item); },
        onComplete: () => { el.textContent = fmt(item.value, item); },
      });
      tweens.push(tw);
    });
    return () => tweens.forEach((t) => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
  }, []);

  return (
    <section ref={rootRef} className="v22-section v22-impact">
      <p className="v22-eyebrow">Impact · Foodics case study</p>
      <div className="v22-stat-grid">
        {IMPACT.map((item) => (
          <div key={item.label} className="v22-stat">
            <span className="v22-stat-value">{`${item.prefix}0${item.suffix}`}</span>
            <span className="v22-stat-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

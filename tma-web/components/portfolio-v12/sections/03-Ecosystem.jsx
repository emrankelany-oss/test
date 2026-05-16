"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { services } from "@/data/portfolio-v12.js";

const EcosystemScene = dynamic(() => import("../EcosystemScene.jsx"), { ssr: false });

export default function Ecosystem() {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 820px)").matches;
    if (reduced || small) { setFallback(true); return; }
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShow(true),
      { rootMargin: "200px" }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} aria-label="The Ecosystem" style={{ minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "absolute", top: "6vh", left: "6vw", zIndex: 1 }}>
        <h2 className="v12-h" style={{ fontSize: "clamp(2rem,5vw,4rem)" }}>The Ecosystem</h2>
      </div>
      {fallback ? (
        <ul style={{ display: "grid", gap: "1rem", padding: "20vh 6vw 6vh", listStyle: "none" }}>
          {services.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong>
              <p className="v12-sub">{s.desc}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ position: "absolute", inset: 0 }}>{show && <EcosystemScene />}</div>
      )}
    </section>
  );
}

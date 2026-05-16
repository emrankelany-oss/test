"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function Beat({ kicker, items }) {
  return (
    <div className="v12-beat" style={{ maxWidth: "52ch" }}>
      <span style={{ color: "var(--v12-glow)", letterSpacing: ".2em", fontSize: ".8rem" }}>{kicker}</span>
      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem", display: "grid", gap: ".8rem" }}>
        {items.map((t, i) => (
          <li key={i} className="v12-sub" style={{ maxWidth: "none" }}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function DeepChapter({ data }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const beats = gsap.utils.toArray(".v12-beat", ref.current);
      gsap.set(beats, { opacity: 0, y: 40 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "+=400%", pin: true, scrub: 1 },
      });
      beats.forEach((b) => {
        tl.to(b, { opacity: 1, y: 0, duration: 1 }).to(b, { opacity: 0, y: -40, duration: 1 }, "+=0.5");
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label={`${data.client} case study`} style={{ position: "relative" }}>
      <div className="v12-pin" style={{ position: "relative", justifyContent: "flex-start" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
          <Image src={data.cover} alt={`${data.client} — ${data.project}`} fill style={{ objectFit: "cover" }} sizes="100vw" />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(5,5,6,.7), ${data.wash}55)` }} />
        </div>
        <div style={{ position: "relative" }}>
          <h2 className="v12-h">{data.client}</h2>
          <p className="v12-sub">{data.project}</p>
          <div style={{ position: "relative", marginTop: "2rem", minHeight: "40vh" }}>
            <div className="v12-beat" style={{ position: "absolute", maxWidth: "52ch" }}>
              <p className="v12-sub" style={{ maxWidth: "none" }}>{data.intro}</p>
            </div>
            <div style={{ position: "absolute" }}><Beat kicker="THE CHALLENGE" items={data.challenge} /></div>
            <div style={{ position: "absolute" }}><Beat kicker="THE TRANSFORMATION" items={data.transformation} /></div>
            <div className="v12-beat" style={{ position: "absolute" }}>
              <span style={{ color: "var(--v12-glow)", letterSpacing: ".2em", fontSize: ".8rem" }}>THE IMPACT</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1.5rem", marginTop: "1rem" }}>
                {data.impact.map((k) => (
                  <div key={k.value}>
                    <div className="v12-h" style={{ fontSize: "clamp(2rem,4vw,3.5rem)" }}>{k.value}</div>
                    <div className="v12-sub">{k.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MidChapter({ data }) {
  return (
    <section aria-label={`${data.client}`} style={{ position: "relative", height: "100vh" }}>
      <Image src={data.image} alt={data.client} fill style={{ objectFit: "cover", opacity: 0.5 }} sizes="100vw" />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 6vw 12vh", background: "linear-gradient(180deg, transparent, rgba(5,5,6,.85))" }}>
        <h2 className="v12-h" style={{ fontSize: "clamp(2.5rem,7vw,6rem)" }}>{data.client}</h2>
        <p className="v12-sub" style={{ maxWidth: "44ch" }}>{data.line}</p>
      </div>
    </section>
  );
}

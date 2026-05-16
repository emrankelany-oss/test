"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reel } from "@/data/portfolio-v12.js";

if (typeof window !== "undefined") { gsap.registerPlugin(ScrollTrigger); }

export default function MotionReel() {
  const ref = useRef(null);
  const trackRef = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      const dist = track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: -dist,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: () => `+=${dist}`, pin: true, scrub: 1, invalidateOnRefresh: true },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label="Motion Reel" style={{ overflow: "hidden", height: "100vh" }}>
      <div ref={trackRef} style={{ display: "flex", height: "100vh", alignItems: "center", gap: "2vw", padding: "0 6vw", willChange: "transform" }}>
        <h2 className="v12-h" style={{ flex: "0 0 auto", marginRight: "4vw" }}>The Reel</h2>
        {reel.map((src, i) => (
          <div key={src} style={{ flex: "0 0 60vw", height: "70vh", position: "relative" }}>
            <Image src={src} alt={`Campaign frame ${i + 1}`} fill style={{ objectFit: "cover" }} sizes="60vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

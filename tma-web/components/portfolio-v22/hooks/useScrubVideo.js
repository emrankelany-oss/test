"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// Maps the container's scroll progress onto the video's currentTime.
export function useScrubVideo(videoRef, containerRef) {
  useEffect(() => {
    const v = videoRef.current, c = containerRef.current;
    if (!v || !c || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    v.muted = true;
    v.pause();
    const hasDur = () => Number.isFinite(v.duration) && v.duration > 0;
    const st = ScrollTrigger.create({
      trigger: c, start: "top bottom", end: "bottom top", scrub: true,
      onUpdate: (self) => { if (hasDur()) v.currentTime = self.progress * v.duration; },
    });
    return () => st.kill();
  }, [videoRef, containerRef]);
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SignalCanvas({ progressRef }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const grainRef = useRef(null);
  const targetTimeRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return;

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    let duration = 0;
    let ready = false;

    const onMeta = () => {
      duration = video.duration || 0;
      ready = true;
      video.pause();
    };
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("loadeddata", onMeta);

    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: () => `+=${document.documentElement.scrollHeight - window.innerHeight}`,
      onUpdate: (self) => {
        if (progressRef) progressRef.current = self.progress;
        if (!ready || !duration) return;
        targetTimeRef.current = duration * self.progress;
      },
    });

    const lerp = (a, b, n) => a + (b - a) * n;

    const tick = () => {
      if (ready && duration) {
        const next = lerp(video.currentTime, targetTimeRef.current, 0.18);
        try {
          if (Math.abs(next - video.currentTime) > 1 / 60) {
            video.currentTime = next;
          }
        } catch (e) {
          // ignore seek glitches
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      st.kill();
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("loadeddata", onMeta);
    };
  }, [progressRef]);

  return (
    <div className="v9-canvas" ref={wrapRef} aria-hidden="true">
      <div className="v9-canvas-stage">
        <video
          ref={videoRef}
          className="v9-canvas-video"
          src="/assets/v9/the-signal.mp4"
          muted
          playsInline
          preload="auto"
        />
        <div className="v9-canvas-vignette" />
        <div className="v9-canvas-tint" ref={overlayRef} />
        <div className="v9-canvas-grain" ref={grainRef} />
        <div className="v9-canvas-scanlines" />
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";

/**
 * Chapter divider lifted from slide 8 of the TMA portfolio deck — the
 * "THE MOTION AGENCY INC." wordmark animation that dissolves into a
 * horizontal line, fragments slide along it, and the loop ends inverted
 * (black wordmark on white) before snapping back to white-on-black.
 * Sits between the Featured Work (V5Stage) and Our Work (V5OurWork)
 * sections as a deliberate cinematic pause.
 *
 * Loop: 2.26s, auto-restart with hard color-flip — matches the deck.
 * Source asset: tma-web/public/assets/v5/slide8-loop.{mp4,webm}
 * (converted from a 22 MB GIF; final web payload ~260 KB WebM / 444 KB MP4).
 */
export default function V5ChapterDivider() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = videoRef.current;
    if (!v) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      v.removeAttribute("autoplay");
      v.pause();
      return;
    }

    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    tryPlay();
  }, []);

  return (
    <section
      className="v5-divider"
      data-section="v5-divider"
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className="v5-divider-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/v5/slide8-poster.jpg"
      >
        <source src="/assets/v5/slide8-loop.webm" type="video/webm" />
        <source src="/assets/v5/slide8-loop.mp4" type="video/mp4" />
      </video>
    </section>
  );
}

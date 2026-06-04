"use client";
import { useEffect, useRef } from "react";

// Renders a row's media: autoplay/loop video when one exists, otherwise the
// still image with a slow Ken-Burns. Offscreen videos pause to save resources.
export default function V24Media({ media, title }) {
  const vidRef = useRef(null);

  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [media]);

  if (media.type === "video") {
    return (
      <video
        ref={vidRef}
        poster={media.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
      >
        <source src={media.src} type="video/mp4" />
      </video>
    );
  }
  return <img className="v24-kenburns" src={media.src} alt={title} loading="lazy" />;
}

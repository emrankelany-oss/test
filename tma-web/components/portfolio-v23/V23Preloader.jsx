"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function V23Preloader() {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setMounted(false);
      return;
    }
    document.documentElement.style.overflow = "hidden";
    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = "";
        setMounted(false);
      },
    });
    tl.fromTo(
      el.querySelector(".v23-preloader-mark"),
      { yPercent: 30, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.6, ease: "expo.out" }
    )
      .to(el.querySelector(".v23-preloader-mark"), { opacity: 0, duration: 0.35, ease: "power2.in" }, "+=0.45")
      .to(el, { yPercent: -100, duration: 0.7, ease: "expo.inOut" }, "-=0.1");
    return () => tl.kill();
  }, []);

  if (!mounted) return null;
  return (
    <div className="v23-preloader" ref={ref} aria-hidden="true">
      <span className="v23-preloader-mark">TMA</span>
    </div>
  );
}

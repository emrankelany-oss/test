"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function V22Preloader() {
  const [done, setDone] = useState(false);
  const rootRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const markReady = () => { document.body.classList.add("v22-ready"); setDone(true); };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markReady();
      return;
    }
    const root = rootRef.current, count = countRef.current;
    const obj = { n: 0 };
    const tl = gsap.timeline({ onComplete: markReady });
    tl.to(obj, {
      n: 100, duration: 1.0, ease: "power2.inOut",
      onUpdate: () => { if (count) count.textContent = String(Math.round(obj.n)); },
    });
    tl.to(root, { yPercent: -100, duration: 0.6, ease: "power3.inOut" }, "+=0.1");
    return () => tl.kill();
  }, []);

  if (done) return null;
  return (
    <div ref={rootRef} className="v22-preloader" aria-hidden="true">
      <span className="v22-preloader-mark">the motion agency</span>
      <span ref={countRef} className="v22-preloader-count">0</span>
    </div>
  );
}

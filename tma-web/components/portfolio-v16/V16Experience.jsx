"use client";
import "./v16.css";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import V16Hero from "./V16Hero";
import V16FeaturedPlaceholder from "./V16FeaturedPlaceholder";

// SmoothScroll wires Lenis ↔ GSAP ticker ↔ ScrollTrigger and early-returns
// under prefers-reduced-motion (no Lenis), which is exactly the V16 contract.
export default function V16Experience() {
  return (
    <div className="v16-root" data-v16-root>
      <SmoothScroll />
      <V16Hero />
      <V16FeaturedPlaceholder />
    </div>
  );
}

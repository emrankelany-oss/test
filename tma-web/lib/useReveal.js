"use client";
import { useEffect } from "react";

export function useReveal(selector = "[data-reveal]", options = {}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(selector).forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll(selector);

    if (prefersReducedMotion) {
      items.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px", ...options }
    );

    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [selector]);
}

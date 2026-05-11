"use client";
import { useEffect } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function parseTarget(text) {
  const match = text.match(/^(\+?)([\d,.]+)([%$KMB+x]*)$/i) || text.match(/^(\$?)([\d,.]+)([%KMB+x]*)$/i);
  if (!match) return null;
  const prefix = match[1] || "";
  const numStr = match[2];
  const suffix = match[3] || "";
  const value = parseFloat(numStr.replace(/,/g, ""));
  if (Number.isNaN(value)) return null;
  const decimals = (numStr.split(".")[1] || "").length;
  return { prefix, value, suffix, decimals };
}

function formatNumber(val, decimals) {
  if (decimals === 0) return Math.round(val).toLocaleString();
  return val.toFixed(decimals);
}

export function useCountUp(selector = "[data-countup]", duration = 1400) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll(selector);
    if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

    const animateEl = (el) => {
      const original = el.textContent.trim();
      const parsed = parseTarget(original);
      if (!parsed) return;
      const { prefix, value, suffix, decimals } = parsed;
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(t);
        const current = value * eased;
        el.textContent = `${prefix}${formatNumber(current, decimals)}${suffix}`;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = original;
      };
      requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateEl(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [selector, duration]);
}

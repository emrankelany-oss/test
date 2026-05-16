"use client";
import { useEffect } from "react";
import { useWindowScrollProgress } from "@/lib/useScrollProgress";

/**
 * V2PersistentBG — atmospheric layer (3 drifting orbs + grid + noise)
 * plus dark→light theme flip at scroll progress > 0.7.
 */
export default function V2PersistentBG() {
  useWindowScrollProgress(({ scroll, limit }) => {
    const lightAt = limit * 0.7;
    const isLight = scroll >= lightAt;
    if (document.body.dataset.v2Theme !== (isLight ? "light" : "dark")) {
      document.body.dataset.v2Theme = isLight ? "light" : "dark";
    }
  });

  useEffect(() => {
    document.body.dataset.v2Theme = "dark";
    return () => {
      delete document.body.dataset.v2Theme;
    };
  }, []);

  return (
    <div className="v2-bg" aria-hidden="true">
      <div className="v2-bg-orb v2-bg-orb--a" />
      <div className="v2-bg-orb v2-bg-orb--b" />
      <div className="v2-bg-orb v2-bg-orb--c" />
      <div className="v2-bg-grid" />
      <div className="v2-bg-noise" />
    </div>
  );
}

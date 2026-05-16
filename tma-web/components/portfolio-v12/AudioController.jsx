"use client";

import { useRef, useState, useCallback } from "react";

export default function AudioController() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);

  const start = useCallback(() => {
    const AC = window.AudioContext || window["webkitAudioContext"];
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 42;
    const gain = ctx.createGain();
    gain.gain.value = 0.0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);
    ctxRef.current = ctx;
    nodesRef.current = { osc, gain };
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const n = nodesRef.current;
    if (!ctx || !n) return;
    n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => { try { n.osc.stop(); ctx.close(); } catch {} }, 500);
    ctxRef.current = null;
    nodesRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      if (next) start();
      else stop();
      return next;
    });
  }, [start, stop]);

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute launch audio" : "Enable launch audio"}
      style={{
        position: "fixed", right: "2vw", bottom: "2vh", zIndex: 5,
        background: "transparent", border: "1px solid rgba(244,245,247,0.25)",
        color: "var(--v12-silver)", padding: "0.5rem 0.8rem", borderRadius: 999,
        fontSize: "0.7rem", letterSpacing: "0.18em", cursor: "pointer",
      }}
    >
      {on ? "◼ SOUND ON" : "▶ SOUND OFF"}
    </button>
  );
}

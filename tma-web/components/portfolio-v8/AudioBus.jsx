"use client";

import { useEffect, useRef } from "react";

/* Lightweight audio bus using WebAudio + procedural oscillators (no external assets).
 *
 * Why procedural: we don't have brand-sourced .ogg stems yet, and shipping royalty-free
 * stock would create license cleanup later. Procedural drones use ~zero bandwidth and
 * can be swapped out for stems by replacing this file once TMA picks tracks.
 *
 * Per scene: a soft pad of two detuned oscillators + a slow LFO pan + a subtle hover SFX.
 * Room change triggers a brief envelope on a "page turn" oscillator.
 */
export default function AudioBus({ on, roomKey }) {
  const ctxRef  = useRef(null);
  const padRef  = useRef(null);
  const lastRoom = useRef(roomKey);

  /* boot + teardown audio graph */
  useEffect(() => {
    if (!on) {
      stopGraph(ctxRef, padRef);
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // soft ambient pad — 2 detuned saws + lowpass + LFO panner
    const o1 = ctx.createOscillator(); o1.type = "sine";
    const o2 = ctx.createOscillator(); o2.type = "triangle";
    o1.frequency.value = 110;
    o2.frequency.value = 110 * 1.501; // soft fifth-ish

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 700; lp.Q.value = 0.6;

    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain);
    if (pan) lfoGain.connect(pan.pan);

    o1.connect(lp); o2.connect(lp);
    if (pan) { lp.connect(pan); pan.connect(masterGain); }
    else { lp.connect(masterGain); }

    o1.start(); o2.start(); lfo.start();
    masterGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 1.2);

    padRef.current = { o1, o2, lp, masterGain, pan, lfo };

    // hover SFX — short click via simple synth
    const hover = e => {
      const t = e.target.closest("[data-cursor]");
      if (!t) return;
      blip(ctx, 880 + Math.random() * 220, 0.05, 0.06);
    };
    document.addEventListener("mouseover", hover);

    return () => {
      document.removeEventListener("mouseover", hover);
      stopGraph(ctxRef, padRef);
    };
  }, [on]);

  /* re-tune pad on room change */
  useEffect(() => {
    const pad = padRef.current;
    const ctx = ctxRef.current;
    if (!pad || !ctx) return;
    const palette = {
      hero:     [110, 165],
      stats:    [98,  147],
      work:     [123, 184],
      services: [104, 156],
      cta:      [146, 220],
    };
    const [a, b] = palette[roomKey] || [110, 165];
    pad.o1.frequency.linearRampToValueAtTime(a, ctx.currentTime + 1.5);
    pad.o2.frequency.linearRampToValueAtTime(b, ctx.currentTime + 1.5);
    pad.lp.frequency.linearRampToValueAtTime(700 + Math.random() * 600, ctx.currentTime + 1.5);
    // page-turn SFX
    if (lastRoom.current !== roomKey) {
      lastRoom.current = roomKey;
      blip(ctx, 220, 0.18, 0.12);
    }
  }, [roomKey, on]);

  return null;
}

function blip(ctx, freq, dur, vol) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.value = freq;
  o.connect(g); g.connect(ctx.destination);
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function stopGraph(ctxRef, padRef) {
  const ctx = ctxRef.current;
  const pad = padRef.current;
  if (!ctx || !pad) { ctxRef.current = null; padRef.current = null; return; }
  try {
    pad.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    pad.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => { try { ctx.close(); } catch (_) {} }, 500);
  } catch (_) { try { ctx.close(); } catch (__) {} }
  ctxRef.current = null;
  padRef.current = null;
}

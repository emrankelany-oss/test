"use client";
import { useState } from "react";
import GradientAurora from "@/components/portfolio-v24/gradient-options/GradientAurora";
import GradientMesh from "@/components/portfolio-v24/gradient-options/GradientMesh";
import GradientParallaxBands from "@/components/portfolio-v24/gradient-options/GradientParallaxBands";
import GradientHueWash from "@/components/portfolio-v24/gradient-options/GradientHueWash";
import "@/components/portfolio-v24/gradient-options/preview.css";

const OPTIONS = [
  { key: "aurora", label: "1 · Aurora beams", C: GradientAurora, note: "Beams sweep & rotate with scroll" },
  { key: "mesh", label: "2 · Flowing mesh", C: GradientMesh, note: "Bold blobs flow + pan with scroll" },
  { key: "bands", label: "3 · Parallax bands", C: GradientParallaxBands, note: "Layers slide at different speeds" },
  { key: "wash", label: "4 · Hue wash", C: GradientHueWash, note: "Whole field washes blue→red on scroll" },
];

export default function GradientOptionsPage() {
  const [active, setActive] = useState("aurora");
  const opt = OPTIONS.find((o) => o.key === active) || OPTIONS[0];
  const Active = opt.C;
  return (
    <main className="go-page">
      <Active key={opt.key} />
      <nav className="go-toolbar" aria-label="Gradient options">
        {OPTIONS.map((o) => (
          <button key={o.key} className={`go-btn${active === o.key ? " is-on" : ""}`} onClick={() => setActive(o.key)}>
            {o.label}
          </button>
        ))}
      </nav>
      <div className="go-content">
        <section className="go-hero">
          <p className="go-kicker">Background option {opt.label.split(" · ")[0]} — {opt.note}</p>
          <h1>Scroll to see the motion.</h1>
          <p>Switch options with the buttons (top-right) and scroll up/down to compare how each background reacts. Then tell me the number you want and I&apos;ll apply it to V24.</p>
        </section>
        {[1, 2, 3, 4, 5].map((i) => (
          <section className="go-sec" key={i}><h2>Keep scrolling — section {i}</h2></section>
        ))}
      </div>
    </main>
  );
}

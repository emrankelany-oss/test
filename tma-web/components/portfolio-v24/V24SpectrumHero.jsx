"use client";
import dynamic from "next/dynamic";

// WebGL canvas must not SSR (Next.js App Router).
const V24SpectrumField = dynamic(() => import("./V24SpectrumField"), { ssr: false });

export default function V24SpectrumHero() {
  return (
    <main className="v24-page v24sp-page">
      <V24SpectrumField />

      <section className="v24sp-hero">
        <div className="v24sp-grid">
          <h2 className="v24sp-line v24sp-left">
            We don&apos;t
            <br />
            just design
          </h2>

          <h2 className="v24sp-line v24sp-right">
            We bring brands
            <br />
            into motion
          </h2>
        </div>

        <div className="v24sp-scroll" aria-hidden="true">
          Scroll <span className="line" /> brand spectrum
        </div>
      </section>

      {/* runway so the scroll-reactive shader has something to react to */}
      <section className="v24sp-spacer" aria-hidden="true" />
    </main>
  );
}

import Link from "next/link";

export default function CareersHero() {
  return (
    <header className="careers-hero" id="top">
      <div className="container">
        <div className="careers-hero-meta">
          <Link href="/#top" className="case-back"><span>↩</span> Back to TMA</Link>
          <div className="careers-hero-meta-row">
            <span className="mono">— Careers</span>
            <span className="mono">Amman · Riyadh</span>
            <span className="mono">2026 / OPEN</span>
          </div>
        </div>

        <h1 className="careers-hero-title">
          Build the work<br />
          <span className="ital">you want</span> to be<br />
          <span style={{ textDecoration: "line-through", opacity: 0.4 }}>known for.</span> known by.
        </h1>

        <div className="careers-hero-bottom">
          <p className="careers-hero-intro">
            We're a creative powerhouse with offices in Amman and Riyadh, building
            category-defining brands across the GCC. We hire bold thinkers and
            craftspeople — strategists, designers, growth marketers, producers — who
            want to do the best work of their careers.
          </p>
          <a href="#openings" className="careers-hero-cta">
            See open roles <span>↓</span>
          </a>
        </div>
      </div>
    </header>
  );
}

"use client";

import { v8Hero, v8Stats, v8Projects, v8Services, v8Cta } from "@/data/portfolio-v8";

export default function V8Mobile() {
  return (
    <div className="v8-mobile">
      <nav className="v8-nav" style={{ position: "sticky", top: 0, background: "#0a0a0acc", backdropFilter: "blur(10px)" }}>
        <a className="v8-mark" href="/"><b>TMA</b>&nbsp;/&nbsp;PORTFOLIO</a>
        <a className="v8-pill" href="mailto:info@themotionagency.net">Let's talk</a>
      </nav>

      <section className="v8-mobile-section">
        <div className="eyebrow">{v8Hero.eyebrow}</div>
        <h2>{v8Hero.headline}</h2>
        <p>Cinematic strategy + design + storytelling. Built out of Amman & Riyadh.</p>
      </section>

      <section className="v8-mobile-section">
        <div className="eyebrow">How we help</div>
        <h2>The numbers behind bold work.</h2>
        <div className="v8-mobile-stats">
          {v8Stats.map(s => (
            <div className="cell" key={s.label}>
              <b>{s.value}</b><span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="v8-mobile-section">
        <div className="eyebrow">Featured work</div>
        <h2>Bold ideas, brought to market.</h2>
        {v8Projects.map(p => (
          <a key={p.slug} className="v8-mobile-card" href={p.href}>
            <img src={p.image} alt={p.title} loading="lazy" />
            <div className="meta">
              <h3>{p.title}</h3>
              <span>{p.tags.join(" · ")}</span>
            </div>
          </a>
        ))}
      </section>

      <section className="v8-mobile-section">
        <div className="eyebrow">What we do</div>
        <h2>Eight services, one playbook.</h2>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, marginTop: 18 }}>
          {v8Services.map(s => (
            <li key={s.n} style={{ borderTop: "1px solid var(--v8-line)", padding: "16px 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: 12 }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--v8-dim)", fontSize: 11, letterSpacing: "0.16em" }}>{s.n}</span>
              <div>
                <strong style={{ fontWeight: 500, display: "block", marginBottom: 4 }}>{s.title}</strong>
                <span style={{ color: "var(--v8-dim)", fontSize: 13, lineHeight: 1.5 }}>{s.line}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="v8-mobile-section">
        <div className="eyebrow">{v8Cta.eyebrow}</div>
        <h2>{v8Cta.headline}</h2>
        <a className="v8-mobile-cta" href={v8Cta.primary.href}>{v8Cta.primary.label}</a>
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 16, color: "var(--v8-dim)", fontSize: 12, fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.16em" }}>
          {v8Cta.offices.map(o => (
            <div key={o.city}>
              <strong style={{ color: "#fff", fontWeight: 500, display: "block" }}>{o.city.toUpperCase()}</strong>
              <span>{o.street}</span><br/>
              <span>{o.tel}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function BigCTA() {
  return (
    <section className="pf-section pf-bigcta" id="cta">
      <div className="pf-bigcta-bg" aria-hidden="true">
        <div className="pf-bigcta-glow" />
        <div className="pf-bigcta-grid" />
      </div>
      <div className="container">
        <div className="pf-bigcta-inner" data-reveal>
          <div className="pf-bigcta-chip">
            <span className="dot" /> Let&apos;s build
          </div>
          <h2 className="pf-bigcta-title">
            Ready to build the next <span className="ital">category leader?</span>
          </h2>
          <p className="pf-bigcta-sub">
            Let&apos;s create something extraordinary together. Tell us where you&apos;re headed and
            what&apos;s in the way — we&apos;ll come back within 48 hours with first thoughts, not a deck of
            templates.
          </p>
          <div className="pf-bigcta-actions">
            <a className="pf-bigcta-btn primary" href="/#contact">
              Book a discovery call <span>↗</span>
            </a>
            <a className="pf-bigcta-btn ghost" href="/#contact">
              Send a brief <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

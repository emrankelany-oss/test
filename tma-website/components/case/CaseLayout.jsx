// Shared header/footer + case-study layout used by both case-study pages.

function CaseNav() {
  return (
    <nav className="nav case-nav">
      <a href="index.html#top" className="nav-logo" aria-label="The Motion Agency — home">
        <img className="nav-logo-img light" src="assets/tma-logo-white.png?v=2" alt="" />
        <img className="nav-logo-img dark"  src="assets/tma-logo-black.png?v=2" alt="" />
      </a>
      <div className="nav-links">
        <a href="index.html#proof">Case Studies</a>
        <a href="index.html#services">Services</a>
        <a href="index.html#about">About</a>
        <a href="index.html#insights">Insights</a>
        <a href="careers.html">Careers</a>
      </div>
      <a href="index.html#contact" className="nav-cta">
        <span className="nav-dot" />
        Start a project
      </a>
    </nav>
  );
}
window.CaseNav = CaseNav;

function CaseFooter() {
  return (
    <footer className="footer">
      <div className="footer-mega">THE / MOTION / AGENCY</div>
      <div className="footer-meta">
        <span>© 2026 The Motion Agency</span>
        <span>themotionagency.net</span>
        <span>info@themotionagency.net</span>
        <span><a href="https://jo.linkedin.com/company/the-motion-agency-inc" target="_blank" rel="noopener">LinkedIn</a></span>
        <span>v1.0 — 04 / 2026</span>
      </div>
    </footer>
  );
}
window.CaseFooter = CaseFooter;

// Reusable section wrappers to keep the pages declarative

function CaseHero({ num, client, project, year, services, headline, intro, image, badge }) {
  return (
    <header className="case-hero" id="top">
      <div className="case-hero-bg">
        <div
          className="case-hero-image"
          style={{ backgroundImage: `url("${image}")` }}
          aria-hidden="true"
        />
        <div className="case-hero-vignette" aria-hidden="true" />
      </div>

      <div className="container case-hero-inner">
        <div className="case-hero-meta">
          <a href="index.html#proof" className="case-back">
            <span>↩</span> All case studies
          </a>
          <div className="case-hero-meta-row">
            <span className="mono">— Case {num}</span>
            <span className="mono">{client}</span>
            <span className="mono">{year}</span>
          </div>
        </div>

        <h1 className="case-hero-title">{headline}</h1>

        <div className="case-hero-bottom">
          <p className="case-hero-intro">{intro}</p>
          <div className="case-hero-tags">
            <div className="case-hero-services">
              {services.map((s, i) => <span key={i}>{s}</span>)}
            </div>
            <div className="case-hero-badge">{badge}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
window.CaseHero = CaseHero;

function CaseSection({ num, kicker, title, children, dark }) {
  return (
    <section className={`case-section ${dark ? "dark" : ""}`}>
      <div className="container">
        <div className="case-section-head">
          <div className="num"><span className="dot" />{num} / {kicker}</div>
          <h2>{title}</h2>
        </div>
        <div className="case-section-body">{children}</div>
      </div>
    </section>
  );
}
window.CaseSection = CaseSection;

function CaseMetrics({ items }) {
  return (
    <div className="case-metrics-grid">
      {items.map((m, i) => (
        <div className="case-metric-card" key={i}>
          <div className="num">{m.v}</div>
          <div className="lbl">{m.l}</div>
          {m.note && <div className="note">{m.note}</div>}
        </div>
      ))}
    </div>
  );
}
window.CaseMetrics = CaseMetrics;

function CaseVideo({ videoId, title }) {
  return (
    <div className="case-video">
      <div className="case-video-meta">
        <span>Watch the film</span>
        <span>{title}</span>
      </div>
      <div className="case-video-frame">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
window.CaseVideo = CaseVideo;

function CasePullQuote({ quote, attribution }) {
  return (
    <blockquote className="case-pullquote">
      <div className="mark">"</div>
      <p>{quote}</p>
      {attribution && <footer>— {attribution}</footer>}
    </blockquote>
  );
}
window.CasePullQuote = CasePullQuote;

function CaseNext({ num, client, project, href, image }) {
  return (
    <a className="case-next" href={href}>
      <div
        className="case-next-image"
        style={{ backgroundImage: `url("${image}")` }}
        aria-hidden="true"
      />
      <div className="case-next-overlay" aria-hidden="true" />
      <div className="container case-next-inner">
        <div className="mono">Next case · {num}</div>
        <h3>{client} <span className="ital">— {project}</span></h3>
        <span className="case-next-cta">Read case study <span>↗</span></span>
      </div>
    </a>
  );
}
window.CaseNext = CaseNext;

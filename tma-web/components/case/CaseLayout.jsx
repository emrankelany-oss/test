import Link from "next/link";

export function CaseNav() {
  return (
    <nav className="nav case-nav">
      <Link href="/#top" className="nav-logo" aria-label="The Motion Agency — home">
        <img className="nav-logo-img light" src="/assets/tma-logo-white.png" alt="" />
        <img className="nav-logo-img dark" src="/assets/tma-logo-black.png" alt="" />
      </Link>
      <div className="nav-links">
        <Link href="/portfolio">Portfolio</Link>
        <Link href="/portfolio-v2" className="nav-v2-link">V2 Lab</Link>
        <Link href="/#proof">Case Studies</Link>
        <Link href="/#services">Services</Link>
        <Link href="/#about">About</Link>
        <Link href="/#insights">Insights</Link>
        <Link href="/careers">Careers</Link>
      </div>
      <Link href="/#contact" className="nav-cta">
        <span className="nav-dot" />
        Start a project
      </Link>
    </nav>
  );
}

export function CaseFooter() {
  return (
    <footer className="footer">
      <div className="footer-mega">THE / MOTION / AGENCY</div>
      <div className="footer-meta">
        <span>© 2026 The Motion Agency</span>
        <span>themotionagency.net</span>
        <span>info@themotionagency.net</span>
        <span>
          <a href="https://jo.linkedin.com/company/the-motion-agency-inc" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </span>
        <span>v1.0 — 04 / 2026</span>
      </div>
    </footer>
  );
}

export function CaseHero({ num, client, year, services, headline, intro, image, badge }) {
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
          <Link href="/#proof" className="case-back">
            <span>↩</span> All case studies
          </Link>
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

export function CaseSection({ num, kicker, title, children, dark }) {
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

export function CaseMetrics({ items }) {
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

export function CaseVideo({ videoId, title }) {
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
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export function CasePullQuote({ quote, attribution }) {
  return (
    <blockquote className="case-pullquote">
      <div className="mark">"</div>
      <p>{quote}</p>
      {attribution && <footer>— {attribution}</footer>}
    </blockquote>
  );
}

export function CaseNext({ num, client, project, href, image }) {
  return (
    <Link className="case-next" href={href}>
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
    </Link>
  );
}

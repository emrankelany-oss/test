import { featuredWork } from "@/data/portfolio";

export default function FeaturedWorkGrid() {
  return (
    <section className="pf-section pf-featured" id="featured">
      <div className="container">
        <div className="pf-section-head" data-reveal>
          <div className="pf-section-num">
            <span className="dot" />
            03 / Featured work
          </div>
          <div className="pf-section-sub">Six stories.</div>
          <h2 className="pf-section-title">
            One <span className="ital">playbook.</span>
          </h2>
        </div>

        <div className="pf-grid pf-grid--3" data-reveal>
          {featuredWork.map((work) => (
            <a
              key={work.id}
              href={work.href}
              className="pf-work-card"
              data-href={work.href}
            >
              <div className="pf-work-visual">
                <div
                  className="pf-work-image"
                  style={{ backgroundImage: `url("${work.image}")` }}
                  role="img"
                  aria-label={`${work.client} — ${work.project}`}
                />
                <div className="pf-work-n">{work.n}</div>
                {work.videoId && (
                  <div className="pf-work-play" aria-hidden="true">
                    <svg viewBox="0 0 48 48" width="44" height="44">
                      <circle cx="24" cy="24" r="23" fill="rgba(0,0,0,0.5)" stroke="#fff" strokeWidth="1" />
                      <polygon points="19,14 36,24 19,34" fill="#fff" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="pf-work-text">
                <div className="pf-work-meta">
                  <span>{work.client}</span>
                  <span className="dot">·</span>
                  <span>{work.project}</span>
                </div>
                <h3 className="pf-work-title">{work.headline}</h3>
                <div className="pf-work-tags">
                  {work.tags.map((t, i) => (
                    <span key={i} className="pf-tag">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="pf-work-kpi">
                  <span className="v" data-countup>{work.kpi.v}</span>
                  <span className="l">{work.kpi.l}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

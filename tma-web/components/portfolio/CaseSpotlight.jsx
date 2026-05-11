export default function CaseSpotlight({
  flip,
  num,
  client,
  project,
  year,
  headline,
  challenge,
  insight,
  solution,
  metrics,
  image,
  href,
}) {
  return (
    <article className={`pf-spotlight ${flip ? "pf-spotlight--flip" : ""}`}>
      <div className="pf-spotlight-text">
        <div className="pf-spotlight-meta">
          <span>— Case {num}</span>
          <span className="dot">·</span>
          <span>{client}</span>
          <span className="dot">·</span>
          <span>{year}</span>
        </div>
        <h3 className="pf-spotlight-title">{headline}</h3>

        <ul className="pf-spotlight-points">
          <li>
            <span className="pf-spotlight-points-label">The Challenge —</span>
            <span>{challenge}</span>
          </li>
          <li>
            <span className="pf-spotlight-points-label">The Insight —</span>
            <span>{insight}</span>
          </li>
          <li>
            <span className="pf-spotlight-points-label">The Solution —</span>
            <span>{solution}</span>
          </li>
        </ul>

        <a href={href} className="pf-spotlight-cta">
          Read case study <span>↗</span>
        </a>
      </div>

      <div className="pf-spotlight-visual">
        <div
          className="pf-spotlight-image"
          style={{ backgroundImage: `url("${image}")` }}
          role="img"
          aria-label={`${client} — ${project}`}
        />
        <div className="pf-spotlight-badge">{project}</div>
        <div className="pf-spotlight-metrics">
          {metrics.map((m, i) => (
            <div className="pf-spotlight-metric" key={i}>
              <div className="num">{m.v}</div>
              <div className="lbl">{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

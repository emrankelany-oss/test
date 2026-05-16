"use client";
import V7Artefact from "./V7Artefact";
import MarkerArrow from "./atoms/MarkerArrow";

// A two-page journal spread. Left page = brief + sticky notes.
// Right page = pinned artefacts (polaroid, OOH, palette, etc.).
// On mobile, spread collapses to a vertical stack.
export default function V7Spread({ caseStudy, index = 0 }) {
  const { client, project, n, brief, artefacts, arrow } = caseStudy;

  return (
    <section
      className="v7-spread"
      data-section="v7-spread"
      data-spread-index={index}
      aria-label={`Field note — ${client}`}
    >
      <div className="v7-spread-pages">
        {/* === LEFT PAGE — the brief =========================== */}
        <div className="v7-page-left">
          <div className="v7-page-header">
            <span className="v7-page-num">№ {n}</span>
            <span className="v7-page-tag">CASE STUDY</span>
          </div>

          <h2 className="v7-spread-client">
            {client}
            <span className="v7-spread-project">— {project}</span>
          </h2>

          <h3 className="v7-spread-brief-h">THE BRIEF</h3>
          <p className="v7-spread-brief-quote">{brief.quote}</p>

          <ul className="v7-sticky-list" aria-label="Problems noted">
            {brief.bullets.map((b, i) => (
              <V7Artefact
                key={i}
                rotation={i % 2 === 0 ? -2.5 : 1.5}
                pin="tape"
                tapeRotation={i % 2 === 0 ? -3 : 4}
                tapeColor={["#FCE38A", "#A0DDE6", "#F8B4B4", "#C9F0C0"][i % 4]}
                tapeWidth={70}
                className="v7-sticky"
                width={260}
                ariaLabel={`Brief point — ${b.slice(0, 32)}`}
              >
                <p className="v7-sticky-text">{b}</p>
              </V7Artefact>
            ))}
          </ul>

          {arrow && (
            <div className="v7-spread-arrow" aria-hidden="true">
              <MarkerArrow rotation={arrow.rotation || -8} width={240} />
              {arrow.label && <span className="v7-arrow-label">{arrow.label}</span>}
            </div>
          )}
        </div>

        {/* === RIGHT PAGE — artefacts ========================== */}
        <div className="v7-page-right">
          <div className="v7-page-header v7-page-header--right">
            <span className="v7-page-tag">ARTEFACTS</span>
            <span className="v7-page-num">{client.toUpperCase()}</span>
          </div>

          <div className="v7-artefact-board">
            {artefacts.map((a, i) => {
              if (a.type === "polaroid") {
                return (
                  <V7Artefact
                    key={i}
                    rotation={a.rotation || -3}
                    pin="tape"
                    tapeColor={a.tapeColor || "#FCE38A"}
                    tapePosition="top"
                    width={a.width || 280}
                    className={`v7-art-${a.type}`}
                    ariaLabel={a.alt}
                  >
                    <div
                      className="v7-polaroid"
                      style={{ backgroundImage: `url("${a.image}")` }}
                    />
                    {a.caption && <div className="v7-polaroid-caption">{a.caption}</div>}
                  </V7Artefact>
                );
              }
              if (a.type === "ooh") {
                return (
                  <V7Artefact
                    key={i}
                    rotation={a.rotation || 2}
                    pin="tape"
                    tapeColor={a.tapeColor || "#A0DDE6"}
                    tapePosition="topRight"
                    width={a.width || 220}
                    className={`v7-art-${a.type}`}
                    ariaLabel={a.alt}
                  >
                    <div
                      className="v7-ooh"
                      style={{ backgroundImage: `url("${a.image}")` }}
                    />
                    {a.caption && <div className="v7-ooh-caption">{a.caption}</div>}
                  </V7Artefact>
                );
              }
              if (a.type === "stat") {
                return (
                  <V7Artefact
                    key={i}
                    rotation={a.rotation || -5}
                    pin="pin"
                    pinColor={a.pinColor || "#D43A3A"}
                    width={a.width || 200}
                    className={`v7-art-${a.type}`}
                    ariaLabel={a.alt || a.value}
                  >
                    <div className="v7-stat-card">
                      <span className="v7-stat-value">{a.value}</span>
                      <span className="v7-stat-label">{a.label}</span>
                      <span className="v7-stat-circle" aria-hidden="true" />
                    </div>
                  </V7Artefact>
                );
              }
              if (a.type === "palette") {
                return (
                  <V7Artefact
                    key={i}
                    rotation={a.rotation || 1}
                    pin="tape"
                    tapeColor="#F8B4B4"
                    tapePosition="top"
                    width={a.width || 240}
                    className={`v7-art-${a.type}`}
                    ariaLabel="Brand palette swatches"
                  >
                    <div className="v7-palette-card">
                      <span className="v7-palette-h">PALETTE</span>
                      <div className="v7-palette-row">
                        {a.colors.map((c) => (
                          <span
                            key={c}
                            className="v7-palette-swatch"
                            style={{ backgroundColor: c }}
                            title={c}
                          >
                            <span className="v7-palette-hex">{c}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </V7Artefact>
                );
              }
              if (a.type === "note") {
                return (
                  <V7Artefact
                    key={i}
                    rotation={a.rotation || -2}
                    pin="tape"
                    tapeColor="#C9F0C0"
                    tapeWidth={60}
                    width={a.width || 220}
                    className={`v7-art-${a.type}`}
                    ariaLabel={a.text}
                  >
                    <p className="v7-handwritten">{a.text}</p>
                  </V7Artefact>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

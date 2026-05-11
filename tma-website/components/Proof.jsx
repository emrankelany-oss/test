function CaseStudy({ flip, num, client, project, year, services, headline, body, metrics, badge, floaterText, videoId, onPlay, image, caseHref }) {
  const handleCta = (e) => {
    if (caseHref) {
      // Let it navigate normally to the case study page
      return;
    }
    if (videoId) {
      e.preventDefault();
      onPlay({ videoId, title: `${client} — ${project}` });
    }
  };
  return (
    <article className={`case ${flip ? "flip" : ""}`}>
      <div className={`case-visual ${videoId ? "playable" : ""} ${image ? "has-image" : ""}`}
           onClick={videoId ? () => onPlay({ videoId, title: `${client} — ${project}` }) : undefined}
           role={videoId ? "button" : undefined}
           tabIndex={videoId ? 0 : undefined}
           onKeyDown={videoId ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlay({ videoId, title: `${client} — ${project}` }); } } : undefined}
      >
        {image ? (
          <div
            className="case-image"
            style={{ backgroundImage: `url("${image}")` }}
            role="img"
            aria-label={`${client} — ${project}`}
          />
        ) : (
          <div className="ph-pattern" />
        )}
        <div className="floater f1">{floaterText}</div>
        <div className="floater f2">{floaterText}</div>
        <div className="badge">{badge}</div>
        {!image && (
          <div className="ph">
            <div className="ph-text">{videoId ? `▶  PLAY · ${client.toUpperCase()} ${project.toUpperCase()}` : `FILM · ${client.toUpperCase()} ${project.toUpperCase()}`}</div>
          </div>
        )}
        {videoId && (
          <div className="case-play" aria-hidden="true">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,0.55)" stroke="#fff" strokeWidth="1.5" />
              <polygon points="32,24 60,40 32,56" fill="#fff" />
            </svg>
          </div>
        )}
      </div>
      <div className="case-text">
        <div className="meta">
          <span>— Case {num}</span>
          <span>{client}</span>
          <span>{year}</span>
        </div>
        <h3>{headline}</h3>
        <p>{body}</p>
        <div className="case-metrics">
          {metrics.map((m, i) => (
            <div className="case-metric" key={i}>
              <div className="num">{m.v}</div>
              <div className="lbl">{m.l}</div>
            </div>
          ))}
        </div>
        <a href={caseHref || "#"} className="case-cta" onClick={handleCta}>
          Read case study <span>↗</span>
        </a>
      </div>
    </article>
  );
}

function Proof() {
  const [lightbox, setLightbox] = React.useState(null);

  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <section className="section dark" id="proof">
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />03 / Case studies</div>
          <div className="meta">Two stories.<br/>One playbook.</div>
          <h2>
            Case<br/>
            <span className="ital">studies.</span>
          </h2>
        </div>

        <CaseStudy
          num="01"
          client="Foodics"
          project="Boundless"
          year="2022 — 2023"
          services={["Event", "GTM", "Brand Strategy"]}
          badge="$1B unicorn"
          floaterText="BOUNDLESS"
          videoId="uzd9os9G1d8"
          image="assets/case-foodics-boundless.png"
          caseHref="case-foodics-boundless.html"
          onPlay={setLightbox}
          headline={<>Boundless: launching what's <span className="ital">next</span> for F&amp;B.</>}
          body="Two flagship product events that turned the stage into a launchpad. We unveiled Foodics Pay, Capital, and the Marketplace — and reframed Foodics from POS provider to the growth engine of the F&B industry."
          metrics={[
            { v: "+35.6%", l: "YoY revenue '24" },
            { v: "32K+", l: "Active merchants" },
            { v: "35%", l: "KSA market share" },
          ]}
        />

        <CaseStudy
          flip
          num="02"
          client="Zid"
          project="Ripple 2024"
          year="2024"
          services={["Brand", "GTM", "Production"]}
          badge="200% growth"
          floaterText="RIPPLE"
          image="assets/case-zid-ripple.png"
          videoId="GSSS71zV5HI"
          caseHref="case-zid-ripple.html"
          onPlay={setLightbox}
          headline={<>Ripple: launching the Total <span className="ital">Commerce</span> era.</>}
          body="A flagship moment in Diriyah for 1,000+ merchants. We unveiled Zid's unified Total Commerce platform — e-commerce, social, in-store, and cross-border — and rewired how the region thinks about merchant growth."
          metrics={[
            { v: "+200%", l: "YoY growth" },
            { v: "12K+", l: "Active merchants" },
            { v: "+50%", l: "Basket size lift" },
          ]}
        />
      </div>

      {lightbox && (
        <div
          className="video-lightbox"
          onClick={(e) => { if (e.target.classList.contains("video-lightbox")) setLightbox(null); }}
        >
          <button className="video-close" onClick={() => setLightbox(null)} aria-label="Close">
            <span>CLOSE</span>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" />
              <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <div className="video-frame-wrap">
            <div className="video-meta">
              <span>Now playing</span>
              <span>{lightbox.title}</span>
            </div>
            <div className="video-frame">
              <iframe
                src={`https://www.youtube.com/embed/${lightbox.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={lightbox.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
window.Proof = Proof;
window.CaseStudy = CaseStudy;

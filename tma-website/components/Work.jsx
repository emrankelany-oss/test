function Work() {
  const [preview, setPreview] = React.useState({ show: false, x: 0, y: 0, idx: 0 });
  const [lightbox, setLightbox] = React.useState(null); // { videoId, title } | null

  const items = [
    { idx: "01", title: "Foodics — Boundless '23", tags: ["Event marketing", "GTM strategy"], year: "2023", pattern: "grid", videoId: "uzd9os9G1d8" },
    { idx: "02", title: "Zid — Ripple 2024",        tags: ["Brand experience", "Product launch"], year: "2024", pattern: "bars" },
    { idx: "03", title: "Foodics — Pay & Capital",  tags: ["Product marketing", "Launch"], year: "2023", pattern: "dots" },
    { idx: "04", title: "Foodics — Boundless '22",  tags: ["Event", "Brand strategy"], year: "2022", pattern: "" },
    { idx: "05", title: "Zid — Total Commerce",     tags: ["Identity", "Campaign"], year: "2024", pattern: "dots" },
    { idx: "06", title: "Foodics — Regional GTM",   tags: ["GTM", "Egypt · UAE · KW · JO"], year: "2021—24", pattern: "grid" },
  ];

  const onMove = (e) => setPreview((p) => ({ ...p, x: e.clientX, y: e.clientY }));

  const onRowClick = (e, it) => {
    if (it.videoId) {
      e.preventDefault();
      setLightbox({ videoId: it.videoId, title: it.title });
    }
  };

  // Close on ESC
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
    <section className="section" id="work" onMouseMove={onMove}>
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />02 / Selected work</div>
          <div className="meta">Big things, made with<br />really great people.</div>
          <h2>
            Selected<br />
            <span className="ital">work.</span>
          </h2>
        </div>

        <div className="work-list">
          {items.map((it, i) => (
            <a
              key={i}
              className={`work-row ${it.videoId ? "has-video" : ""}`}
              href={it.videoId ? "#" : `#case-${i}`}
              onClick={(e) => onRowClick(e, it)}
              onMouseEnter={() => setPreview({ ...preview, show: true, idx: i })}
              onMouseLeave={() => setPreview({ ...preview, show: false })}
            >
              <span className="idx">{it.idx}</span>
              <span className="title">
                {it.title}
                {it.videoId ? (
                  <span className="play-badge" aria-label="Play video">
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                      <polygon points="2,1 9,5 2,9" fill="currentColor" />
                    </svg>
                    Watch
                  </span>
                ) : (
                  <span className="arrow">↗</span>
                )}
              </span>
              <span className="tags">
                {it.tags.map((t, j) => <span key={j}>{t}</span>)}
              </span>
              <span className="year">{it.year}</span>
            </a>
          ))}
        </div>
      </div>

      <div
        className={`work-preview ${preview.show ? "show" : ""}`}
        style={{ left: preview.x, top: preview.y }}
      >
        <div className={`pattern ${items[preview.idx]?.pattern || ""}`} />
        <div className="label">PREVIEW · {items[preview.idx]?.title}</div>
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
window.Work = Work;

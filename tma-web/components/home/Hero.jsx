export default function Hero() {
  const reelTiles = [
    { cls: "stripe", label: "REEL · BOUNDLESS '23" },
    { cls: "dim", label: "FILM · ZID RIPPLE" },
    { cls: "bright", label: "STAGE · DIRIYAH" },
    { cls: "dot", label: "MOTION · LOOP 04" },
    { cls: "bright", label: "BTS · SHOOT DAY 2" },
    { cls: "stripe", label: "TITLE CARD · 04" },
    { cls: "dim", label: "PORTRAIT · CEO" },
    { cls: "dot", label: "PRODUCT · POS" },
    { cls: "stripe", label: "EVENT · KEYNOTE" },
    { cls: "bright", label: "REEL · BOUNDLESS '22" },
    { cls: "dim", label: "AERIAL · RIYADH" },
    { cls: "dot", label: "ID · LOGO LOOP" },
  ];

  return (
    <header className="hero" id="top">
      <div className="hero-bg">
        <div className="hero-prism" aria-hidden="true">
          <div className="hero-prism-cone hero-prism-cone--blue" />
          <div className="hero-prism-cone hero-prism-cone--warm" />
          <div className="hero-prism-cone hero-prism-cone--rim" />
          <div className="hero-prism-grain" />
        </div>
        <div className="hero-reel">
          {reelTiles.map((t, i) => (
            <div key={i} className={`hero-reel-tile ${t.cls}`} data-label={t.label}>
              {i % 4 === 0 && <span className="pulse" />}
            </div>
          ))}
        </div>
        <div className="hero-bg-grid" />
      </div>

      <div className="container">
        <div className="hero-meta">
          <div className="hero-meta-block">
            <span>EST.</span>
            <span className="v">2019</span>
          </div>
          <div className="hero-meta-block">
            <span>AMMAN</span>
            <span className="v">·</span>
            <span>RIYADH</span>
          </div>
          <div className="hero-meta-block">
            <span>SHOWREEL</span>
            <span className="v">2025</span>
          </div>
        </div>

        <h1 className="hero-title">
          <span className="word w1"><span>WHERE</span></span>{" "}
          <span className="word w2"><span>STRATEGY</span></span>
          <br />
          <span className="word w3"><span className="ital">MEETS</span></span>{" "}
          <span className="word w4"><span>BOLD</span></span>
          <br />
          <span className="word w5"><span>STORYTELLING</span></span>
        </h1>

        <div className="hero-bottom">
          <p className="hero-blurb">
            <b>A creative powerhouse</b> with offices in Amman and Riyadh, delivering bold ideas
            and meaningful results across the GCC. We don't pitch campaigns — we embed with B2B
            brands and build them into category leaders.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num" data-target="178">178%</div>
              <div className="lbl">Client growth</div>
            </div>
            <div className="hero-stat">
              <div className="num">$1B</div>
              <div className="lbl">Unicorn built</div>
            </div>
            <div className="hero-stat">
              <div className="num">30+</div>
              <div className="lbl">Brand partners</div>
            </div>
            <div className="hero-stat">
              <div className="num">500+</div>
              <div className="lbl">Businesses created</div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        Scroll <span className="line" /> 01 / 09
      </div>
    </header>
  );
}

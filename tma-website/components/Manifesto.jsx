function Manifesto() {
  return (
    <section className="section" id="manifesto">
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />01 / Manifesto</div>
          <div className="meta">A creative powerhouse, not<br/>a traditional agency.</div>
          <h2>
            We don't pitch.<br />
            <span className="ital">We embed.</span><br />
            <span className="stroke">We build.</span>
          </h2>
        </div>

        <div className="manifesto-body">
          <div className="lhs">
            ETHOS<br />
            01 — Embed deeply<br />
            02 — Think strategically<br />
            03 — Build with ROI<br />
            04 — Move markets
          </div>
          <div className="rhs">
            <p>
              Unlike traditional agencies, we immerse ourselves deeply in our clients' businesses.
              We don't just create campaigns — we become an extension of your team. From understanding
              your product inside-out to identifying pain points and growth levers, we think
              strategically, creatively, and with ROI at the core of every project.
            </p>
            <p>
              Our strength lies in transforming B2B brands into culturally relevant, emotionally
              engaging, and business-driven experiences. We craft communication that resonates,
              visuals that convert, and strategies that move markets.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
window.Manifesto = Manifesto;

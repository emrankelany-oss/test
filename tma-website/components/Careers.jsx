function Careers() {
  const opps = [
    { role: "Senior Brand Strategist",       loc: "Riyadh · Full-time" },
    { role: "Art Director",                  loc: "Amman · Full-time" },
    { role: "Growth Marketing Lead",         loc: "Riyadh · Full-time" },
    { role: "Motion Designer",               loc: "Amman · Full-time" },
    { role: "Senior Account Director",       loc: "Riyadh · Full-time" },
  ];
  return (
    <section className="section dark" id="careers">
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />07 / Careers</div>
          <div className="meta">Bold ideas, built<br/>by bold people.</div>
        </div>

        <div className="careers">
          <h3>
            Build the work<br/>
            <span className="ital">you want</span> to be<br/>
            <span style={{textDecoration:"line-through", opacity:.4}}>known for.</span> known by.
          </h3>
          <div className="opps">
            {opps.map((o, i) => (
              <a className="opp-row" key={i} href="#">
                <span className="role">{o.role}</span>
                <span className="meta">{o.loc}</span>
                <span className="arr">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
window.Careers = Careers;

import Link from "next/link";

export default function Careers() {
  const opps = [
    { role: "Senior Brand Strategist", loc: "Riyadh · Full-time", id: "senior-brand-strategist" },
    { role: "Art Director", loc: "Amman · Full-time", id: "art-director" },
    { role: "Growth Marketing Lead", loc: "Riyadh · Full-time", id: "growth-marketing-lead" },
    { role: "Motion Designer", loc: "Amman · Full-time", id: "motion-designer" },
    { role: "Senior Account Director", loc: "Riyadh · Full-time", id: "senior-account-director" },
  ];
  return (
    <section className="section dark" id="careers">
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />07 / Careers</div>
          <div className="meta">Bold ideas, built<br />by bold people.</div>
        </div>

        <div className="careers">
          <h3>
            Build the work<br />
            <span className="ital">you want</span> to be<br />
            <span style={{ textDecoration: "line-through", opacity: 0.4 }}>known for.</span> known by.
          </h3>
          <div className="opps">
            {opps.map((o, i) => (
              <Link className="opp-row" key={i} href={`/careers#${o.id}`}>
                <span className="role">{o.role}</span>
                <span className="meta">{o.loc}</span>
                <span className="arr">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

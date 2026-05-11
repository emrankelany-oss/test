export default function About() {
  const team = [
    { name: "Mohamed Sabha", role: "Chief Executive Officer", file: "mohamed-sabha" },
    { name: "Omar Knio", role: "Chief Strategy Officer", file: "omar-knio" },
    { name: "Ahmad Sabha", role: "General Manager", file: "ahmad-sabha" },
    { name: "Rawan Addas", role: "Client Servicing Director", file: "rawan-addas" },
  ];
  return (
    <section className="section paper" id="about">
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />05 / About</div>
          <div className="meta">Amman · Riyadh<br />Built across the GCC.</div>
          <h2>
            Strategists<br />
            <span className="ital">&amp; makers.</span>
          </h2>
        </div>

        <div className="about-grid">
          <h3>We become part of your success story.</h3>
          <div>
            <p>
              We're a creative powerhouse with offices in Amman and Riyadh, delivering bold
              ideas and meaningful results across the GCC. We pair strategists, designers, film
              makers, and growth marketers under one roof — so the brief, the brand, and the
              business move together.
            </p>
            <p>
              We've shaped category leaders like Foodics and Zid from early stage to regional
              dominance — and the work we make next is built on the same playbook: clarity,
              confidence, and creativity in motion.
            </p>
          </div>
        </div>

        <div className="team-grid">
          {team.map((t, i) => (
            <div className="team-card" key={i}>
              <div className="team-photo">
                <img src={`/assets/team/${t.file}.png`} alt={t.name} loading="lazy" />
              </div>
              <div>
                <div className="team-name">{t.name}</div>
                <div className="team-role">{t.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="offices">
          <div className="office">
            <div className="country">— Office 01</div>
            <div className="city">Amman</div>
            <address>Al-Abdali, 432<br />Amman, Jordan</address>
            <div className="tels">
              <span>+962 79 924 5366</span>
              <span>+962 79 516 7170</span>
            </div>
          </div>
          <div className="office">
            <div className="country">— Office 02</div>
            <div className="city">Riyadh</div>
            <address>Al-Olaya<br />Riyadh, Saudi Arabia</address>
            <div className="tels">
              <span>+966 53 380 6028</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

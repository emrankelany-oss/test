export default function Services() {
  const items = [
    { n: "01", title: "Brand Strategy & Positioning", blurb: "We uncover crucial insights and craft compelling strategies that set the stage for brand growth, category leadership, and market expansion." },
    { n: "02", title: "Brand Design & Experience", blurb: "From identity systems to brand guidelines, we design brands that don't just look great — they build equity, drive consistency, and deliver ROI." },
    { n: "03", title: "Go-to-Market & Growth", blurb: "We develop complete GTM blueprints, launch playbooks, and marketing architectures that accelerate adoption and open new markets." },
    { n: "04", title: "Growth Marketing & Reputation", blurb: "Performance-driven campaigns that convert, paired with storytelling that puts your brand at the heart of cultural conversations." },
    { n: "05", title: "Event & Experience Marketing", blurb: "We bring brands to life through flagship events and immersive experiences that forge deep connections and build industry authority." },
    { n: "06", title: "Product Marketing & Innovation", blurb: "From concept to rollout, we help define, position, and launch products — turning big ideas into sales-driving realities." },
    { n: "07", title: "Social & Community Building", blurb: "Always-on social and community programs that turn audiences into advocates and conversations into category leadership." },
    { n: "08", title: "Content Studio & Production", blurb: "Our global content engine covers it all: editorial, film, design, animation, and transcreation — standout campaigns across every channel." },
  ];

  return (
    <section className="section paper" id="services">
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />02 / Capabilities</div>
          <div className="meta">Eight pillars.<br />One growth engine.</div>
          <h2>
            What we<br />
            <span className="ital">build.</span>
          </h2>
        </div>

        <div className="services-grid">
          {items.map((s) => (
            <div className="service" key={s.n}>
              <div>
                <div className="s-num">— {s.n}</div>
                <div className="s-title">{s.title}</div>
                <div className="s-blurb">{s.blurb}</div>
              </div>
              <div className="s-arrow">
                <span>Capability</span>
                <span>↗</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

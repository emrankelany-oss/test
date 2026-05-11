const STEPS = [
  {
    n: "01",
    title: "The Brief",
    body: "We embed inside the business. We listen. We map pain points, growth levers, and the cultural moments your category responds to — before we touch a deck.",
  },
  {
    n: "02",
    title: "The Approach",
    body: "Strategy, design, GTM and content move in lockstep. The same room that writes the manifesto builds the launch system, ships the campaign, and watches the dashboard.",
  },
  {
    n: "03",
    title: "The Outcome",
    body: "Category position. Revenue. Equity. We measure what moves — and stay long enough to scale it across markets, products, and merchant counts.",
  },
];

export default function HowWeWork() {
  return (
    <section className="pf-section pf-how" id="how-we-work">
      <div className="container">
        <div className="pf-section-head" data-reveal>
          <div className="pf-section-num">
            <span className="dot" />
            07 / How we work
          </div>
          <div className="pf-section-sub">Strategy first.</div>
          <h2 className="pf-section-title">
            Execution <span className="ital">always.</span>
          </h2>
        </div>

        <div className="pf-how-grid" data-reveal>
          {STEPS.map((s) => (
            <article key={s.n} className="pf-how-step">
              <div className="pf-how-n">{s.n}</div>
              <h3 className="pf-how-title">{s.title}</h3>
              <p className="pf-how-body">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

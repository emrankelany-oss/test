import { industries } from "@/data/portfolio";

export default function IndustriesList() {
  return (
    <section className="pf-section pf-industries" id="industries">
      <div className="container">
        <div className="pf-section-head" data-reveal>
          <div className="pf-section-num">
            <span className="dot" />
            08 / Industries we transform
          </div>
          <div className="pf-section-sub">From SaaS to sovereign.</div>
          <h2 className="pf-section-title">
            Eight sectors. <span className="ital">One playbook.</span>
          </h2>
        </div>

        <ul className="pf-industries-grid" data-reveal role="list">
          {industries.map((i) => (
            <li key={i.n} className="pf-industry">
              <span className="pf-industry-n">{i.n}</span>
              <span className="pf-industry-name">{i.name}</span>
              <span className="pf-industry-arrow" aria-hidden="true">
                ↗
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

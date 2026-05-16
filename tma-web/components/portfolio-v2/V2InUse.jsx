"use client";

const CLIENTS = [
  { name: "Foodics", tag: "F&B platform" },
  { name: "Zid", tag: "Total commerce" },
  { name: "InvoiceQ", tag: "B2B SaaS" },
  { name: "Burger King KSA", tag: "QSR" },
  { name: "Salasa", tag: "Logistics" },
  { name: "Vodafone", tag: "Telecom" },
];

export default function V2InUse() {
  return (
    <section className="v2-in-use" data-section="in-use" data-theme="light" id="close">
      <div className="v2-in-use-inner">
        <div className="v2-section-num v2-section-num--dark">
          <span className="dot" />
          06 / In good company
        </div>

        <h2 className="v2-in-use-title">
          Lenis-smooth handoff to your <span className="ital">team.</span>
        </h2>

        <ul className="v2-client-list">
          {CLIENTS.map((c, i) => (
            <li key={c.name} className="v2-client-row">
              <span className="v2-client-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="v2-client-name">{c.name}</span>
              <span className="v2-client-tag">{c.tag}</span>
              <span className="v2-client-arrow">↗</span>
            </li>
          ))}
        </ul>

        <div className="v2-in-use-cta-row">
          <a className="v2-cta v2-cta--dark" href="/#contact">
            Book a discovery call <span>↗</span>
          </a>
          <a className="v2-cta v2-cta--dark-ghost" href="/portfolio">
            Browse V1 portfolio <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}

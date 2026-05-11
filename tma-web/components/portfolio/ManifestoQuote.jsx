import { manifestoQuotes } from "@/data/portfolio";

export default function ManifestoQuote() {
  const [primary, secondary] = manifestoQuotes;
  return (
    <section className="pf-section pf-quote" id="manifesto">
      <div className="container">
        <div className="pf-section-head" data-reveal>
          <div className="pf-section-num">
            <span className="dot" />
            06 / What we believe
          </div>
          <div className="pf-section-sub">In our own words.</div>
          <h2 className="pf-section-title">
            How we <span className="ital">work.</span>
          </h2>
        </div>

        <figure className="pf-pullquote pf-pullquote--primary" data-reveal>
          <span className="pf-quote-mark" aria-hidden="true">
            &ldquo;
          </span>
          <blockquote>{primary.body}</blockquote>
          <figcaption>— {primary.cite}</figcaption>
        </figure>

        {secondary && (
          <figure className="pf-pullquote pf-pullquote--secondary">
            <blockquote>{secondary.body}</blockquote>
            <figcaption>— {secondary.cite}</figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}

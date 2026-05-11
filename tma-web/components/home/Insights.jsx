import Link from "next/link";

export default function Insights() {
  const posts = [
    { tag: "GTM", date: "Apr 2026", title: "Why B2B brands in the GCC win on brand, not on bid.", read: "8 min", href: "/article/gtm-brand-not-bid" },
    { tag: "Brand", date: "Mar 2026", title: "From POS to platform: lessons from Foodics' unicorn arc.", read: "12 min", href: "/article/foodics-platform" },
    { tag: "Events", date: "Feb 2026", title: "How to turn a product launch into a category-defining moment.", read: "6 min", href: "/article/launch-as-category" },
  ];
  return (
    <section className="section" id="insights">
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />06 / Insights</div>
          <div className="meta">Field notes from<br />the front lines.</div>
          <h2>
            Strategy,<br />
            <span className="ital">in the open.</span>
          </h2>
        </div>

        <div className="insights-grid">
          {posts.map((p, i) => (
            <Link className="insight" key={i} href={p.href}>
              <div>
                <div className="i-meta">
                  <span>— {p.tag}</span>
                  <span>{p.date}</span>
                </div>
                <h4 className="i-title">{p.title}</h4>
              </div>
              <div className="i-foot">
                <span>{p.read} read</span>
                <span>↗</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

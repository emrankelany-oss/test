// Shared header/footer + article layout used by all article pages.
// Reuses CaseNav and CaseFooter from CaseLayout.jsx.

function ArticleHero({ tag, date, readTime, title, deck }) {
  return (
    <header className="article-hero" id="top">
      <div className="container">
        <div className="article-hero-meta">
          <a href="index.html#insights" className="case-back"><span>↩</span> All insights</a>
          <div className="article-hero-meta-row">
            <span className="tag">— {tag}</span>
            <span>{date}</span>
            <span>{readTime} read</span>
          </div>
        </div>

        <h1 className="article-hero-title">{title}</h1>

        <div className="article-hero-bottom">
          <p className="article-hero-deck">{deck}</p>
          <div className="article-byline">
            <span className="role">— Words</span>
            <span className="author">TMA Editorial</span>
            <span className="role">The Motion Agency</span>
          </div>
        </div>
      </div>
    </header>
  );
}
window.ArticleHero = ArticleHero;

function ArticleBody({ children }) {
  return (
    <section className="article-body">
      <div className="container">
        <div className="article-body-inner">{children}</div>
      </div>
    </section>
  );
}
window.ArticleBody = ArticleBody;

function ArticleCallout({ kicker, children }) {
  return (
    <aside className="article-callout">
      {kicker && <div className="mono">— {kicker}</div>}
      <div className="big">{children}</div>
    </aside>
  );
}
window.ArticleCallout = ArticleCallout;

function ArticleStats({ items }) {
  return (
    <div className="article-stats">
      {items.map((it, i) => (
        <div className="stat" key={i}>
          <div className="num">{it.v}</div>
          <div className="lbl">{it.l}</div>
        </div>
      ))}
    </div>
  );
}
window.ArticleStats = ArticleStats;

function ArticleFigure({ caption, label }) {
  return (
    <figure>
      <div className="placeholder">{label || "Figure"}</div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
window.ArticleFigure = ArticleFigure;

function ArticleSignoff({ children }) {
  return (
    <div className="article-signoff">
      <div className="mono">— Endnote</div>
      {children}
    </div>
  );
}
window.ArticleSignoff = ArticleSignoff;

function ArticleRelated({ items }) {
  return (
    <section className="article-related">
      <div className="container">
        <div className="article-related-head">
          <div className="mono">— Keep reading</div>
          <h3>More from <span className="ital">the studio.</span></h3>
        </div>
        <div className="article-related-grid">
          {items.map((it, i) => (
            <a className="article-related-card" key={i} href={it.href}>
              <div className="meta">
                <span>— {it.tag}</span>
                <span>{it.date}</span>
              </div>
              <h4>{it.title}</h4>
              <div className="foot">
                <span>{it.read} read</span>
                <span>↗</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
window.ArticleRelated = ArticleRelated;

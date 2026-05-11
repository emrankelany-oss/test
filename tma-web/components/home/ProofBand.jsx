export default function ProofBand() {
  const stats = [
    { v: "178%", l: "Avg. client growth" },
    { v: "30+", l: "Brand partners" },
    { v: "500+", l: "Businesses created" },
    { v: "29+", l: "Strategists & makers" },
  ];
  return (
    <section className="proof-band" id="numbers">
      <div className="container">
        <div className="proof-grid">
          {stats.map((s, i) => (
            <div key={i} className="proof-cell">
              <div className="num">{s.v}</div>
              <div className="lbl">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

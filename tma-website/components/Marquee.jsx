function Marquee({ items, inv }) {
  const doubled = [...items, ...items];
  return (
    <div className={`marquee ${inv ? "inv" : ""}`}>
      <div className="marquee-track">
        {doubled.map((it, i) => (
          <span key={i} className="marquee-item">
            {it}
            <span className="star" />
          </span>
        ))}
      </div>
    </div>
  );
}
window.Marquee = Marquee;

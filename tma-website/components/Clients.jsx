function Clients() {
  const list = [
    { name: "Zid",                 file: "zid" },
    { name: "Salasa",              file: "salasa" },
    { name: "Sol",                 file: "sol" },
    { name: "Foodics",             file: "foodics" },
    { name: "Webook",              file: "webook" },
    { name: "Cyberx",              file: "cyberx" },
    { name: "Zaintech",            file: "zaintech" },
    { name: "Jadwa Investment",    file: "jadwa" },
    { name: "LSC",                 file: "lsc" },
    { name: "Ministry of Economy", file: "ministry-economy" },
    { name: "Flex",                file: "flex" },
    { name: "Reflect",             file: "reflect" },
    { name: "Arab Bank",           file: "arab-bank" },
    { name: "Burger King",         file: "burger-king" },
    { name: "Electrolux",          file: "electrolux" },
    { name: "Aramco",              file: "aramco" },
    { name: "Shaker Group",        file: "shaker-group" },
    { name: "Alissar",             file: "alissar" },
    { name: "Buffalo Wild Wings",  file: "buffalo-wild-wings" },
    { name: "Abu Kass",            file: "abu-kass" },
    { name: "InvoiceQ",            file: "invoiceq" },
    { name: "Cairo Amman Bank",    file: "cairo-amman-bank" },
    { name: "Western Union",       file: "western-union" },
    { name: "Bank of Jordan",      file: "bank-of-jordan" },
  ];
  // Split into two rows for richer visual rhythm; each row scrolls right-to-left at different speeds
  const half = Math.ceil(list.length / 2);
  const rowA = list.slice(0, half);
  const rowB = list.slice(half);

  const renderRow = (items, speed) => {
    const doubled = [...items, ...items]; // seamless loop
    return (
      <div className="logo-marquee" style={{ "--speed": speed }}>
        <div className="logo-track">
          {doubled.map((c, i) => (
            <div className="logo-cell" key={`${c.file}-${i}`} title={c.name}>
              <img src={`assets/logos/${c.file}.png?v=3`} alt={c.name} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="section" id="clients">
      <div className="container">
        <div className="section-head">
          <div className="num"><span className="dot" />04 / Partners</div>
          <div className="meta">Brands that bet<br/>on bold storytelling.</div>
          <h2>
            In good<br/>
            <span className="ital">company.</span>
          </h2>
        </div>
      </div>

      <div className="logo-marquees">
        {renderRow(rowA, "60s")}
        {renderRow(rowB, "75s")}
      </div>
    </section>
  );
}
window.Clients = Clients;


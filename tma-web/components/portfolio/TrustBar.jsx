const LOGOS = [
  { src: "/assets/logos/foodics.png", alt: "Foodics" },
  { src: "/assets/logos/zid.png", alt: "Zid" },
  { src: "/assets/logos/zaintech.png", alt: "Zaintech" },
  { src: "/assets/logos/jadwa.png", alt: "Jadwa Investment" },
  { src: "/assets/logos/webook.png", alt: "Webook" },
  { src: "/assets/logos/invoiceq.png", alt: "InvoiceQ" },
  { src: "/assets/logos/salasa.png", alt: "Salasa" },
  { src: "/assets/logos/sol.png", alt: "Sól" },
  { src: "/assets/logos/electrolux.png", alt: "Electrolux" },
  { src: "/assets/logos/burger-king.png", alt: "Burger King" },
  { src: "/assets/logos/aramco.png", alt: "Aramco" },
  { src: "/assets/logos/arab-bank.png", alt: "Arab Bank" },
  { src: "/assets/logos/cairo-amman-bank.png", alt: "Cairo Amman Bank" },
  { src: "/assets/logos/bank-of-jordan.png", alt: "Bank of Jordan" },
  { src: "/assets/logos/western-union.png", alt: "Western Union" },
  { src: "/assets/logos/ministry-economy.png", alt: "Ministry of Economy" },
  { src: "/assets/logos/abu-kass.png", alt: "Abu Kass" },
  { src: "/assets/logos/alissar.png", alt: "Alissar" },
  { src: "/assets/logos/buffalo-wild-wings.png", alt: "Buffalo Wild Wings" },
  { src: "/assets/logos/shaker-group.png", alt: "Shaker Group" },
  { src: "/assets/logos/cyberx.png", alt: "Cyberx" },
  { src: "/assets/logos/flex.png", alt: "Flex" },
  { src: "/assets/logos/lsc.png", alt: "LSC" },
  { src: "/assets/logos/reflect.png", alt: "Reflect" },
];

export default function TrustBar() {
  const doubled = [...LOGOS, ...LOGOS];
  return (
    <section className="pf-trust" id="trust">
      <div className="container">
        <div className="pf-section-head pf-section-head--inline">
          <span className="pf-section-sub">In good company.</span>
          <h2 className="pf-section-title pf-section-title--sm">
            Brands that bet on bold storytelling.
          </h2>
        </div>
      </div>
      <div className="pf-logo-track">
        <div className="pf-logo-row">
          {doubled.map((logo, i) => (
            <div key={i} className="pf-logo">
              <img src={logo.src} alt={logo.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

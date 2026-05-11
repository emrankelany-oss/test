import CaseSpotlight from "./CaseSpotlight";

export default function CaseSpotlightSection() {
  return (
    <section className="pf-section pf-spotlights" id="spotlights">
      <div className="container">
        <div className="pf-section-head" data-reveal>
          <div className="pf-section-num">
            <span className="dot" />
            04 / Signature cases
          </div>
          <div className="pf-section-sub">Two stories.</div>
          <h2 className="pf-section-title">
            One <span className="ital">playbook.</span>
          </h2>
        </div>

        <CaseSpotlight
          num="01"
          client="Foodics"
          project="Boundless 22 · 23"
          year="2022 — 2023"
          headline={
            <>
              Boundless: launching what&apos;s <span className="ital">next</span> for F&amp;B.
            </>
          }
          challenge="Foodics was perceived as a POS provider while it had quietly become a full F&B growth platform — payments, lending, marketplace, analytics."
          insight="The market needed a stage to see the new Foodics, not a deck to read about it. We turned the keynote into the product."
          solution="Two flagship events that reframed the category. From Foodics Pay & Capital to the Marketplace — every launch made complex products feel essential and easy."
          metrics={[
            { v: "+35.6%", l: "YoY revenue '24" },
            { v: "32K+", l: "Active merchants" },
            { v: "35%", l: "KSA market share" },
            { v: "4", l: "Countries" },
          ]}
          image="/assets/case-foodics-boundless.png"
          href="/case/foodics-boundless"
        />

        <CaseSpotlight
          flip
          num="02"
          client="Zid"
          project="Ripple 2024"
          year="2024"
          headline={
            <>
              Ripple: launching the Total <span className="ital">Commerce</span> era.
            </>
          }
          challenge="Merchants were stuck juggling fragmented tools across e-commerce, social, and physical retail — and Zid was still seen as a storefront builder, not a unified platform."
          insight="The future of commerce isn't a channel. It's an operating system. Zid needed a defining moment to claim it."
          solution="A flagship event in Diriyah for 1,000+ merchants. We unveiled Total Commerce — unified dashboard, AI-powered marketing, cross-border logistics — and rewired how the region thinks about merchant growth."
          metrics={[
            { v: "+200%", l: "YoY growth" },
            { v: "12K+", l: "Active merchants" },
            { v: "+50%", l: "Basket lift" },
            { v: "+25%", l: "GMV YoY" },
          ]}
          image="/assets/case-zid-ripple.png"
          href="/case/zid-ripple"
        />
      </div>
    </section>
  );
}

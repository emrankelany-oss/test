// Zid — Ripple 2024 case-study page

function CaseZidApp() {
  return (
    <div className="case-page">
      <CaseNav />

      <CaseHero
        num="02"
        client="Zid"
        project="Ripple 2024"
        year="2024"
        services={["Brand experience", "Product launch", "Event marketing", "GTM strategy"]}
        badge="200% growth"
        image="assets/case-zid-ripple.png"
        headline={
          <>
            Ripple: launching the
            <br />
            Total <span className="ital">Commerce</span> era.
          </>
        }
        intro="A flagship moment in Diriyah for 1,000+ merchants. We unveiled Zid's unified Total Commerce platform — e-commerce, social, in-store, and cross-border — and rewired how the region thinks about merchant growth."
      />

      <CaseSection num="01" kicker="The Brief" title={<>From e-commerce platform to <span className="ital">commerce OS.</span></>}>
        <div className="case-cols">
          <p className="lead">
            Zid had spent five years becoming the default home for Saudi
            online stores. But merchants had moved on — they were selling on
            TikTok, in-store, on WhatsApp, on marketplaces, across borders.
            E-commerce wasn't enough.
          </p>
          <p>
            The brief: launch <b>Total Commerce</b> — Zid's unified vision
            spanning e-commerce, social, in-store and cross-border — in a
            single moment that resets how 12,000+ active merchants and the
            broader market understand what Zid does.
          </p>
          <p>
            We named the moment <b>Ripple</b>. Diriyah. One stage. One
            platform reveal. One ripple effect across the region's
            merchant economy.
          </p>
        </div>
      </CaseSection>

      <CaseSection num="02" kicker="The Approach" title={<>A platform launch built like a <span className="ital">cultural</span> event.</>} dark>
        <div className="case-approach">
          <div className="case-approach-item">
            <div className="mono">— 01 Strategy</div>
            <h4>Reframe the category, not just the product.</h4>
            <p>
              We anchored Zid's story on a single idea: <em>Total Commerce</em>.
              Not a feature, not a tagline — a category. Every product
              announcement, partner integration and merchant story laddered
              up to it.
            </p>
          </div>
          <div className="case-approach-item">
            <div className="mono">— 02 Experience</div>
            <h4>Diriyah, designed end-to-end.</h4>
            <p>
              We built the full event identity, stage, content design, and
              keynote production — including a custom motion system that
              translated "ripple" into a visual language across screens, set,
              and post-event content.
            </p>
          </div>
          <div className="case-approach-item">
            <div className="mono">— 03 Activation</div>
            <h4>1,000+ merchants. One playbook.</h4>
            <p>
              Beyond the keynote: a merchant-led activation program — partner
              booths, hands-on Total Commerce demos, success stories on
              stage, and an on-site content studio capturing testimonials in
              real time.
            </p>
          </div>
        </div>
      </CaseSection>

      <CaseSection num="03" kicker="The Film" title={<>Watch the <span className="ital">launch.</span></>}>
        <CaseVideo videoId="GSSS71zV5HI" title="Zid — Ripple 2024" />
      </CaseSection>

      <CaseSection num="04" kicker="The Outcome" title={<>The ripple turned into <span className="ital">a wave.</span></>} dark>
        <CaseMetrics
          items={[
            { v: "+200%", l: "YoY growth", note: "Post-Ripple commercial year" },
            { v: "12K+",  l: "Active merchants", note: "On the Total Commerce platform" },
            { v: "+50%",  l: "Basket size lift", note: "Across cross-channel merchants" },
            { v: "1K+",   l: "Merchants on-site", note: "Diriyah flagship event" },
          ]}
        />

        <CasePullQuote
          quote="Ripple wasn't an event — it was the moment our merchants understood what we'd actually become."
          attribution="Senior leadership, Zid"
        />
      </CaseSection>

      <CaseSection num="05" kicker="What we did" title={<>Scope of <span className="ital">work.</span></>}>
        <div className="case-scope">
          <div><span className="mono">— 01</span><h5>Brand &amp; Identity</h5><p>Ripple naming, event identity, motion system, kinetic typography, partner brand kit.</p></div>
          <div><span className="mono">— 02</span><h5>Strategy</h5><p>Total Commerce narrative, keynote script, merchant segmentation, partner positioning.</p></div>
          <div><span className="mono">— 03</span><h5>Experience</h5><p>Stage design, set, run-of-show, lighting and sound direction, technical rehearsal in Diriyah.</p></div>
          <div><span className="mono">— 04</span><h5>Film &amp; Content</h5><p>Keynote film, product reveals, merchant testimonials, post-event sizzle &amp; long-form recap.</p></div>
          <div><span className="mono">— 05</span><h5>GTM</h5><p>Pre-event teasers, partner activation, merchant comms, regional press, founder-led campaign.</p></div>
          <div><span className="mono">— 06</span><h5>Amplification</h5><p>Social cuts, paid distribution, on-site content studio, post-event 90-day rollout.</p></div>
        </div>
      </CaseSection>

      <CaseNext
        num="01"
        client="Foodics"
        project="Boundless"
        href="case-foodics-boundless.html"
        image="assets/case-foodics-boundless.png"
      />

      <CaseFooter />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<CaseZidApp />);

// Foodics — Boundless case-study page

function CaseFoodicsApp() {
  return (
    <div className="case-page">
      <CaseNav />

      <CaseHero
        num="01"
        client="Foodics"
        project="Boundless"
        year="2022 — 2023"
        services={["Event marketing", "GTM strategy", "Brand strategy", "Content production"]}
        badge="$1B unicorn"
        image="assets/case-foodics-boundless.png"
        headline={
          <>
            Boundless: launching what's
            <br />
            <span className="ital">next</span> for F&amp;B.
          </>
        }
        intro="Two flagship product events that turned the stage into a launchpad. We unveiled Foodics Pay, Capital, and the Marketplace — and reframed Foodics from POS provider to the growth engine of the F&B industry across the GCC."
      />

      <CaseSection num="01" kicker="The Brief" title={<>From POS provider to <span className="ital">platform.</span></>}>
        <div className="case-cols">
          <p className="lead">
            Foodics had outgrown its category. The product had quietly become an
            operating system for restaurants — POS, payments, capital, supply,
            data — but the market still saw it as "the iPad cashier."
          </p>
          <p>
            Our brief: build a stage-worthy moment that re-introduces Foodics on
            its own terms. Not a product update. A category-defining event for
            the entire F&amp;B industry, designed to reach 32,000+ active
            merchants, regulators, investors and partners across Saudi Arabia,
            UAE, Egypt, Kuwait and Jordan.
          </p>
          <p>
            We called it <b>Boundless</b>. Two flagship editions, two years —
            built end-to-end by TMA, from naming and brand identity through
            stage, film, GTM, and post-event amplification.
          </p>
        </div>
      </CaseSection>

      <CaseSection num="02" kicker="The Approach" title={<>One narrative. Three <span className="ital">launches.</span> A category.</>} dark>
        <div className="case-approach">
          <div className="case-approach-item">
            <div className="mono">— 01 Strategy</div>
            <h4>Reposition the brand around growth, not hardware.</h4>
            <p>
              We rewrote Foodics' narrative around <em>boundless growth</em> —
              positioning every product (Pay, Capital, Marketplace) as a lever
              merchants pull to scale, not a feature in a stack. One story,
              every channel, every keynote slide.
            </p>
          </div>
          <div className="case-approach-item">
            <div className="mono">— 02 Experience</div>
            <h4>A stage that told the story before a word was said.</h4>
            <p>
              We designed the full event identity, set, motion graphics, and
              keynote film in-house — anchored on a kinetic identity system
              that scaled from a 30-second teaser to a 2,000-person main stage
              and a sub-30-minute on-stage product reveal.
            </p>
          </div>
          <div className="case-approach-item">
            <div className="mono">— 03 GTM</div>
            <h4>Launch beyond the room.</h4>
            <p>
              Boundless wasn't a single day. We built a 90-day rollout — pre-event
              teasers, partner activations, regional press, merchant comms,
              social cuts, and sales enablement — so the moment translated into
              pipeline, not just applause.
            </p>
          </div>
        </div>
      </CaseSection>

      <CaseSection num="03" kicker="The Film" title={<>Watch the <span className="ital">launch.</span></>}>
        <CaseVideo videoId="uzd9os9G1d8" title="Foodics — Boundless '23" />
      </CaseSection>

      <CaseSection num="04" kicker="The Outcome" title={<>Numbers that moved the <span className="ital">category.</span></>} dark>
        <CaseMetrics
          items={[
            { v: "+35.6%", l: "YoY revenue '24", note: "Off the back of Boundless launches" },
            { v: "32K+",   l: "Active merchants", note: "Across KSA, UAE, EG, KW, JO" },
            { v: "35%",    l: "KSA market share", note: "Category leader by volume" },
            { v: "$1B",    l: "Unicorn valuation", note: "Series-C, post-Boundless" },
          ]}
        />

        <CasePullQuote
          quote="TMA didn't deliver an event. They delivered the moment Foodics stopped being a POS company and started being a platform."
          attribution="Senior leadership, Foodics"
        />
      </CaseSection>

      <CaseSection num="05" kicker="What we did" title={<>Scope of <span className="ital">work.</span></>}>
        <div className="case-scope">
          <div><span className="mono">— 01</span><h5>Brand &amp; Identity</h5><p>Event naming, identity system, motion language, on-stage typography, partner brand kit.</p></div>
          <div><span className="mono">— 02</span><h5>Strategy</h5><p>Narrative architecture, product positioning, keynote script, audience segmentation across 5 markets.</p></div>
          <div><span className="mono">— 03</span><h5>Experience</h5><p>Stage design, set build supervision, lighting direction, run-of-show, technical rehearsal.</p></div>
          <div><span className="mono">— 04</span><h5>Film &amp; Content</h5><p>Keynote film, product reveal animations, merchant testimonials, post-event highlight reel.</p></div>
          <div><span className="mono">— 05</span><h5>GTM</h5><p>90-day launch plan, regional press, partner activation, merchant comms, sales enablement assets.</p></div>
          <div><span className="mono">— 06</span><h5>Amplification</h5><p>Social cuts, paid distribution, organic LinkedIn campaigns, founder-led content rollout.</p></div>
        </div>
      </CaseSection>

      <CaseNext
        num="02"
        client="Zid"
        project="Ripple 2024"
        href="case-zid-ripple.html"
        image="assets/case-zid-ripple.png"
      />

      <CaseFooter />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<CaseFoodicsApp />);

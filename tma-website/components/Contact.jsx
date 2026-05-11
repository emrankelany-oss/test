function Contact() {
  const [sent, setSent] = React.useState(false);
  const submit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name    = (data.get("name")    || "").toString();
    const company = (data.get("company") || "").toString();
    const email   = (data.get("email")   || "").toString();
    const need    = (data.get("need")    || "").toString();
    const message = (data.get("message") || "").toString();

    const subject = `New brief — ${company || name}`.trim();
    const body =
`Name: ${name}
Company: ${company}
Email: ${email}
Need: ${need}

Brief:
${message}
`;
    const href = `mailto:info@themotionagency.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;

    setSent(true);
    setTimeout(() => setSent(false), 4500);
  };
  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="section-head" style={{borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.7)"}}>
          <div className="num"><span className="dot" style={{background:"#fff"}} />08 / Contact</div>
          <div className="meta">Amman · Riyadh<br/>+ remote, anywhere.</div>
        </div>

        <h2 className="contact-headline">
          Let's build<br/>
          <span className="ital">bold stories</span><br/>
          <span>with impact.</span>
        </h2>

        <div className="contact-grid">
          <div>
            <p>
              If you have a brand to launch, a product to position, or a category to define —
              tell us where you're headed and what's in the way. We'll come back within 48 hours
              with first thoughts, not a deck of templates.
            </p>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginTop:32}}>
              <div>
                <div className="label" style={{opacity:.5, marginBottom:8}}>General</div>
                <a href="mailto:info@themotionagency.net" style={{fontSize:18, fontWeight:600}}>info@themotionagency.net</a>
              </div>
              <div>
                <div className="label" style={{opacity:.5, marginBottom:8}}>Press</div>
                <a href="mailto:press@themotionagency.net" style={{fontSize:18, fontWeight:600}}>press@themotionagency.net</a>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={submit}>
            <input name="name" placeholder="Your name *" required />
            <input name="company" placeholder="Company *" required />
            <input name="email" type="email" placeholder="Email *" required />
            <select name="need" defaultValue="" required>
              <option value="" disabled>What do you need help with? *</option>
              <option>Brand strategy &amp; positioning</option>
              <option>Brand design &amp; identity</option>
              <option>Go-to-market &amp; growth</option>
              <option>Event &amp; experience</option>
              <option>Content &amp; production</option>
              <option>All of the above</option>
            </select>
            <textarea name="message" placeholder="Tell us where you're headed *" required />
            <button className="contact-submit" type="submit">
              {sent ? "Opening your email — thanks ↗" : <>Send brief <span>↗</span></>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
window.Contact = Contact;

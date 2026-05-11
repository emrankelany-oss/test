// Careers page app — uses CaseNav + CaseFooter from CaseLayout.

function CareersHero() {
  return (
    <header className="careers-hero" id="top">
      <div className="container">
        <div className="careers-hero-meta">
          <a href="index.html#top" className="case-back"><span>↩</span> Back to TMA</a>
          <div className="careers-hero-meta-row">
            <span className="mono">— Careers</span>
            <span className="mono">Amman · Riyadh</span>
            <span className="mono">2026 / OPEN</span>
          </div>
        </div>

        <h1 className="careers-hero-title">
          Build the work<br />
          <span className="ital">you want</span> to be<br />
          <span style={{textDecoration:"line-through", opacity:.4}}>known for.</span> known by.
        </h1>

        <div className="careers-hero-bottom">
          <p className="careers-hero-intro">
            We're a creative powerhouse with offices in Amman and Riyadh, building
            category-defining brands across the GCC. We hire bold thinkers and
            craftspeople — strategists, designers, growth marketers, producers — who
            want to do the best work of their careers.
          </p>
          <a href="#openings" className="careers-hero-cta">
            See open roles <span>↓</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function RoleRow({ role, onApply }) {
  const [open, setOpen] = React.useState(false);
  return (
    <article className={`role-row ${open ? "open" : ""}`} id={role.id}>
      <button className="role-row-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="role-row-title">
          <h3>{role.title}</h3>
          <div className="role-row-meta">
            <span>{role.team}</span>
            <span>·</span>
            <span>{role.location}</span>
            <span>·</span>
            <span>{role.type}</span>
          </div>
        </div>
        <div className="role-row-toggle" aria-hidden="true">
          <span className="plus">{open ? "—" : "+"}</span>
          <span className="lbl">{open ? "Close" : "View role"}</span>
        </div>
      </button>

      {open && (
        <div className="role-row-body">
          <div className="role-summary">
            <div className="mono">— About the role</div>
            <p>{role.summary}</p>
          </div>

          <div className="role-cols">
            <div>
              <div className="mono">— What you'll do</div>
              <ul>
                {role.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <div className="mono">— What we're looking for</div>
              <ul>
                {role.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>

          <button className="role-apply-cta" onClick={() => onApply(role)}>
            Apply for this role <span>↗</span>
          </button>
        </div>
      )}
    </article>
  );
}

function ApplyForm({ role, onClose }) {
  const [cvName, setCvName] = React.useState("");
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name      = (data.get("name")     || "").toString();
    const email     = (data.get("email")    || "").toString();
    const phone     = (data.get("phone")    || "").toString();
    const portfolio = (data.get("portfolio")|| "").toString();
    const linkedin  = (data.get("linkedin") || "").toString();
    const note      = (data.get("note")     || "").toString();
    const file      = data.get("cv");

    const subject = `Application — ${role.title} (${role.location})`;
    const body =
`Role: ${role.title}
Location: ${role.location}
Type: ${role.type}

Name: ${name}
Email: ${email}
Phone: ${phone}
Portfolio: ${portfolio}
LinkedIn: ${linkedin}

Note:
${note}

— CV ATTACHMENT —
${file && file.name ? `Please attach: ${file.name}` : "No CV attached — please attach manually before sending."}
`;
    const href = `mailto:info@themotionagency.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setSent(true);
  };

  return (
    <div className="apply-overlay" onClick={(e) => { if (e.target.classList.contains("apply-overlay")) onClose(); }}>
      <div className="apply-modal">
        <button className="apply-close" onClick={onClose} aria-label="Close">
          <span>CLOSE</span>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" />
            <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <div className="apply-head">
          <div className="mono">— Apply for</div>
          <h2>{role.title}</h2>
          <div className="apply-meta">
            <span>{role.team}</span><span>·</span>
            <span>{role.location}</span><span>·</span>
            <span>{role.type}</span>
          </div>
        </div>

        {sent ? (
          <div className="apply-success">
            <div className="mono">— Almost done</div>
            <h3>Your email is opening now.</h3>
            <p>
              Your default email app should open with the application pre-filled and
              addressed to <b>info@themotionagency.net</b>. Please attach your CV
              <b> ({cvName || "your CV file"})</b> to the email before sending — most
              email clients can't auto-attach uploaded files.
            </p>
            <p className="apply-fallback">
              Email didn't open?
              {" "}
              <a href="mailto:info@themotionagency.net">Click here</a> to email us directly.
            </p>
            <button className="apply-success-cta" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="apply-form" onSubmit={submit}>
            <div className="apply-form-grid">
              <label>
                <span>Full name *</span>
                <input name="name" required />
              </label>
              <label>
                <span>Email *</span>
                <input name="email" type="email" required />
              </label>
              <label>
                <span>Phone</span>
                <input name="phone" type="tel" />
              </label>
              <label>
                <span>Portfolio URL</span>
                <input name="portfolio" type="url" placeholder="https://" />
              </label>
              <label className="full">
                <span>LinkedIn</span>
                <input name="linkedin" type="url" placeholder="https://linkedin.com/in/..." />
              </label>
              <label className="full">
                <span>CV / Resume *</span>
                <div className="apply-file">
                  <input
                    name="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                    onChange={(e) => setCvName(e.target.files[0]?.name || "")}
                    id="cv-input"
                  />
                  <label htmlFor="cv-input" className="apply-file-button">
                    {cvName ? "Change file" : "Choose file"}
                  </label>
                  <span className="apply-file-name">{cvName || "PDF, DOC or DOCX"}</span>
                </div>
                <small>You'll attach the actual file to the email after clicking Submit.</small>
              </label>
              <label className="full">
                <span>Why TMA? *</span>
                <textarea name="note" required placeholder="Tell us why you want this role and what you'd bring." />
              </label>
            </div>

            <button type="submit" className="apply-submit">
              Submit application <span>↗</span>
            </button>
            <p className="apply-disclaimer">
              By submitting you'll send your application to <b>info@themotionagency.net</b>.
              Please attach your CV to the email before sending.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function CareersApp() {
  const [applying, setApplying] = React.useState(null);

  return (
    <div className="case-page">
      <CaseNav />
      <CareersHero />

      <section className="case-section" id="openings">
        <div className="container">
          <div className="case-section-head">
            <div className="num"><span className="dot" />01 / Open roles</div>
            <h2>Now <span className="ital">hiring.</span></h2>
          </div>
          <div className="role-list">
            {ROLES.map((role) => (
              <RoleRow key={role.id} role={role} onApply={setApplying} />
            ))}
          </div>
        </div>
      </section>

      <section className="case-section dark">
        <div className="container">
          <div className="case-section-head">
            <div className="num"><span className="dot" />02 / Don't see your role?</div>
            <h2>Pitch us <span className="ital">anyway.</span></h2>
          </div>
          <div className="case-section-body">
            <p className="case-cols lead" style={{maxWidth:"60ch"}}>
              We're always open to bold strategists, designers, producers and operators
              who think they can move the work forward. Send your CV and a note about
              what you'd build at TMA.
            </p>
            <a
              href="mailto:info@themotionagency.net?subject=Open application — TMA"
              className="careers-hero-cta"
              style={{marginTop:32}}
            >
              Email info@themotionagency.net <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      <CaseFooter />

      {applying && <ApplyForm role={applying} onClose={() => setApplying(null)} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<CareersApp />);

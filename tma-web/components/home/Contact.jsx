"use client";
import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("_hp")) {
      setStatus("error");
      setErrorMsg("Submission rejected.");
      return;
    }
    const payload = {
      name: data.get("name") || "",
      company: data.get("company") || "",
      email: data.get("email") || "",
      need: data.get("need") || "",
      message: data.get("message") || "",
    };

    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setStatus("error");
        setErrorMsg(json.error || `Server error (${res.status}). Please try again or email info@themotionagency.net.`);
        return;
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(`Network error. Please try again or email info@themotionagency.net.`);
    }
  };

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div
          className="section-head"
          style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.7)" }}
        >
          <div className="num">
            <span className="dot" style={{ background: "#fff" }} />
            08 / Contact
          </div>
          <div className="meta">
            Amman · Riyadh<br />+ remote, anywhere.
          </div>
        </div>

        <h2 className="contact-headline">
          Let's build<br />
          <span className="ital">bold stories</span><br />
          <span>with impact.</span>
        </h2>

        <div className="contact-grid">
          <div>
            <p>
              If you have a brand to launch, a product to position, or a category to define —
              tell us where you're headed and what's in the way. We'll come back within 48 hours
              with first thoughts, not a deck of templates.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 32 }}>
              <div>
                <div className="label" style={{ opacity: 0.5, marginBottom: 8 }}>General</div>
                <a href="mailto:info@themotionagency.net" style={{ fontSize: 18, fontWeight: 600 }}>
                  info@themotionagency.net
                </a>
              </div>
              <div>
                <div className="label" style={{ opacity: 0.5, marginBottom: 8 }}>Press</div>
                <a href="mailto:press@themotionagency.net" style={{ fontSize: 18, fontWeight: 600 }}>
                  press@themotionagency.net
                </a>
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
            {/* honeypot */}
            <input
              type="text"
              name="_hp"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              aria-hidden="true"
            />
            <button className="contact-submit" type="submit" disabled={status === "submitting"}>
              {status === "submitting" && "Sending…"}
              {status === "success" && "Sent — we'll be in touch ↗"}
              {status === "error" && (
                <>
                  Try again <span>↗</span>
                </>
              )}
              {status === "idle" && (
                <>
                  Send brief <span>↗</span>
                </>
              )}
            </button>
            {status === "error" && (
              <div
                role="alert"
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  border: "1px solid rgba(255,90,90,0.4)",
                  background: "rgba(255,60,60,0.12)",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.04em",
                }}
              >
                {errorMsg}
              </div>
            )}
            {status === "success" && (
              <div
                role="status"
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  border: "1px solid rgba(33,208,122,0.4)",
                  background: "rgba(33,208,122,0.12)",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.04em",
                }}
              >
                Thanks — we received your brief and will respond within 48 hours.
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

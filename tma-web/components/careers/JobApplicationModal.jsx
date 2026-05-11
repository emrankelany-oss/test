"use client";
import { useEffect, useState } from "react";

const MAX_CV_BYTES = 9 * 1024 * 1024; // 9MB safety margin under Resend's 10MB attachment limit

export default function JobApplicationModal({ role, onClose }) {
  const [cvName, setCvName] = useState("");
  const [cvSize, setCvSize] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot
    if (data.get("_hp")) {
      setStatus("error");
      setErrorMsg("Submission rejected.");
      return;
    }

    const file = data.get("cv");
    if (!file || (file.size && file.size === 0)) {
      setStatus("error");
      setErrorMsg("Please attach your CV.");
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      setStatus("error");
      setErrorMsg(`CV is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 9 MB.`);
      return;
    }

    data.set("roleId", role.id);
    data.set("roleTitle", role.title);
    data.set("roleLocation", role.location);
    data.set("roleType", role.type);

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/apply", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setStatus("error");
        setErrorMsg(
          json.error ||
            `Server error (${res.status}). Please try again or email info@themotionagency.net with your CV attached.`
        );
        return;
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg("Network error. Please try again or email info@themotionagency.net with your CV attached.");
    }
  };

  return (
    <div
      className="apply-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("apply-overlay")) onClose();
      }}
    >
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

        {status === "success" ? (
          <div className="apply-success">
            <div className="mono">— Application sent</div>
            <h3>Thanks — your application is in.</h3>
            <p>
              We've received your details and CV
              {cvName ? <> (<b>{cvName}</b>)</> : null} and they're now in our hiring inbox at{" "}
              <b>info@themotionagency.net</b>. We review every application and aim to reply within
              5 working days.
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
                    onChange={(e) => {
                      const f = e.target.files[0];
                      setCvName(f?.name || "");
                      setCvSize(f?.size || 0);
                    }}
                    id="cv-input"
                  />
                  <label htmlFor="cv-input" className="apply-file-button">
                    {cvName ? "Change file" : "Choose file"}
                  </label>
                  <span className="apply-file-name">
                    {cvName
                      ? `${cvName}${cvSize ? ` · ${(cvSize / 1024 / 1024).toFixed(2)} MB` : ""}`
                      : "PDF, DOC or DOCX (max 9 MB)"}
                  </span>
                </div>
              </label>
              <label className="full">
                <span>Why TMA? *</span>
                <textarea name="note" required placeholder="Tell us why you want this role and what you'd bring." />
              </label>
            </div>

            {/* honeypot */}
            <input
              type="text"
              name="_hp"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              aria-hidden="true"
            />

            <button type="submit" className="apply-submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Sending…" : <>Submit application <span>↗</span></>}
            </button>

            {status === "error" && (
              <div
                role="alert"
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  border: "1px solid rgba(255,90,90,0.4)",
                  background: "rgba(255,60,60,0.08)",
                  color: "#000",
                  fontSize: 13,
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.04em",
                }}
              >
                {errorMsg}
              </div>
            )}

            <p className="apply-disclaimer">
              Your application + CV will be sent directly to <b>info@themotionagency.net</b>.
              We respect your privacy and will only use this for the hiring process.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

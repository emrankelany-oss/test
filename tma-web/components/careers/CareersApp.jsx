"use client";
import { useState } from "react";
import { ROLES } from "@/data/roles";
import { CaseNav, CaseFooter } from "@/components/case/CaseLayout";
import CareersHero from "./CareersHero";
import RoleRow from "./RoleRow";
import JobApplicationModal from "./JobApplicationModal";

export default function CareersApp() {
  const [applying, setApplying] = useState(null);

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
            <p className="case-cols lead" style={{ maxWidth: "60ch" }}>
              We're always open to bold strategists, designers, producers and operators
              who think they can move the work forward. Send your CV and a note about
              what you'd build at TMA.
            </p>
            <a
              href="mailto:info@themotionagency.net?subject=Open application — TMA"
              className="careers-hero-cta"
              style={{ marginTop: 32 }}
            >
              Email info@themotionagency.net <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      <CaseFooter />

      {applying && <JobApplicationModal role={applying} onClose={() => setApplying(null)} />}
    </div>
  );
}

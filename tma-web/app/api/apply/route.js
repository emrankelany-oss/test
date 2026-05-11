import { NextResponse } from "next/server";
import { resend, CONTACT_TO, FROM_ADDRESS, escapeHtml } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CV_BYTES = 9 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|doc|docx)$/i;

function s(v, max = 500) {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req) {
  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  if (s(form.get("_hp")).length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const name = s(form.get("name"));
  const email = s(form.get("email"));
  const phone = s(form.get("phone"));
  const portfolio = s(form.get("portfolio"));
  const linkedin = s(form.get("linkedin"));
  const note = s(form.get("note"), 10000);
  const roleId = s(form.get("roleId"));
  const roleTitle = s(form.get("roleTitle"));
  const roleLocation = s(form.get("roleLocation"));
  const roleType = s(form.get("roleType"));

  if (!name) return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  if (!note) return NextResponse.json({ ok: false, error: "Please tell us why TMA" }, { status: 400 });
  if (!roleTitle) return NextResponse.json({ ok: false, error: "Role information missing" }, { status: 400 });

  const cv = form.get("cv");
  if (!cv || typeof cv === "string" || !cv.size) {
    return NextResponse.json({ ok: false, error: "Please attach your CV" }, { status: 400 });
  }
  if (cv.size > MAX_CV_BYTES) {
    return NextResponse.json(
      { ok: false, error: `CV is too large (${(cv.size / 1024 / 1024).toFixed(1)} MB). Max 9 MB.` },
      { status: 400 }
    );
  }
  if (!ALLOWED_EXT.test(cv.name || "")) {
    return NextResponse.json({ ok: false, error: "CV must be PDF, DOC or DOCX" }, { status: 400 });
  }

  if (!resend) {
    return NextResponse.json(
      { ok: false, error: "Email service is not configured. Please email info@themotionagency.net with your CV." },
      { status: 503 }
    );
  }

  const buf = Buffer.from(await cv.arrayBuffer());

  const subject = `Application — ${roleTitle} (${roleLocation})`;
  const text =
    `Application: ${roleTitle} (${roleLocation}, ${roleType})\n` +
    `Role ID: ${roleId}\n\n` +
    `Name:      ${name}\n` +
    `Email:     ${email}\n` +
    `Phone:     ${phone || "—"}\n` +
    `Portfolio: ${portfolio || "—"}\n` +
    `LinkedIn:  ${linkedin || "—"}\n\n` +
    `Why TMA:\n${note}\n\n` +
    `CV attached: ${cv.name} (${(cv.size / 1024).toFixed(1)} KB)\n`;

  const html = `
    <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 6px;font-weight:800;">New application</h2>
      <p style="margin:0 0 20px;color:#666;">${escapeHtml(roleTitle)} · ${escapeHtml(roleLocation)} · ${escapeHtml(roleType)}</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.5;">
        <tr><td style="padding:6px 12px 6px 0;color:#888;width:90px;">Name</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;">Phone</td><td>${escapeHtml(phone) || "—"}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;">Portfolio</td><td>${portfolio ? `<a href="${escapeHtml(portfolio)}">${escapeHtml(portfolio)}</a>` : "—"}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;">LinkedIn</td><td>${linkedin ? `<a href="${escapeHtml(linkedin)}">${escapeHtml(linkedin)}</a>` : "—"}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;vertical-align:top;">CV</td><td>${escapeHtml(cv.name)} (${(cv.size / 1024).toFixed(1)} KB) — attached</td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-weight:700;">Why TMA</h3>
      <div style="white-space:pre-wrap;border-left:3px solid #000;padding-left:14px;color:#222;">${escapeHtml(note)}</div>
    </div>`;

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: CONTACT_TO,
      replyTo: email,
      subject,
      text,
      html,
      attachments: [{ filename: cv.name, content: buf }],
    });
    if (result.error) {
      console.error("[apply] resend error", result.error);
      return NextResponse.json(
        { ok: false, error: `Email provider error: ${result.error.message || "unknown"}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, id: result.data?.id }, { status: 200 });
  } catch (err) {
    console.error("[apply] send failure", err);
    return NextResponse.json(
      { ok: false, error: `Failed to send. Please email ${CONTACT_TO} with your CV attached.` },
      { status: 500 }
    );
  }
}

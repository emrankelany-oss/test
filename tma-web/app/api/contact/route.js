import { NextResponse } from "next/server";
import { z } from "zod";
import { resend, CONTACT_TO, FROM_ADDRESS, escapeHtml } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  company: z.string().trim().min(1, "Company is required").max(200),
  email: z.string().trim().email("Valid email required").max(200),
  need: z.string().trim().min(1, "Please choose what you need help with").max(200),
  message: z.string().trim().min(1, "Brief is required").max(10000),
  _hp: z.string().optional(),
});

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ ok: false, error: first.message }, { status: 400 });
  }
  const { name, company, email, need, message, _hp } = parsed.data;

  if (_hp && _hp.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!resend) {
    return NextResponse.json(
      { ok: false, error: "Email service is not configured. Please email info@themotionagency.net directly." },
      { status: 503 }
    );
  }

  const subject = `New brief — ${company || name}`;
  const text =
    `New brief from ${name} at ${company}\n\n` +
    `Name:    ${name}\n` +
    `Company: ${company}\n` +
    `Email:   ${email}\n` +
    `Need:    ${need}\n\n` +
    `Brief:\n${message}\n`;

  const html = `
    <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;font-weight:800;letter-spacing:-0.01em;">New brief</h2>
      <p style="margin:0 0 24px;color:#444;">From <b>${escapeHtml(name)}</b> at <b>${escapeHtml(company)}</b></p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.5;">
        <tr><td style="padding:6px 12px 6px 0;color:#888;width:80px;">Name</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;">Company</td><td>${escapeHtml(company)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;">Need</td><td>${escapeHtml(need)}</td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-weight:700;">Brief</h3>
      <div style="white-space:pre-wrap;border-left:3px solid #000;padding-left:14px;color:#222;">${escapeHtml(message)}</div>
    </div>`;

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: CONTACT_TO,
      replyTo: email,
      subject,
      text,
      html,
    });
    if (result.error) {
      console.error("[contact] resend error", result.error);
      return NextResponse.json(
        { ok: false, error: `Email provider error: ${result.error.message || "unknown"}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, id: result.data?.id }, { status: 200 });
  } catch (err) {
    console.error("[contact] send failure", err);
    return NextResponse.json(
      { ok: false, error: `Failed to send. Please email ${CONTACT_TO} directly.` },
      { status: 500 }
    );
  }
}

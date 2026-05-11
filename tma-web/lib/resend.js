import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const CONTACT_TO = process.env.CONTACT_TO || "Info@themotionagency.net";

// Until DNS is verified, send from Resend's sandbox sender.
// After verifying themotionagency.net in Resend, set RESEND_FROM=noreply@themotionagency.net.
export const FROM_ADDRESS =
  process.env.RESEND_FROM || "The Motion Agency <onboarding@resend.dev>";

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

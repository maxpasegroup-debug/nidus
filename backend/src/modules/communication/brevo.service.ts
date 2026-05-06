import { env } from "../../config/env.js";

type EmailPayload = {
  recipient: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
};

export function renderEmailTemplate(input: { title: string; body: string; actionLabel?: string; actionUrl?: string }) {
  const action = input.actionLabel && input.actionUrl ? `<p><a href="${input.actionUrl}" style="background:#0b1f3a;color:#f2d675;padding:12px 18px;text-decoration:none;border-radius:4px">${input.actionLabel}</a></p>` : "";
  return `<div style="font-family:Arial,sans-serif;background:#06111f;color:#eef4ff;padding:24px"><h2 style="color:#f2d675">${input.title}</h2><p>${input.body}</p>${action}<p style="color:#9fb0c7;font-size:12px">NIDUS Defence Training Platform</p></div>`;
}

export const brevoService = {
  async sendEmail(payload: EmailPayload) {
    if (!env.BREVO_API_KEY) {
      console.log("[BREVO_PLACEHOLDER]", payload);
      return { status: "SKIPPED_NO_API_KEY" };
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL, name: "NIDUS" },
        to: [{ email: payload.recipient }],
        subject: payload.subject,
        htmlContent: payload.htmlContent,
        textContent: payload.textContent
      })
    });

    if (!response.ok) throw new Error(`Brevo email failed with status ${response.status}`);
    return { status: "SENT" };
  }
};

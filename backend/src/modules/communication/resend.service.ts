import { env } from "../../config/env.js";
import { enqueueEmail } from "../../queues/email.queue.js";
import { logger } from "../../utils/logger.js";

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

export const resendService = {
  async sendEmail(payload: EmailPayload) {
    const job = await enqueueEmail(payload);
    if (job) return { status: "QUEUED", jobId: job.id };
    return this.sendEmailNow(payload);
  },

  async sendEmailNow(payload: EmailPayload) {
    if (!env.RESEND_API_KEY) {
      logger.warn("Resend API key missing; email skipped", { recipient: payload.recipient, subject: payload.subject });
      return { status: "SKIPPED_NO_API_KEY" };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [payload.recipient],
        subject: payload.subject,
        html: payload.htmlContent,
        text: payload.textContent
      })
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Resend email failed with status ${response.status}${details ? `: ${details}` : ""}`);
    }

    return { status: "SENT" };
  }
};

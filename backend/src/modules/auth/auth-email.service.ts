import { env } from "../../config/env.js";
import { brevoService, renderEmailTemplate } from "../communication/brevo.service.js";

function appUrl(path: string) {
  const base = env.FRONTEND_APP_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

export const authEmailService = {
  async sendVerificationEmail(input: { recipient: string; name: string; token: string }) {
    const url = appUrl(`/verify-email?token=${encodeURIComponent(input.token)}`);
    const body = `Hello ${input.name}, verify your NIDUS email to activate your account. This link expires in ${env.AUTH_VERIFY_TOKEN_MINUTES} minutes.`;
    return brevoService.sendEmail({
      recipient: input.recipient,
      subject: "Verify your NIDUS email",
      htmlContent: renderEmailTemplate({ title: "Verify your email", body, actionLabel: "Verify email", actionUrl: url }),
      textContent: `${body}\n${url}`
    });
  },

  async sendPasswordResetEmail(input: { recipient: string; name: string; token: string }) {
    const url = appUrl(`/reset-password?token=${encodeURIComponent(input.token)}`);
    const body = `Hello ${input.name}, use this secure link to reset your NIDUS password. It expires in ${env.AUTH_RESET_TOKEN_MINUTES} minutes.`;
    return brevoService.sendEmail({
      recipient: input.recipient,
      subject: "Reset your NIDUS password",
      htmlContent: renderEmailTemplate({ title: "Reset your password", body, actionLabel: "Reset password", actionUrl: url }),
      textContent: `${body}\n${url}`
    });
  },

  async sendParentInvitation(input: { recipient: string; token: string }) {
    const url = appUrl(`/parent-link?token=${encodeURIComponent(input.token)}`);
    const body = "A parent account requested permission to link with this student account. Accept only if you recognize this request.";
    return brevoService.sendEmail({
      recipient: input.recipient,
      subject: "Approve NIDUS parent-student link",
      htmlContent: renderEmailTemplate({ title: "Approve parent link", body, actionLabel: "Review link", actionUrl: url }),
      textContent: `${body}\n${url}`
    });
  }
};

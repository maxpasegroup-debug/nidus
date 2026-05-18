import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let resend: Resend | undefined;

function getResendClient() {
  if (!env.RESEND_API_KEY) return undefined;
  resend ??= new Resend(env.RESEND_API_KEY);
  return resend;
}

type EmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export const emailService = {
  async sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<EmailResult> {
    if (!env.RESEND_API_KEY) {
      if (env.NODE_ENV === "production") {
        throw new Error("RESEND_API_KEY is required to send password reset emails in production");
      }
      logger.warn("RESEND_API_KEY not configured. Password reset email logged only.", { email, resetLink });
      return { success: true, messageId: "logged-only" };
    }

    try {
      const client = getResendClient();
      if (!client) return { success: true, messageId: "logged-only" };

      const result = await client.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email,
        subject: "Reset Your NIDUS Academy Password",
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #243142;">
              <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #ded6c6; border-radius: 8px;">
                <h2 style="color: #0b1f3a;">Password Reset Request</h2>
                <p>Hi ${name},</p>
                <p>We received a request to reset your NIDUS Academy password.</p>
                <p>
                  <a href="${resetLink}" style="background-color: #c9a646; color: #0b1f3a; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 700;">
                    Reset Password
                  </a>
                </p>
                <p><strong>This link expires in 1 hour.</strong></p>
                <p>If you did not request this, you can safely ignore this email.</p>
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #ded6c6;">
                <p style="font-size: 12px; color: #667085;">NIDUS Academy | https://nidusacademy.com</p>
              </div>
            </body>
          </html>
        `
      });

      if (result.error) return { success: false, error: result.error.message };
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("Password reset email failed", { email, error: error instanceof Error ? error.message : String(error) });
      return { success: false, error: error instanceof Error ? error.message : "Email send failed" };
    }
  },

  async sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
    if (!env.RESEND_API_KEY) {
      if (env.NODE_ENV === "production") {
        throw new Error("RESEND_API_KEY is required to send welcome emails in production");
      }
      logger.info("RESEND_API_KEY not configured. Welcome email logged only.", { email });
      return { success: true, messageId: "logged-only" };
    }

    try {
      const client = getResendClient();
      if (!client) return { success: true, messageId: "logged-only" };

      const result = await client.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email,
        subject: "Welcome to NIDUS Academy",
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #243142;">
              <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #0b1f3a;">Welcome to NIDUS Academy, ${name}.</h2>
                <p>Your account has been created successfully.</p>
                <p>Login anytime at <a href="https://app.nidusacademy.com/login">app.nidusacademy.com</a>.</p>
                <p>Questions? Contact support@nidusacademy.com.</p>
              </div>
            </body>
          </html>
        `
      });

      if (result.error) return { success: false, error: result.error.message };
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("Welcome email failed", { email, error: error instanceof Error ? error.message : String(error) });
      return { success: false, error: error instanceof Error ? error.message : "Email send failed" };
    }
  }
};

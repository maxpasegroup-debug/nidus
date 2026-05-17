import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Phase 2 auth hardening", () => {
  const authService = read("src/modules/auth/auth.v2.service.ts");
  const authRoutes = read("src/modules/auth/auth.v2.routes.ts");
  const emailService = read("src/services/email.service.ts");
  const frontendAuth = read("../frontend/src/services/auth.v2.ts");
  const frontendApi = read("../frontend/src/services/api.ts");

  it("sends password reset emails through the email service", () => {
    expect(authService).toContain("emailService.sendPasswordResetEmail");
    expect(emailService).toContain("new Resend");
    expect(emailService).toContain("RESEND_API_KEY");
  });

  it("keeps public auth routes simple and cookie based", () => {
    expect(authRoutes).toContain('authRouter.post("/login"');
    expect(authRoutes).toContain('authRouter.post("/forgot-password"');
    expect(authRoutes).toContain('authRouter.post("/reset-password"');
    expect(authRoutes).not.toMatch(/refresh|csrf/i);
  });

  it("uses server-side sessions instead of browser tokens", () => {
    expect(authService).toContain("prisma.sessionToken.create");
    expect(frontendApi).toContain("withCredentials: true");
    expect(frontendAuth).not.toMatch(/localStorage|Bearer|accessToken|refreshToken/);
  });

  it("keeps the permanent super admin bootstrap locked", () => {
    expect(authService).toContain('SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com"');
    expect(authService).toContain('DEFAULT_ACCOUNT_PASSWORD = "123456789"');
    expect(authService).toContain("role: Role.ADMIN");
  });

  it("supports reset token lifecycle", () => {
    expect(authService).toContain("prisma.passwordReset.create");
    expect(authService).toContain("prisma.passwordReset.findUnique");
    expect(authService).toContain("prisma.passwordReset.delete");
  });

  it("documents auth endpoints with OpenAPI comments", () => {
    expect(authRoutes).toContain("@swagger");
    expect(authRoutes).toContain("/auth/login:");
    expect(authRoutes).toContain("/auth/reset-password:");
  });
});

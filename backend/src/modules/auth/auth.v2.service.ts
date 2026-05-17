import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { Role, type User } from "../../generated/prisma/client.js";
import { emailService } from "../../services/email.service.js";

export const SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com";
export const DEFAULT_ACCOUNT_PASSWORD = "123456789";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SafeUser = Pick<User, "id" | "name" | "email" | "role" | "emailVerified" | "instituteId" | "branchId">;

function safeUser(user: SafeUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    instituteId: user.instituteId,
    branchId: user.branchId
  };
}

async function audit(input: { userId?: string; action: string; description: string; ip?: string }) {
  await prisma.auditLog
    .create({
      data: {
        userId: input.userId,
        action: input.action,
        module: "auth",
        description: input.description,
        ipAddress: input.ip
      }
    })
    .catch(() => undefined);
}

async function createEmailVerification(user: Pick<User, "id" | "email">) {
  await audit({
    userId: user.id,
    action: "EMAIL_VERIFICATION_RESET",
    description: `Verification reset for ${user.email}`
  });
}

export const AuthServiceV2 = {
  async ensureSuperAdmin() {
    const password = await bcrypt.hash(DEFAULT_ACCOUNT_PASSWORD, 12);
    const existing = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });

    if (!existing) {
      const user = await prisma.user.create({
        data: {
          name: "NIDUS Super Admin",
          email: SUPER_ADMIN_EMAIL,
          mobile: "+910000000001",
          password,
          role: Role.ADMIN,
          emailVerified: true,
          mobileVerified: true,
          isDisabled: false,
          roleOnboardingStatus: "ACTIVE",
          roleActivatedAt: new Date(),
          lastRoleActivityAt: new Date(),
          roleMetadata: { superAdmin: true, defaultPassword: true }
        }
      });
      await audit({ userId: user.id, action: "SUPER_ADMIN_BOOTSTRAP", description: "Bootstrapped permanent super admin" });
      return safeUser(user);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        password,
        role: Role.ADMIN,
        emailVerified: true,
        mobileVerified: true,
        isDisabled: false,
        disabledAt: null,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: existing.roleActivatedAt ?? new Date(),
        lastRoleActivityAt: new Date(),
        roleMetadata: { superAdmin: true, defaultPassword: true }
      }
    });
    return safeUser(user);
  },

  async login(identifier: string, password: string, ip: string, userAgent = "") {
    const normalized = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: normalized }, { mobile: identifier.trim() }] },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        password: true,
        role: true,
        isDisabled: true,
        emailVerified: true,
        instituteId: true,
        branchId: true
      }
    });

    if (!user) {
      await audit({ action: "LOGIN_FAILED", description: `Failed login: user not found (${identifier})`, ip });
      throw new Error("Invalid credentials");
    }

    if (user.isDisabled) {
      await audit({ userId: user.id, action: "LOGIN_FAILED", description: "Account disabled", ip });
      throw new Error("Account disabled");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await audit({ userId: user.id, action: "LOGIN_FAILED", description: "Invalid password", ip });
      throw new Error("Invalid credentials");
    }

    const sessionId = crypto.randomBytes(32).toString("hex");
    await prisma.sessionToken.create({
      data: {
        userId: user.id,
        sessionId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        ipAddress: ip,
        userAgent
      }
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastRoleActivityAt: new Date() } });
    await audit({ userId: user.id, action: "LOGIN_SUCCESS", description: "Successful login", ip });

    return { sessionId, user: safeUser(user) };
  },

  async verify(sessionId: string) {
    const session = await prisma.sessionToken.findUnique({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            isDisabled: true,
            instituteId: true,
            branchId: true
          }
        }
      }
    });

    if (!session) throw new Error("Session not found");
    if (session.expiresAt < new Date()) {
      await prisma.sessionToken.delete({ where: { id: session.id } }).catch(() => undefined);
      throw new Error("Session expired");
    }
    if (session.user.isDisabled) throw new Error("User disabled");

    await prisma.sessionToken.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) }
    });

    return safeUser(session.user);
  },

  async logout(sessionId: string) {
    await prisma.sessionToken.delete({ where: { sessionId } }).catch(() => undefined);
  },

  async logoutAll(userId: string) {
    await prisma.sessionToken.deleteMany({ where: { userId } });
    await audit({ userId, action: "LOGOUT_ALL", description: "Logged out from all devices" });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true, isDisabled: true } });
    if (!user || user.isDisabled) throw new Error("User not found");

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error("Current password is incorrect");

    await prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(newPassword, 12) } });
    await this.logoutAll(userId);
    await audit({ userId, action: "PASSWORD_CHANGED", description: "Password changed" });
    return { message: "Password changed. Please login again." };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true }
    });

    if (!user) return { message: "If email exists, reset link will be sent" };

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    });

    const resetLink = `${env.FRONTEND_APP_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(user.email, user.name, resetLink);
    await audit({ userId: user.id, action: "PASSWORD_RESET_REQUESTED", description: "Password reset requested" });
    return { message: "Reset link sent to email" };
  },

  async resetPassword(token: string, newPassword: string) {
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true } } }
    });

    if (!reset) throw new Error("Reset link not found or expired");
    if (reset.expiresAt < new Date()) {
      await prisma.passwordReset.delete({ where: { id: reset.id } }).catch(() => undefined);
      throw new Error("Reset link expired");
    }

    await prisma.user.update({ where: { id: reset.user.id }, data: { password: await bcrypt.hash(newPassword, 12) } });
    await prisma.passwordReset.delete({ where: { id: reset.id } });
    await this.logoutAll(reset.user.id);
    await audit({ userId: reset.user.id, action: "PASSWORD_RESET", description: "Password reset successful" });
    return { message: "Password reset successful. Please login." };
  }
};

export const authTokenUtils = {
  audit,
  createEmailVerification
};

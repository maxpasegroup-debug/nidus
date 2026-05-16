import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { Role, type User } from "../../generated/prisma/client.js";

export type AuthUser = Pick<User, "id" | "name" | "email" | "mobile" | "role" | "emailVerified" | "mobileVerified" | "createdAt" | "updatedAt"> & {
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: User["roleMetadata"];
  roleOnboardingStatus?: string;
};

type SignupInput = { name: string; email: string; mobile: string; password: string };
type LoginInput = { identifier: string; password: string };
type ChangePasswordInput = { currentPassword: string; newPassword: string };

export const SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com";
export const DEFAULT_ACCOUNT_PASSWORD = "123456789";
const tokenExpirySeconds = env.AUTH_ACCESS_TOKEN_MINUTES * 60;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isBootstrapAdminEmail(email: string) {
  return normalizeEmail(email) === SUPER_ADMIN_EMAIL;
}

function metadataObject(value: User["roleMetadata"]) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function sanitizeUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    emailVerified: user.emailVerified,
    mobileVerified: user.mobileVerified,
    instituteId: user.instituteId,
    branchId: user.branchId,
    roleMetadata: user.roleMetadata,
    roleOnboardingStatus: user.roleOnboardingStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function signAccessToken(user: Pick<User, "id" | "email" | "role">) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: tokenExpirySeconds });
}

async function audit(input: { userId?: string; action: string; description: string; ip?: string }) {
  await prisma.auditLog.create({
    data: { userId: input.userId, action: input.action, module: "auth", description: input.description, ipAddress: input.ip }
  }).catch(() => undefined);
}

async function createEmailVerification(_user: Pick<User, "id" | "name" | "email">) {
  return undefined;
}

export const authService = {
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
          roleOnboardingStatus: "ACTIVE",
          roleActivatedAt: new Date(),
          lastRoleActivityAt: new Date(),
          roleMetadata: { superAdmin: true, defaultPassword: true }
        }
      });
      await audit({ userId: user.id, action: "SUPER_ADMIN_BOOTSTRAP", description: `Bootstrapped super admin ${SUPER_ADMIN_EMAIL}` });
      return sanitizeUser(user);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: Role.ADMIN,
        emailVerified: true,
        mobileVerified: true,
        isDisabled: false,
        disabledAt: null,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: existing.roleActivatedAt ?? new Date(),
        lastRoleActivityAt: new Date(),
        roleMetadata: { ...metadataObject(existing.roleMetadata), superAdmin: true }
      }
    });
    return sanitizeUser(user);
  },

  async signup(input: SignupInput, ctx?: { ip?: string }) {
    const email = normalizeEmail(input.email);
    const mobile = input.mobile.trim();
    const role = Role.GUEST;

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { mobile }] } });
    if (existingUser) throw new Error("Email or mobile already registered");

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        mobile,
        password: await bcrypt.hash(input.password, 12),
        role,
        emailVerified: true,
        mobileVerified: false,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: new Date(),
        lastRoleActivityAt: new Date()
      }
    });

    await prisma.roleActivity.create({
      data: { userId: user.id, role: user.role, activity: "GUEST_SIGNUP" }
    }).catch(() => undefined);
    await audit({ userId: user.id, action: "SIGNUP", description: `Signed up ${user.email}`, ip: ctx?.ip });

    return { token: signAccessToken(user), user: sanitizeUser(user), message: "Account created" };
  },

  async login(input: LoginInput, ctx?: { ip?: string }) {
    const identifier = input.identifier.includes("@") ? normalizeEmail(input.identifier) : input.identifier.trim();
    const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { mobile: identifier }] } });

    if (!user) {
      await audit({ action: "LOGIN_FAILED", description: `Failed login for unknown account ${input.identifier}`, ip: ctx?.ip });
      throw new Error("Invalid credentials");
    }

    if (user.isDisabled) throw new Error("Account disabled");
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new Error("Account temporarily locked");

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      const failures = user.loginFailureCount + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginFailureCount: failures,
          lockedUntil: failures >= env.AUTH_MAX_LOGIN_FAILURES ? new Date(Date.now() + env.AUTH_LOCK_MINUTES * 60 * 1000) : null
        }
      });
      await audit({ userId: user.id, action: "LOGIN_FAILED", description: `Failed login for ${user.email}`, ip: ctx?.ip });
      throw new Error("Invalid credentials");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: isBootstrapAdminEmail(user.email) ? Role.ADMIN : user.role,
        emailVerified: true,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: isBootstrapAdminEmail(user.email) && !user.roleActivatedAt ? new Date() : user.roleActivatedAt,
        roleMetadata: isBootstrapAdminEmail(user.email) ? { ...metadataObject(user.roleMetadata), superAdmin: true } : undefined,
        loginFailureCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastRoleActivityAt: new Date()
      }
    });

    await prisma.roleActivity.create({
      data: { userId: updated.id, role: updated.role, activity: "LOGIN", instituteId: updated.instituteId, branchId: updated.branchId }
    }).catch(() => undefined);
    await audit({ userId: updated.id, action: "LOGIN_SUCCESS", description: `Successful login for ${updated.email}`, ip: ctx?.ip });

    return { token: signAccessToken(updated), user: sanitizeUser(updated), message: "Login successful" };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDisabled) throw new Error("User not found");
    return sanitizeUser(user);
  },

  async logout() {
    return { message: "Logged out successfully" };
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDisabled) throw new Error("User not found");

    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isPasswordValid) throw new Error("Current password is incorrect");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(input.newPassword, 12),
        roleMetadata: { ...metadataObject(user.roleMetadata), defaultPassword: false, passwordChangedAt: new Date().toISOString() }
      }
    });
    await audit({ userId: user.id, action: "PASSWORD_CHANGED", description: `Password changed for ${user.email}` });
    return { message: "Password changed successfully" };
  }
};

export const authTokenUtils = { audit, createEmailVerification };

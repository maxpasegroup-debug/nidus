import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { Role, type User } from "../../generated/prisma/client.js";

export type AuthUser = Pick<User, "id" | "name" | "email" | "mobile" | "role" | "emailVerified" | "mobileVerified" | "createdAt" | "updatedAt"> & {
  instituteId?: string | null;
  branchId?: string | null;
  roleOnboardingStatus?: string;
};

type SignupInput = { name: string; email: string; mobile: string; password: string; role?: string };
type LoginInput = { identifier: string; password: string };

const ADMIN_BOOTSTRAP_EMAIL = "nidusacademycalicut@gmail.com";
const tokenExpirySeconds = env.AUTH_ACCESS_TOKEN_MINUTES * 60;

const roleMap: Record<string, Role> = {
  admin: Role.ADMIN,
  director: Role.DIRECTOR,
  teacher: Role.TEACHER,
  student: Role.STUDENT,
  parent: Role.PARENT,
  telecaller: Role.TELECALLER,
  marketing: Role.MARKETING_COORDINATOR,
  marketing_coordinator: Role.MARKETING_COORDINATOR,
  guest: Role.GUEST
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isBootstrapAdminEmail(email: string) {
  return normalizeEmail(email) === ADMIN_BOOTSTRAP_EMAIL;
}

function normalizeRole(role?: string, email?: string) {
  if (email && isBootstrapAdminEmail(email)) return Role.ADMIN;
  const normalized = role?.trim().toLowerCase();
  if (!normalized) return Role.STUDENT;
  const mapped = roleMap[normalized];
  if (!mapped) throw new Error("Invalid role selected");
  if (mapped === Role.ADMIN) throw new Error("Admin role is reserved for the bootstrap admin email");
  return mapped;
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
  async signup(input: SignupInput, ctx?: { ip?: string }) {
    const email = normalizeEmail(input.email);
    const mobile = input.mobile.trim();
    const role = normalizeRole(input.role, email);

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
        lastRoleActivityAt: new Date(),
        roleMetadata: isBootstrapAdminEmail(email) ? { bootstrapAdmin: true } : undefined
      }
    });

    await prisma.roleActivity.create({
      data: { userId: user.id, role: user.role, activity: isBootstrapAdminEmail(email) ? "BOOTSTRAP_ADMIN_SIGNUP" : "SIGNUP" }
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
  }
};

export const authTokenUtils = { audit, createEmailVerification };

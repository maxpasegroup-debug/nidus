import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { Role, type User } from "../../generated/prisma/client.js";
import { AuthError, AuthErrorCode, type AccessTokenPayload, type RefreshTokenPayload } from "../../types/auth.types.js";

export type AuthUser = Pick<User, "id" | "name" | "email" | "mobile" | "role" | "emailVerified" | "mobileVerified" | "createdAt" | "updatedAt"> & {
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: User["roleMetadata"];
  roleOnboardingStatus?: string;
};

type SignupInput = { name: string; email: string; mobile: string; password: string };
type LoginInput = { identifier: string; password: string };
type ChangePasswordInput = { currentPassword: string; newPassword: string };
type RequestContext = { ip?: string; userAgent?: string };

export const SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com";
export const DEFAULT_ACCOUNT_PASSWORD = "123456789";

const accessTokenExpirySeconds = env.AUTH_ACCESS_TOKEN_MINUTES * 60;
const refreshTokenExpirySeconds = env.AUTH_REFRESH_TOKEN_MINUTES * 60;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isBootstrapAdminEmail(email: string) {
  return normalizeEmail(email) === SUPER_ADMIN_EMAIL;
}

function metadataObject(value: User["roleMetadata"]) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenExpiryDate(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
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

function signAccessToken(user: Pick<User, "id" | "email" | "role" | "tokenVersion">) {
  const payload: AccessTokenPayload = { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion, type: "access", jti: randomUUID() };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: accessTokenExpirySeconds });
}

async function signRefreshToken(user: Pick<User, "id" | "email" | "role" | "tokenVersion">) {
  const jti = randomUUID();
  const payload: RefreshTokenPayload = { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion, type: "refresh", jti };
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: refreshTokenExpirySeconds });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: tokenHash(refreshToken),
      jti,
      expiresAt: tokenExpiryDate(refreshTokenExpirySeconds)
    }
  });

  return refreshToken;
}

async function issueTokens(user: Pick<User, "id" | "email" | "role" | "tokenVersion">) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: await signRefreshToken(user)
  };
}

async function audit(input: { userId?: string; action: string; description: string; ip?: string }) {
  await prisma.auditLog.create({
    data: { userId: input.userId, action: input.action, module: "auth", description: input.description, ipAddress: input.ip }
  }).catch(() => undefined);
}

async function createEmailVerification(_user: Pick<User, "id" | "name" | "email">) {
  return undefined;
}

async function blacklistAccessToken(accessToken?: string) {
  if (!accessToken) return;

  try {
    const decoded = jwt.decode(accessToken) as Partial<AccessTokenPayload & jwt.JwtPayload> | null;
    const expiresAt = typeof decoded?.exp === "number" ? new Date(decoded.exp * 1000) : tokenExpiryDate(accessTokenExpirySeconds);
    if (expiresAt <= new Date()) return;

    await prisma.tokenBlacklist.upsert({
      where: { tokenHash: tokenHash(accessToken) },
      update: {},
      create: {
        userId: typeof decoded?.id === "string" ? decoded.id : undefined,
        tokenHash: tokenHash(accessToken),
        jti: typeof decoded?.jti === "string" ? decoded.jti : undefined,
        expiresAt
      }
    });
  } catch (_error) {
    return;
  }
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
          tokenVersion: 0,
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
        password,
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

  async signup(input: SignupInput, ctx?: RequestContext) {
    const email = normalizeEmail(input.email);
    const mobile = input.mobile.trim();

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { mobile }] } });
    if (existingUser) throw new AuthError(AuthErrorCode.EMAIL_OR_MOBILE_EXISTS, "Email or mobile already registered", 409);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        mobile,
        password: await bcrypt.hash(input.password, 12),
        role: Role.GUEST,
        emailVerified: true,
        mobileVerified: false,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: new Date(),
        lastRoleActivityAt: new Date()
      }
    });

    await prisma.roleActivity.create({ data: { userId: user.id, role: user.role, activity: "GUEST_SIGNUP" } }).catch(() => undefined);
    await audit({ userId: user.id, action: "SIGNUP", description: `Signed up ${user.email}`, ip: ctx?.ip });

    return { ...(await issueTokens(user)), user: sanitizeUser(user), message: "Account created" };
  },

  async login(input: LoginInput, ctx?: RequestContext) {
    const identifier = input.identifier.includes("@") ? normalizeEmail(input.identifier) : input.identifier.trim();
    const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { mobile: identifier }] } });

    if (!user) {
      await audit({ action: "LOGIN_FAILED", description: `Failed login for unknown account ${input.identifier}`, ip: ctx?.ip });
      throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, "Invalid email/mobile or password", 401);
    }

    const isSuperAdmin = isBootstrapAdminEmail(user.email);
    if (!isSuperAdmin && user.isDisabled) throw new AuthError(AuthErrorCode.USER_DISABLED, "Account disabled", 403);
    if (!isSuperAdmin && user.lockedUntil && user.lockedUntil > new Date()) throw new AuthError(AuthErrorCode.ACCOUNT_LOCKED, "Account temporarily locked", 423);

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
      throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, "Invalid email/mobile or password", 401);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: isSuperAdmin ? Role.ADMIN : user.role,
        emailVerified: true,
        mobileVerified: isSuperAdmin ? true : user.mobileVerified,
        isDisabled: isSuperAdmin ? false : user.isDisabled,
        disabledAt: isSuperAdmin ? null : user.disabledAt,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: isSuperAdmin && !user.roleActivatedAt ? new Date() : user.roleActivatedAt,
        roleMetadata: isSuperAdmin ? { ...metadataObject(user.roleMetadata), superAdmin: true } : undefined,
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

    return { ...(await issueTokens(updated)), user: sanitizeUser(updated), message: "Login successful" };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new AuthError(AuthErrorCode.MISSING_REFRESH_TOKEN, "Refresh token is required", 401);

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as RefreshTokenPayload;
      if (decoded.type !== "refresh") throw new AuthError(AuthErrorCode.INVALID_REFRESH_TOKEN, "Invalid refresh token", 401);

      const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: tokenHash(refreshToken) }, include: { user: true } });
      if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) throw new AuthError(AuthErrorCode.INVALID_REFRESH_TOKEN, "Refresh token is invalid or revoked", 401);
      if (stored.user.isDisabled) throw new AuthError(AuthErrorCode.USER_DISABLED, "Account disabled", 403);
      if (stored.user.tokenVersion !== decoded.tokenVersion) throw new AuthError(AuthErrorCode.INVALID_REFRESH_TOKEN, "Refresh token was revoked", 401);

      await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      return { ...(await issueTokens(stored.user)), user: sanitizeUser(stored.user) };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      if (error instanceof jwt.TokenExpiredError) throw new AuthError(AuthErrorCode.EXPIRED_TOKEN, "Refresh token expired", 401);
      throw new AuthError(AuthErrorCode.INVALID_REFRESH_TOKEN, "Invalid refresh token", 401);
    }
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDisabled) throw new AuthError(AuthErrorCode.USER_NOT_FOUND, "User not found", 404);
    return sanitizeUser(user);
  },

  async logout(input: { accessToken?: string; refreshToken?: string; userId?: string }) {
    await blacklistAccessToken(input.accessToken);
    if (input.refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: tokenHash(input.refreshToken), revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
    await audit({ userId: input.userId, action: "LOGOUT", description: "User logged out" });
    return { message: "Logged out successfully" };
  },

  async logoutAll(userId: string, accessToken?: string) {
    await blacklistAccessToken(accessToken);
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
    await audit({ userId, action: "LOGOUT_ALL", description: "User logged out from all devices" });
    return { message: "Logged out from all devices" };
  },

  async isAccessTokenBlacklisted(accessToken: string) {
    const blocked = await prisma.tokenBlacklist.findUnique({ where: { tokenHash: tokenHash(accessToken) } });
    return Boolean(blocked && blocked.expiresAt > new Date());
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDisabled) throw new AuthError(AuthErrorCode.USER_NOT_FOUND, "User not found", 404);

    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isPasswordValid) throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, "Current password is incorrect", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(input.newPassword, 12),
        tokenVersion: { increment: 1 },
        roleMetadata: { ...metadataObject(user.roleMetadata), defaultPassword: false, passwordChangedAt: new Date().toISOString() }
      }
    });
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit({ userId: user.id, action: "PASSWORD_CHANGED", description: `Password changed for ${user.email}` });
    return { message: "Password changed successfully" };
  }
};

export const authTokenUtils = { audit, createEmailVerification };

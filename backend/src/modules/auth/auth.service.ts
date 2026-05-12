import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { Role, type User } from "../../generated/prisma/client.js";
import { authEmailService } from "./auth-email.service.js";

type AuthUser = Pick<User, "id" | "name" | "email" | "mobile" | "role" | "emailVerified" | "mobileVerified" | "createdAt" | "updatedAt"> & {
  isDisabled?: boolean;
  lockedUntil?: Date | null;
};

type RegisterInput = { name: string; email: string; mobile: string; password: string; role?: Role };
type LoginInput = { identifier: string; password: string };
type RequestContext = { ip?: string; userAgent?: string };

const publicRegistrationRoles = new Set<Role>([Role.GUEST, Role.STUDENT]);
const accessTokenExpirySeconds = env.AUTH_ACCESS_TOKEN_MINUTES * 60;

function sanitizeUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    emailVerified: user.emailVerified,
    mobileVerified: user.mobileVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isDisabled: user.isDisabled,
    lockedUntil: user.lockedUntil
  };
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function signAccessToken(user: Pick<User, "id" | "role">, sessionId: string) {
  return jwt.sign({ sub: user.id, role: user.role, sid: sessionId }, env.JWT_SECRET, { expiresIn: accessTokenExpirySeconds });
}

function deviceFromUserAgent(userAgent?: string) {
  if (!userAgent) return "Unknown device";
  if (/mobile|android|iphone/i.test(userAgent)) return "Mobile";
  if (/ipad|tablet/i.test(userAgent)) return "Tablet";
  return "Desktop";
}

function browserFromUserAgent(userAgent?: string) {
  if (!userAgent) return "Unknown browser";
  if (/edg/i.test(userAgent)) return "Edge";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/firefox/i.test(userAgent)) return "Firefox";
  return "Browser";
}

async function audit(input: { userId?: string; action: string; description: string; ip?: string }) {
  await prisma.auditLog.create({
    data: { userId: input.userId, action: input.action, module: "auth", description: input.description, ipAddress: input.ip }
  }).catch(() => undefined);
}

async function createEmailVerification(user: Pick<User, "id" | "name" | "email">) {
  const token = randomToken();
  await prisma.authVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      purpose: "EMAIL_VERIFY",
      expiresAt: addMinutes(env.AUTH_VERIFY_TOKEN_MINUTES)
    }
  });
  await authEmailService.sendVerificationEmail({ recipient: user.email, name: user.name, token });
  return token;
}

async function createSession(user: Pick<User, "id" | "role">, ctx: RequestContext) {
  const refreshToken = randomToken();
  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      device: deviceFromUserAgent(ctx.userAgent),
      browser: browserFromUserAgent(ctx.userAgent),
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      expiresAt: addDays(env.AUTH_REFRESH_TOKEN_DAYS)
    }
  });
  return { session, accessToken: signAccessToken(user, session.id), refreshToken };
}

async function revokeSession(id: string, reason: string) {
  await prisma.authSession.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason }
  });
}

export const authService = {
  async register(input: RegisterInput) {
    const role = input.role ?? Role.STUDENT;
    if (!publicRegistrationRoles.has(role)) throw new Error("This role cannot be selected during public registration");

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, { mobile: input.mobile }] } });
    if (existingUser) throw new Error("Email or mobile already registered");

    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, mobile: input.mobile, password: await bcrypt.hash(input.password, 10), role }
    });
    await createEmailVerification(user);
    await audit({ userId: user.id, action: "REGISTERED", description: `Registered ${user.email}` });
    return { user: sanitizeUser(user), message: "Account created. Verify your email before logging in." };
  },

  async resendVerification(identifier: string) {
    const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { mobile: identifier }] } });
    if (!user) return { message: "If the account exists, a verification email has been sent." };
    if (user.emailVerified) return { message: "Email is already verified." };
    await createEmailVerification(user);
    await audit({ userId: user.id, action: "VERIFICATION_RESENT", description: `Verification email resent for ${user.email}` });
    return { message: "Verification email sent." };
  },

  async verifyEmail(token: string, ctx: RequestContext) {
    const record = await prisma.authVerificationToken.findFirst({
      where: { tokenHash: hashToken(token), purpose: "EMAIL_VERIFY", consumedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true }
    });
    if (!record) throw new Error("Invalid or expired verification token");

    const user = await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    await prisma.authVerificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
    const session = await createSession(user, ctx);
    await audit({ userId: user.id, action: "EMAIL_VERIFIED", description: `Email verified for ${user.email}`, ip: ctx.ip });
    return { user: sanitizeUser(user), ...session };
  },

  async login(input: LoginInput, ctx: RequestContext) {
    const user = await prisma.user.findFirst({ where: { OR: [{ email: input.identifier }, { mobile: input.identifier }] } });
    if (!user) {
      await audit({ action: "LOGIN_FAILED", description: `Failed login for unknown account ${input.identifier}`, ip: ctx.ip });
      throw new Error("Invalid credentials");
    }

    if (user.isDisabled) throw new Error("Account disabled");
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new Error("Account temporarily locked");
    if (!user.emailVerified) throw new Error("Email verification required");

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      const failures = user.loginFailureCount + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginFailureCount: failures,
          lockedUntil: failures >= env.AUTH_MAX_LOGIN_FAILURES ? addMinutes(env.AUTH_LOCK_MINUTES) : null
        }
      });
      await audit({ userId: user.id, action: "LOGIN_FAILED", description: `Failed login for ${user.email}`, ip: ctx.ip });
      throw new Error("Invalid credentials");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { loginFailureCount: 0, lockedUntil: null, lastLoginAt: new Date() }
    });
    const session = await createSession(updated, ctx);
    await audit({ userId: updated.id, action: "LOGIN_SUCCESS", description: `Successful login for ${updated.email}`, ip: ctx.ip });
    return { user: sanitizeUser(updated), ...session };
  },

  async refresh(refreshToken: string | undefined, ctx: RequestContext) {
    if (!refreshToken) throw new Error("Refresh token required");
    const tokenHash = hashToken(refreshToken);
    const session = await prisma.authSession.findFirst({ where: { refreshTokenHash: tokenHash }, include: { user: true } });
    if (!session || session.expiresAt <= new Date() || session.revokedAt) {
      await audit({ action: "REFRESH_REJECTED", description: "Invalid or reused refresh token", ip: ctx.ip });
      throw new Error("Invalid refresh token");
    }
    if (session.user.isDisabled) throw new Error("Account disabled");

    const idleExpiry = new Date(Date.now() - env.AUTH_IDLE_TIMEOUT_MINUTES * 60 * 1000);
    if (session.lastActivityAt <= idleExpiry) {
      await revokeSession(session.id, "IDLE_TIMEOUT");
      throw new Error("Session expired");
    }

    const nextRefreshToken = randomToken();
    const updated = await prisma.authSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: hashToken(nextRefreshToken), lastActivityAt: new Date(), ipAddress: ctx.ip ?? session.ipAddress }
    });
    return { user: sanitizeUser(session.user), session: updated, accessToken: signAccessToken(session.user, session.id), refreshToken: nextRefreshToken };
  },

  async requestPasswordReset(identifier: string) {
    const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { mobile: identifier }] } });
    if (!user) return { message: "If the account exists, a reset email has been sent." };
    const token = randomToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: addMinutes(env.AUTH_RESET_TOKEN_MINUTES) }
    });
    await authEmailService.sendPasswordResetEmail({ recipient: user.email, name: user.name, token });
    await audit({ userId: user.id, action: "PASSWORD_RESET_REQUESTED", description: `Password reset requested for ${user.email}` });
    return { message: "If the account exists, a reset email has been sent." };
  },

  async resetPassword(token: string, password: string) {
    const record = await prisma.passwordResetToken.findFirst({
      where: { tokenHash: hashToken(token), consumedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true }
    });
    if (!record) throw new Error("Invalid or expired reset token");
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: await bcrypt.hash(password, 10), loginFailureCount: 0, lockedUntil: null } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
      prisma.authSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: "PASSWORD_RESET" } })
    ]);
    await audit({ userId: record.userId, action: "PASSWORD_RESET_COMPLETED", description: `Password reset completed for ${record.user.email}` });
    return { message: "Password reset successfully" };
  },

  async logout(sessionId?: string) {
    if (sessionId) await revokeSession(sessionId, "LOGOUT");
    return { message: "Logged out successfully" };
  },

  async logoutAll(userId: string) {
    await prisma.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: "LOGOUT_ALL" } });
    await audit({ userId, action: "LOGOUT_ALL", description: "Logged out from all devices" });
    return { message: "Logged out from all devices" };
  },

  async sessions(userId: string) {
    return prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastActivityAt: "desc" },
      select: { id: true, device: true, browser: true, ipAddress: true, loginAt: true, lastActivityAt: true, expiresAt: true }
    });
  },

  async revokeSession(userId: string, sessionId: string) {
    const result = await prisma.authSession.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: "USER_REVOKED" } });
    if (!result.count) throw new Error("Session not found");
    await audit({ userId, action: "SESSION_REVOKED", description: `Revoked session ${sessionId}` });
    return { message: "Session revoked" };
  },

  async inviteParentLink(parentId: string, studentId: string) {
    const [parent, student] = await Promise.all([
      prisma.user.findUnique({ where: { id: parentId } }),
      prisma.user.findUnique({ where: { id: studentId } })
    ]);
    if (!parent || parent.role !== Role.PARENT) throw new Error("Parent account required");
    if (!student || student.role !== Role.STUDENT) throw new Error("Student account required");

    const token = randomToken();
    await prisma.parentStudentInvitation.create({
      data: {
        parentId,
        studentId,
        tokenHash: hashToken(token),
        expiresAt: addDays(7)
      }
    });
    await authEmailService.sendParentInvitation({ recipient: student.email, token });
    await audit({ userId: parentId, action: "PARENT_LINK_INVITED", description: `Parent link invited for student ${student.email}` });
    return { message: "Parent link invitation sent." };
  },

  async acceptParentLink(token: string, studentUserId?: string) {
    const invitation = await prisma.parentStudentInvitation.findFirst({
      where: { tokenHash: hashToken(token), acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }
    });
    if (!invitation) throw new Error("Invalid or expired parent link invitation");
    if (studentUserId && invitation.studentId !== studentUserId) throw new Error("Forbidden");

    await prisma.$transaction([
      prisma.parentStudentLink.upsert({
        where: { parentId_studentId: { parentId: invitation.parentId, studentId: invitation.studentId } },
        update: {},
        create: { parentId: invitation.parentId, studentId: invitation.studentId }
      }),
      prisma.parentStudentInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } })
    ]);
    await audit({ userId: invitation.studentId, action: "PARENT_LINK_ACCEPTED", description: `Parent link accepted for ${invitation.parentId}` });
    return { message: "Parent account linked." };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDisabled) throw new Error("User not found");
    return sanitizeUser(user);
  }
};

export const authTokenUtils = { randomToken, hashToken, audit, createEmailVerification };

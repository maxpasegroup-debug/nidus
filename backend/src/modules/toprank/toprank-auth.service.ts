import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { TopRankRole, type TopRankUser } from "../../generated/prisma/client.js";
import type { TopRankLoginInput, TopRankRegisterInput, TopRankSafeUser } from "./toprank.types.js";

const SHORT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const REMEMBER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.trim().replace(/[\s()-]/g, "");
}

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function safeUser(user: TopRankUser): TopRankSafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    metadata: metadataObject(user.metadata),
    createdAt: user.createdAt.toISOString()
  };
}

function assertRegistration(input: TopRankRegisterInput) {
  const name = input.name?.trim();
  const email = input.email ? normalizeEmail(input.email) : "";
  const phone = input.phone ? normalizePhone(input.phone) : "";
  const password = input.password ?? "";
  const confirmPassword = input.confirmPassword ?? "";
  if (!name || name.length < 2) throw new Error("Full name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
  if (!/^\+?\d{10,15}$/.test(phone)) throw new Error("Enter a valid mobile number");
  if (!PASSWORD_RULE.test(password)) throw new Error("Password must be at least 8 characters and include one letter and one number");
  if (password !== confirmPassword) throw new Error("Password and confirm password must match");
  if (!input.state?.trim()) throw new Error("State is required");
  if (!input.district?.trim()) throw new Error("District is required");
  if (!input.language?.trim()) throw new Error("Preferred language is required");
  if (!input.acceptTerms) throw new Error("Please accept the TopRank terms to continue");
  return { name, email, phone, password };
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createSession(input: { userId: string; rememberMe?: boolean; ip?: string; userAgent?: string }) {
  const token = crypto.randomBytes(32).toString("hex");
  const ttl = input.rememberMe ? REMEMBER_SESSION_TTL_MS : SHORT_SESSION_TTL_MS;
  const session = await prisma.topRankSession.create({
    data: {
      userId: input.userId,
      tokenHash: tokenHash(token),
      rememberMe: Boolean(input.rememberMe),
      ipAddress: input.ip,
      userAgent: input.userAgent,
      expiresAt: new Date(Date.now() + ttl)
    }
  });
  return { token, session, maxAge: ttl };
}

export const topRankAuthService = {
  safeUser,

  async register(input: TopRankRegisterInput, context: { ip?: string; userAgent?: string }) {
    const valid = assertRegistration(input);
    const existing = await prisma.topRankUser.findFirst({
      where: { OR: [{ email: valid.email }, { phone: valid.phone }] },
      select: { email: true, phone: true }
    });
    if (existing?.email === valid.email) throw new Error("This email is already registered with TopRank");
    if (existing?.phone === valid.phone) throw new Error("This mobile number is already registered with TopRank");

    const user = await prisma.topRankUser.create({
      data: {
        name: valid.name,
        email: valid.email,
        phone: valid.phone,
        passwordHash: await bcrypt.hash(valid.password, 12),
        role: TopRankRole.TOPRANK_STUDENT,
        status: "PENDING_VERIFICATION",
        metadata: {
          state: input.state?.trim(),
          district: input.district?.trim(),
          language: input.language?.trim(),
          acceptedTermsAt: new Date().toISOString(),
          verificationStatus: "PLACEHOLDER_VERIFIED"
        }
      }
    });
    const session = await createSession({ userId: user.id, rememberMe: true, ip: context.ip, userAgent: context.userAgent });
    return { user: safeUser(user), session };
  },

  async login(input: TopRankLoginInput, context: { ip?: string; userAgent?: string }) {
    const email = input.email ? normalizeEmail(input.email) : "";
    if (!email || !input.password) throw new Error("Email and password are required");
    const user = await prisma.topRankUser.findUnique({ where: { email } });
    if (!user || user.status === "DISABLED") throw new Error("Invalid TopRank credentials");
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new Error("Invalid TopRank credentials");
    const session = await createSession({ userId: user.id, rememberMe: input.rememberMe, ip: context.ip, userAgent: context.userAgent });
    return { user: safeUser(user), session };
  },

  async verify(token?: string) {
    if (!token) return null;
    const session = await prisma.topRankSession.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true }
    });
    if (!session || session.expiresAt <= new Date() || session.user.status === "DISABLED") return null;
    return safeUser(session.user);
  },

  async logout(token?: string) {
    if (!token) return;
    await prisma.topRankSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
  },

  async changePassword(userId: string, currentPassword: string, nextPassword: string) {
    if (!PASSWORD_RULE.test(nextPassword)) throw new Error("New password must be at least 8 characters and include one letter and one number");
    const user = await prisma.topRankUser.findUnique({ where: { id: userId } });
    if (!user) throw new Error("TopRank account not found");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new Error("Current password is incorrect");
    await prisma.topRankUser.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(nextPassword, 12) } });
    await prisma.topRankSession.deleteMany({ where: { userId, expiresAt: { lt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } } });
    return { message: "Password updated. Please login again." };
  },

  async updateContact(userId: string, input: { name?: string; phone?: string; state?: string; district?: string; language?: string }) {
    const user = await prisma.topRankUser.findUnique({ where: { id: userId } });
    if (!user) throw new Error("TopRank account not found");
    const phone = input.phone ? normalizePhone(input.phone) : user.phone;
    if (!/^\+?\d{10,15}$/.test(phone)) throw new Error("Enter a valid mobile number");
    const duplicate = await prisma.topRankUser.findFirst({ where: { phone, id: { not: userId } }, select: { id: true } });
    if (duplicate) throw new Error("This mobile number is already registered with TopRank");
    const metadata = { ...metadataObject(user.metadata), state: input.state, district: input.district, language: input.language };
    const updated = await prisma.topRankUser.update({
      where: { id: userId },
      data: { name: input.name?.trim() || user.name, phone, metadata }
    });
    return safeUser(updated);
  },

  forgotPasswordMessage() {
    return { message: "Password reset is prepared for TopRank. Email delivery will be connected in a later release." };
  }
};


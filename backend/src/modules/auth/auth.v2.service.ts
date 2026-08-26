import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { Prisma, Role, type User } from "../../generated/prisma/client.js";
import { emailService } from "../../services/email.service.js";
import { authEmailService } from "./auth-email.service.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";
import { mediaService } from "../media/media.service.js";

export const SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com";
export const DEFAULT_ACCOUNT_PIN = "1234";
export const DEFAULT_ACCOUNT_PASSWORD = DEFAULT_ACCOUNT_PIN;
export const TEST_ACCOUNT_EMAIL = "test@nidusacademy.in";
export const TEST_ACCOUNT_PASSWORD = DEFAULT_ACCOUNT_PIN;
const TEST_ACCOUNT_MOBILE = "+910000000045";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SafeUser = Pick<User, "id" | "name" | "email" | "mobile" | "role" | "emailVerified" | "mobileVerified" | "instituteId" | "branchId" | "roleMetadata">;

function isEmailIdentity(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeMobile(value: string) {
  return value.trim().replace(/[\s()-]/g, "");
}

function mobileCandidates(value: string) {
  const normalized = normalizeMobile(value);
  const digitsOnly = normalized.replace(/^\+/, "");
  const candidates = new Set([normalized]);
  if (/^\d{10}$/.test(digitsOnly)) {
    candidates.add(digitsOnly);
    candidates.add(`+91${digitsOnly}`);
  }
  return Array.from(candidates).filter(Boolean);
}

function isValidMobile(value: string) {
  return /^\+?\d{7,15}$/.test(normalizeMobile(value));
}

function isValidPin(value: string) {
  return /^\d{4}$/.test(value);
}

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isDefaultPinAccount(metadata: Record<string, unknown>) {
  return metadata.defaultPassword === true || metadata.defaultPin === true;
}

function clearDefaultPinFlags(metadata: Record<string, unknown>) {
  const next = { ...metadata };
  delete next.defaultPassword;
  delete next.defaultPin;
  delete next.accessPin;
  delete next.access_pin;
  return next;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanFirstText(input: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = cleanText(input[key]);
    if (value) return value;
  }
  return "";
}

function cleanPercent(value: unknown) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function effectiveLoginMobile(metadata: Record<string, unknown>, fallbackMobile: string) {
  const loginMobile = typeof metadata.loginMobile === "string" ? normalizeMobile(metadata.loginMobile) : "";
  return isValidMobile(loginMobile) ? loginMobile : fallbackMobile;
}

function safeUser(user: SafeUser) {
  const metadata = metadataObject(user.roleMetadata);
  const profilePhotoUrl = typeof metadata.profilePhotoUrl === "string" ? metadata.profilePhotoUrl : null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: effectiveLoginMobile(metadata, user.mobile),
    imageUrl: profilePhotoUrl,
    role: user.role,
    emailVerified: user.emailVerified,
    mobileVerified: user.mobileVerified,
    instituteId: user.instituteId,
    branchId: user.branchId,
    roleMetadata: metadata,
    mustChangePassword: isDefaultPinAccount(metadata)
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

  emitDomainEvent({
    category: "AUTH",
    eventName: input.action,
    title: input.description,
    description: input.description,
    actor: { id: input.userId },
    entityType: "User",
    entityId: input.userId,
    severity: input.action.includes("FAILED") || input.action.includes("LOCKED") ? "WARNING" : "INFO",
    source: "WEB",
    ipAddress: input.ip
  });
}

async function createEmailVerification(user: Pick<User, "id" | "email">) {
  await audit({
    userId: user.id,
    action: "EMAIL_VERIFICATION_RESET",
    description: `Verification reset for ${user.email}`
  });
}

export const AuthServiceV2 = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  },

  async findByMobile(mobile: string) {
    const candidates = mobileCandidates(mobile);
    const user = await prisma.user.findFirst({ where: { mobile: { in: candidates } } });
    if (user) return user;

    const metadataMatches = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "User"
      WHERE "roleMetadata"->>'loginMobile' IN (${Prisma.join(candidates)})
      LIMIT 1
    `;
    const metadataMatch = metadataMatches[0];
    return metadataMatch ? prisma.user.findUnique({ where: { id: metadataMatch.id } }) : null;
  },

  async findByIdentity(identity: string) {
    const value = identity.trim();
    if (!value) return null;
    if (isEmailIdentity(value)) {
      return this.findByEmail(value);
    }
    if (!isValidMobile(value)) {
      return null;
    }
    return this.findByMobile(value);
  },

  normalizeMobile,

  mobileCandidates,

  isValidMobile,

  isValidPin,

  async ensureSuperAdmin() {
    const password = await bcrypt.hash(DEFAULT_ACCOUNT_PIN, 12);
    const existing = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });

    if (!existing) {
      const user = await prisma.user.create({
        data: {
          name: "CEO",
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
          roleMetadata: { superAdmin: true, dashboardTemplate: "CEO", designation: "CEO", department: "Executive Office", defaultPassword: true, defaultPin: true }
        }
      });
      await audit({ userId: user.id, action: "SUPER_ADMIN_BOOTSTRAP", description: "Bootstrapped permanent super admin" });
      return safeUser(user);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: "CEO",
        role: Role.ADMIN,
        emailVerified: true,
        mobileVerified: true,
        isDisabled: false,
        disabledAt: null,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: existing.roleActivatedAt ?? new Date(),
        lastRoleActivityAt: new Date(),
        roleMetadata: { ...metadataObject(existing.roleMetadata), superAdmin: true, dashboardTemplate: "CEO", designation: "CEO", department: "Executive Office" }
      }
    });
    return safeUser(user);
  },

  async ensureTestAccount() {
    if (!env.ENABLE_TEST_ACCOUNT) return null;

    const password = await bcrypt.hash(TEST_ACCOUNT_PASSWORD, 12);
    const now = new Date();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: TEST_ACCOUNT_EMAIL },
          { mobile: TEST_ACCOUNT_MOBILE }
        ]
      }
    });

    const testMetadata = {
      testAccess: true,
      paymentBypass: true,
      allServicesAccess: true,
      subscriptionTier: "signature_identity",
      defaultPassword: false,
      note: "Seeded NIDUS test account. Enable only for QA, staging or controlled internal testing."
    };

    if (!existing) {
      const user = await prisma.user.create({
        data: {
          name: "NIDUS Test Student",
          email: TEST_ACCOUNT_EMAIL,
          mobile: TEST_ACCOUNT_MOBILE,
          password,
          role: Role.STUDENT,
          emailVerified: true,
          mobileVerified: true,
          isDisabled: false,
          roleOnboardingStatus: "ACTIVE",
          roleActivatedAt: now,
          lastRoleActivityAt: now,
          roleMetadata: testMetadata
        }
      });
      await audit({ userId: user.id, action: "TEST_ACCOUNT_BOOTSTRAP", description: "Bootstrapped controlled test student account" });
      return safeUser(user);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: existing.name || "NIDUS Test Student",
        email: TEST_ACCOUNT_EMAIL,
        mobile: TEST_ACCOUNT_MOBILE,
        password,
        role: Role.STUDENT,
        emailVerified: true,
        mobileVerified: true,
        isDisabled: false,
        disabledAt: null,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: existing.roleActivatedAt ?? now,
        lastRoleActivityAt: now,
        loginFailureCount: 0,
        lockedUntil: null,
        roleMetadata: { ...metadataObject(existing.roleMetadata), ...testMetadata }
      }
    });
    return safeUser(user);
  },

  async login(identifier: string, password: string, ip: string, userAgent = "") {
    const identity = identifier.trim();
    if (!isValidMobile(identity)) {
      await audit({ action: "LOGIN_FAILED", description: "Failed login: mobile number is required", ip });
      throw new Error("Enter your registered mobile number");
    }
    if (!isValidPin(password)) {
      await audit({ action: "LOGIN_FAILED", description: `Failed login: invalid PIN format (${identity})`, ip });
      throw new Error("Enter your 4 digit PIN");
    }
    const userRecord = await this.findByMobile(identity);
    const user = userRecord
      ? await prisma.user.findUnique({
          where: { id: userRecord.id },
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            password: true,
            role: true,
            isDisabled: true,
            emailVerified: true,
            mobileVerified: true,
            instituteId: true,
            branchId: true,
            roleMetadata: true,
            loginFailureCount: true,
            lockedUntil: true
          }
        })
      : null;

    if (!user) {
      await audit({ action: "LOGIN_FAILED", description: `Failed login: user not found (${identifier})`, ip });
      throw new Error("Invalid credentials");
    }

    if (user.isDisabled) {
      await audit({ userId: user.id, action: "LOGIN_FAILED", description: "Account disabled", ip });
      throw new Error("Account disabled");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await audit({ userId: user.id, action: "LOGIN_LOCKED", description: `Login blocked until ${user.lockedUntil.toISOString()}`, ip });
      throw new Error("Account temporarily locked. Try again later or reset the PIN.");
    }

    const metadata = metadataObject(user.roleMetadata);
    const metadataAccessPin = typeof metadata.accessPin === "string" && isValidPin(metadata.accessPin) ? metadata.accessPin : "";
    const shouldStripLegacyPin = "accessPin" in metadata || "access_pin" in metadata;
    const isPasswordValid = await bcrypt.compare(password, user.password);
    const shouldRepairPinHash = !isPasswordValid && metadataAccessPin === password;
    const pinAccepted = isPasswordValid || shouldRepairPinHash;
    if (!pinAccepted) {
      const nextFailureCount = user.loginFailureCount + 1;
      const shouldLock = nextFailureCount >= env.AUTH_MAX_LOGIN_FAILURES;
      const lockedUntil = shouldLock ? new Date(Date.now() + env.AUTH_LOCK_MINUTES * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginFailureCount: nextFailureCount,
          lockedUntil
        }
      });
      await audit({ userId: user.id, action: "LOGIN_FAILED", description: "Invalid PIN", ip });
      if (shouldLock) {
        await audit({ userId: user.id, action: "ACCOUNT_LOCKED", description: `Account locked after ${nextFailureCount} failed attempts`, ip });
      }
      throw new Error("Invalid credentials");
    }

    const shouldClearDefaultPin = isDefaultPinAccount(metadata) && password !== DEFAULT_ACCOUNT_PIN;
    const loginRoleMetadata = {
      ...(shouldClearDefaultPin || shouldStripLegacyPin ? clearDefaultPinFlags(metadata) : metadata),
      ...(shouldClearDefaultPin ? { pinDefaultClearedAt: new Date().toISOString() } : {}),
      ...(shouldRepairPinHash ? { pinHashRepairedAt: new Date().toISOString() } : {})
    };
    const metadataLoginMobile = effectiveLoginMobile(loginRoleMetadata, user.mobile);
    const shouldRepairMobile = mobileCandidates(metadataLoginMobile).includes(normalizeMobile(identity)) && !mobileCandidates(metadataLoginMobile).includes(user.mobile);
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastRoleActivityAt: new Date(),
        loginFailureCount: 0,
        lockedUntil: null,
        ...(shouldRepairPinHash ? { password: await bcrypt.hash(password, 12) } : {}),
        ...(shouldRepairMobile ? { mobile: metadataLoginMobile, mobileVerified: true } : {}),
        ...(shouldClearDefaultPin || shouldRepairPinHash || shouldStripLegacyPin ? { roleMetadata: loginRoleMetadata as Prisma.InputJsonObject } : {})
      }
    });
    await audit({ userId: user.id, action: "LOGIN_SUCCESS", description: "Successful login", ip });

    return { sessionId, user: safeUser({ ...user, roleMetadata: loginRoleMetadata as Prisma.JsonObject }) };
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
            mobile: true,
            role: true,
            emailVerified: true,
            mobileVerified: true,
            isDisabled: true,
            instituteId: true,
            branchId: true,
            roleMetadata: true,
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

  async listSessions(userId: string) {
    return prisma.sessionToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true
      },
      orderBy: { updatedAt: "desc" }
    });
  },

  async revokeSession(userId: string, sessionTokenId: string) {
    await prisma.sessionToken.deleteMany({ where: { id: sessionTokenId, userId } });
    await audit({ userId, action: "SESSION_REVOKED", description: "Revoked own session" });
    return { message: "Session revoked" };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!isValidPin(currentPassword) || !isValidPin(newPassword)) {
      throw new Error("Current PIN and new PIN must be exactly 4 digits");
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true, isDisabled: true, roleMetadata: true } });
    if (!user || user.isDisabled) throw new Error("User not found");

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error("Current PIN is incorrect");

    const metadata = clearDefaultPinFlags(metadataObject(user.roleMetadata));
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(newPassword, 12),
        roleMetadata: { ...metadata, pinChangedAt: new Date().toISOString(), passwordChangedAt: new Date().toISOString() },
        loginFailureCount: 0,
        lockedUntil: null
      }
    });
    await this.logoutAll(userId);
    await audit({ userId, action: "PASSWORD_CHANGED", description: "PIN changed" });
    return { message: "PIN changed. Please login again." };
  },

  async forgotPassword(identity: string) {
    if (!isValidMobile(identity)) {
      await audit({ action: "PASSWORD_RESET_REQUESTED", description: "PIN reset requested with non-mobile identifier" });
      return { message: "If the account exists, reset instructions will be sent" };
    }
    const matchedUser = await this.findByMobile(identity);
    const user = matchedUser
      ? await prisma.user.findUnique({
      where: { id: matchedUser.id },
      select: { id: true, email: true, name: true }
    })
      : null;

    if (!user) return { message: "If the account exists, reset instructions will be sent" };

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    });

    const resetLink = `${env.FRONTEND_APP_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(user.email, user.name, resetLink);
    await audit({ userId: user.id, action: "PASSWORD_RESET_REQUESTED", description: "PIN reset requested" });
    return { message: "PIN reset link sent to the registered email" };
  },

  async resetPassword(token: string, newPassword: string) {
    if (!isValidPin(newPassword)) {
      throw new Error("New PIN must be exactly 4 digits");
    }
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, roleMetadata: true } } }
    });

    if (!reset) throw new Error("Reset link not found or expired");
    if (reset.expiresAt < new Date()) {
      await prisma.passwordReset.delete({ where: { id: reset.id } }).catch(() => undefined);
      throw new Error("Reset link expired");
    }

    const metadata = clearDefaultPinFlags(metadataObject(reset.user.roleMetadata));
    await prisma.user.update({
      where: { id: reset.user.id },
      data: {
        password: await bcrypt.hash(newPassword, 12),
        roleMetadata: { ...metadata, pinChangedAt: new Date().toISOString(), passwordChangedAt: new Date().toISOString() },
        loginFailureCount: 0,
        lockedUntil: null
      }
    });
    await prisma.passwordReset.delete({ where: { id: reset.id } });
    await this.logoutAll(reset.user.id);
    await audit({ userId: reset.user.id, action: "PASSWORD_RESET", description: "PIN reset successful" });
    return { message: "PIN reset successful. Please login." };
  },

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    if (!file.mimetype.startsWith("image/")) {
      throw Object.assign(new Error("Upload an image file"), { statusCode: 400 });
    }
    const uploaded = await mediaService.uploadFile(file, undefined, userId, "profile-photos");
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { roleMetadata: true } });
    if (!existing) throw new Error("User not found");
    const imageUrl = uploaded.signedUrl || uploaded.cloudinaryUrl;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { roleMetadata: { ...metadataObject(existing.roleMetadata), profilePhotoUrl: imageUrl } },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        emailVerified: true,
        mobileVerified: true,
        instituteId: true,
        branchId: true,
        roleMetadata: true
      }
    });
    await audit({ userId, action: "PROFILE_PHOTO_UPDATED", description: "Profile photo updated" });
    return { message: "Profile photo updated", user: safeUser(user), imageUrl };
  },

  async updateProfile(userId: string, input: Record<string, unknown>) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        emailVerified: true,
        mobileVerified: true,
        instituteId: true,
        branchId: true,
        roleMetadata: true
      }
    });
    if (!existing) throw new Error("User not found");

    const fullName = cleanFirstText(input, ["name", "fullName"]);
    const email = cleanFirstText(input, ["email"]).toLowerCase();
    const mobile = cleanFirstText(input, ["mobile", "phone", "loginMobile"]);
    const required = ["dateOfBirth", "gender", "address", "bloodGroup", "emergencyContactName", "emergencyContactMobile", "emergencyContactRelation", "designation", "department"];
    const profile = {
      dateOfBirth: cleanFirstText(input, ["dateOfBirth", "dob", "dateOfBirthIso"]),
      gender: cleanFirstText(input, ["gender", "sex"]),
      address: cleanFirstText(input, ["address", "residentialAddress", "homeAddress"]),
      bloodGroup: cleanFirstText(input, ["bloodGroup", "blood_group", "blood"]).toUpperCase(),
      emergencyContactName: cleanFirstText(input, ["emergencyContactName", "emergencyName"]),
      emergencyContactMobile: normalizeMobile(cleanFirstText(input, ["emergencyContactMobile", "emergencyMobile", "emergencyPhone"])),
      emergencyContactRelation: cleanFirstText(input, ["emergencyContactRelation", "emergencyRelation", "emergencyContactRelationship"]),
      designation: cleanFirstText(input, ["designation", "jobTitle"]),
      department: cleanFirstText(input, ["department"]),
      qualification: cleanFirstText(input, ["qualification", "education"]),
      experience: cleanFirstText(input, ["experience", "yearsOfExperience"])
    };
    const missing = [
      !metadataObject(existing.roleMetadata).profilePhotoUrl ? "Profile photo" : null,
      !fullName ? "Full name" : null,
      !email ? "Email" : null,
      !mobile ? "Mobile number" : null,
      ...required.map((key) => profile[key as keyof typeof profile] ? null : key),
    ].filter(Boolean);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw Object.assign(new Error("Valid email is required"), { statusCode: 400 });
    }
    if ((mobile && !isValidMobile(mobile)) || (profile.emergencyContactMobile && !isValidMobile(profile.emergencyContactMobile))) {
      throw Object.assign(new Error("Valid mobile and emergency contact numbers are required"), { statusCode: 400 });
    }
    const normalizedMobile = mobile ? normalizeMobile(mobile) : existing.mobile;
    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(email ? [{ email }] : []),
          { mobile: { in: mobileCandidates(normalizedMobile) } }
        ]
      },
      select: { email: true, mobile: true }
    });
    if (email && duplicate?.email === email) {
      throw Object.assign(new Error("Email is already used by another account"), { statusCode: 409 });
    }
    if (duplicate?.mobile && mobileCandidates(normalizedMobile).includes(duplicate.mobile)) {
      throw Object.assign(new Error("Mobile number is already used by another account"), { statusCode: 409 });
    }

    const metadata = metadataObject(existing.roleMetadata);
    const totalRequired = required.length + 4;
    const completedRequired = totalRequired - missing.length;
    const profileCompletionPercent = Math.max(0, Math.min(100, Math.round((completedRequired / totalRequired) * 100)));
    const teacherProgress = {
      attendanceDiscipline: cleanPercent(input.attendanceDiscipline),
      syllabusDelivery: cleanPercent(input.syllabusDelivery),
      assignmentReview: cleanPercent(input.assignmentReview),
      examReadiness: cleanPercent(input.examReadiness),
      ndpCompletion: cleanPercent(input.ndpCompletion),
      personalGrowth: cleanPercent(input.personalGrowth),
      progressNote: cleanText(input.progressNote),
      updatedAt: new Date().toISOString()
    };
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: fullName || existing.name,
        email: email || existing.email,
        mobile: normalizedMobile,
        roleMetadata: {
          ...metadata,
          ...profile,
          loginMobile: normalizedMobile,
          profileCompletionRequired: missing.length > 0,
          profileCompletionPercent,
          profileMissingFields: missing,
          profileCompletedAt: missing.length ? metadata.profileCompletedAt ?? null : new Date().toISOString(),
          profileUpdatedAt: new Date().toISOString(),
          teacherProgress
        } as Prisma.InputJsonObject
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        emailVerified: true,
        mobileVerified: true,
        instituteId: true,
        branchId: true,
        roleMetadata: true
      }
    });
    await audit({ userId, action: "PROFILE_UPDATED", description: "Mandatory profile details updated" });
    return {
      message: missing.length ? `Profile saved. Pending: ${missing.join(", ")}` : "Profile saved",
      user: safeUser(updated)
    };
  },

  async inviteParentLink(studentId: string, parentIdentity: string) {
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, name: true, role: true } });
    if (!student || student.role !== Role.STUDENT) throw new Error("Student account required");

    const parent = await this.findByIdentity(parentIdentity);
    if (!parent || parent.role !== Role.PARENT) throw new Error("Parent account not found. Ask the parent to create a parent account first.");

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.parentStudentInvitation.deleteMany({ where: { parentId: parent.id, studentId: student.id, acceptedAt: null } });
    await prisma.parentStudentInvitation.create({
      data: {
        parentId: parent.id,
        studentId: student.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
    await authEmailService.sendParentInvitation({ recipient: parent.email, token }).catch(() => undefined);
    await audit({ userId: student.id, action: "PARENT_LINK_INVITED", description: `Parent invite sent to ${parent.email}` });
    return { message: "Parent invitation created", parent: { id: parent.id, name: parent.name, email: parent.email, mobile: parent.mobile } };
  },

  async acceptParentLink(parentId: string, token: string) {
    const parent = await prisma.user.findUnique({ where: { id: parentId }, select: { id: true, role: true } });
    if (!parent || parent.role !== Role.PARENT) throw new Error("Parent account required");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const invitation = await prisma.parentStudentInvitation.findFirst({
      where: {
        parentId,
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { student: { select: { id: true, name: true, email: true, mobile: true } } }
    });
    if (!invitation) throw new Error("Parent invitation is invalid or expired");

    const link = await prisma.parentStudentLink.upsert({
      where: { parentId_studentId: { parentId, studentId: invitation.studentId } },
      create: {
        parentId,
        studentId: invitation.studentId,
        status: "ACTIVE",
        monitoringPermissions: {
          attendance: true,
          exams: true,
          assignments: true,
          fees: true,
          fitness: true,
          reports: true
        }
      },
      update: {
        status: "ACTIVE",
        monitoringPermissions: {
          attendance: true,
          exams: true,
          assignments: true,
          fees: true,
          fitness: true,
          reports: true
        },
        linkedAt: new Date()
      }
    });
    await prisma.parentStudentInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    await audit({ userId: parentId, action: "PARENT_LINK_ACCEPTED", description: `Parent linked to ${invitation.student.name}` });
    return { message: "Parent account linked", link, student: invitation.student };
  }
};

export const authTokenUtils = {
  audit,
  createEmailVerification
};

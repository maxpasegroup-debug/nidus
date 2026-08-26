import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { Prisma, Role } from "../../generated/prisma/client.js";
import { allowRoles, protect, type AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { DEFAULT_ACCOUNT_PIN } from "../auth/auth.v2.service.js";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(7),
  role: z.enum([
    Role.DIRECTOR,
    Role.TEACHER,
    Role.ACADEMIC_HEAD,
    Role.PHYSICAL_TRAINER,
    Role.STUDENT,
    Role.PARENT,
    Role.TELECALLER,
    Role.MARKETING_COORDINATOR,
    Role.BUSINESS_DEVELOPMENT_EXECUTIVE,
    Role.ADMINISTRATIVE_OFFICER
  ]).default(Role.STUDENT)
});

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function credentialSafeMetadata(value: unknown) {
  const metadata = { ...metadataObject(value) } as Record<string, unknown>;
  delete metadata.accessPin;
  delete metadata.access_pin;
  return metadata;
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

export const usersRouter = Router();

usersRouter.use(protect, allowRoles(Role.ADMIN, Role.DIRECTOR));

function directorInstitute(req: AuthenticatedRequest) {
  if (req.user?.role !== Role.DIRECTOR) return undefined;
  if (!req.user.instituteId) throw Object.assign(new Error("Director institution assignment is required"), { statusCode: 403 });
  return req.user.instituteId;
}

usersRouter.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const instituteId = directorInstitute(req);
    const users = await prisma.user.findMany({
      where: instituteId ? { instituteId } : undefined,
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
        roleOnboardingStatus: true,
        roleMetadata: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = createUserSchema.parse(req.body);
    const instituteId = directorInstitute(req);
    const email = payload.email.trim().toLowerCase();
    const mobile = normalizeMobile(payload.mobile);
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { mobile: { in: mobileCandidates(mobile) } }] } });
    if (existingUser) {
      res.status(409).json({ message: "Email or mobile already registered" });
      return;
    }
    const metadataMatches = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "User"
      WHERE "roleMetadata"->>'loginMobile' IN (${Prisma.join(mobileCandidates(mobile))})
      LIMIT 1
    `;
    if (metadataMatches.length) {
      res.status(409).json({ message: "Email or mobile already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_ACCOUNT_PIN, 12);
    const user = await prisma.user.create({
      data: {
        ...payload,
        email,
        mobile,
        password: hashedPassword,
        emailVerified: true,
        mobileVerified: true,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: new Date(),
        lastRoleActivityAt: new Date(),
        roleMetadata: { loginMobile: mobile, authMobile: mobile, defaultPassword: true, defaultPin: true, createdByAdmin: true, authSyncedAt: new Date().toISOString() },
        instituteId: instituteId ?? req.user?.instituteId ?? undefined,
        branchId: req.user?.role === Role.DIRECTOR ? req.user.branchId ?? undefined : undefined
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
        roleOnboardingStatus: true,
        roleMetadata: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await prisma.roleActivity.create({ data: { userId: user.id, role: user.role, activity: "ADMIN_CREATED_ACCOUNT" } }).catch(() => undefined);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/:id/reset-password", async (req: AuthenticatedRequest, res, next) => {
  try {
    const instituteId = directorInstitute(req);
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!id) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }
    const user = await prisma.user.findFirst({ where: { id, ...(instituteId ? { instituteId } : {}) } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(DEFAULT_ACCOUNT_PIN, 12),
        isDisabled: false,
        disabledAt: null,
        loginFailureCount: 0,
        lockedUntil: null,
        mobileVerified: true,
        roleMetadata: { ...credentialSafeMetadata(user.roleMetadata), loginMobile: normalizeMobile(user.mobile), authMobile: normalizeMobile(user.mobile), defaultPassword: true, defaultPin: true, authSyncedAt: new Date().toISOString(), pinResetByAdminAt: new Date().toISOString(), passwordResetByAdminAt: new Date().toISOString() }
      }
    });
    await prisma.sessionToken.deleteMany({ where: { userId: user.id } });
    await prisma.roleActivity.create({ data: { userId: user.id, role: user.role, activity: "ADMIN_RESET_PASSWORD" } }).catch(() => undefined);
    res.json({ message: "PIN reset to default PIN" });
  } catch (error) {
    next(error);
  }
});

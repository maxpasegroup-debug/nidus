import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { DEFAULT_ACCOUNT_PIN } from "../auth/auth.v2.service.js";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(7),
  role: z.enum([Role.DIRECTOR, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.TELECALLER, Role.MARKETING_COORDINATOR]).default(Role.STUDENT)
});

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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

usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
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

usersRouter.post("/", async (req, res, next) => {
  try {
    const payload = createUserSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const mobile = normalizeMobile(payload.mobile);
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { mobile: { in: mobileCandidates(mobile) } }] } });
    if (existingUser) {
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
        mobileVerified: false,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: new Date(),
        lastRoleActivityAt: new Date(),
        roleMetadata: { defaultPassword: true, defaultPin: true, accessPin: DEFAULT_ACCOUNT_PIN, createdByAdmin: true }
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

usersRouter.post("/:id/reset-password", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
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
        roleMetadata: { ...metadataObject(user.roleMetadata), defaultPassword: true, defaultPin: true, accessPin: DEFAULT_ACCOUNT_PIN, pinResetByAdminAt: new Date().toISOString(), passwordResetByAdminAt: new Date().toISOString() }
      }
    });
    await prisma.sessionToken.deleteMany({ where: { userId: user.id } });
    await prisma.roleActivity.create({ data: { userId: user.id, role: user.role, activity: "ADMIN_RESET_PASSWORD" } }).catch(() => undefined);
    res.json({ message: "PIN reset to default PIN" });
  } catch (error) {
    next(error);
  }
});

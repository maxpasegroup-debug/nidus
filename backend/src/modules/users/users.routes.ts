import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(7),
  password: z.string().min(8),
  role: z.nativeEnum(Role).default(Role.STUDENT)
});

export const usersRouter = Router();

usersRouter.use(protect, allowRoles(Role.ADMIN));

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
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        ...payload,
        email: payload.email.trim().toLowerCase(),
        password: hashedPassword,
        emailVerified: true,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: new Date()
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
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

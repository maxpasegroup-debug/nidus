import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { academicOsController } from "./academic-os.controller.js";

export const academicOsRouter = Router();

academicOsRouter.use(protect);
academicOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER));

academicOsRouter.get("/flow", academicOsController.flow);
academicOsRouter.get("/dashboard", academicOsController.dashboard);
academicOsRouter.get("/batches/:batchId", academicOsController.batch);

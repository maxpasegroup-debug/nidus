import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { performanceOsController } from "./performance-os.controller.js";

export const performanceOsRouter = Router();

performanceOsRouter.use(protect);
performanceOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.ADMINISTRATIVE_OFFICER));

performanceOsRouter.get("/framework", performanceOsController.framework);
performanceOsRouter.get("/dashboard", performanceOsController.dashboard);
performanceOsRouter.get("/staff/:userId", performanceOsController.staffMember);

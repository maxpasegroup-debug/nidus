import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { launchReadinessOsController } from "./launch-readiness-os.controller.js";

export const launchReadinessOsRouter = Router();

launchReadinessOsRouter.use(protect);
launchReadinessOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR));

launchReadinessOsRouter.get("/framework", launchReadinessOsController.framework);
launchReadinessOsRouter.get("/checklist", launchReadinessOsController.checklist);

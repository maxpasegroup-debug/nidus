import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { pilotLaunchOsController } from "./pilot-launch-os.controller.js";

export const pilotLaunchOsRouter = Router();

pilotLaunchOsRouter.use(protect);
pilotLaunchOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR));

pilotLaunchOsRouter.get("/framework", pilotLaunchOsController.framework);
pilotLaunchOsRouter.get("/readiness", pilotLaunchOsController.readiness);

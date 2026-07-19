import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { automationEngineController } from "./automation-engine.controller.js";

export const automationEngineRouter = Router();

automationEngineRouter.use(protect);
automationEngineRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.ADMINISTRATIVE_OFFICER));

automationEngineRouter.get("/rules", automationEngineController.rules);
automationEngineRouter.get("/summary", automationEngineController.summary);

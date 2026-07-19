import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { admissionsOsController } from "./admissions-os.controller.js";

export const admissionsOsRouter = Router();

admissionsOsRouter.use(protect);
admissionsOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ADMINISTRATIVE_OFFICER, Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.TELECALLER, Role.MARKETING_COORDINATOR));

admissionsOsRouter.get("/journey", admissionsOsController.journey);
admissionsOsRouter.get("/dashboard", admissionsOsController.dashboard);
admissionsOsRouter.get("/leads/:leadId", admissionsOsController.leadJourney);

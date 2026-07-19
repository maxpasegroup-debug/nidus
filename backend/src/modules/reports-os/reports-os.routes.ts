import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { reportsOsController } from "./reports-os.controller.js";

export const reportsOsRouter = Router();

reportsOsRouter.use(protect);
reportsOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.ADMINISTRATIVE_OFFICER, Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.TELECALLER, Role.MARKETING_COORDINATOR));

reportsOsRouter.get("/framework", reportsOsController.framework);
reportsOsRouter.get("/current", reportsOsController.current);
reportsOsRouter.post("/pdf", reportsOsController.pdf);

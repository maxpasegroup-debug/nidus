import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { dashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(protect);

dashboardRouter.get("/student", allowRoles(Role.STUDENT, Role.ADMIN), dashboardController.student);
dashboardRouter.get("/parent", allowRoles(Role.PARENT, Role.ADMIN), dashboardController.parent);
dashboardRouter.get("/admin", allowRoles(Role.ADMIN, Role.DIRECTOR), dashboardController.admin);
dashboardRouter.get("/guest", allowRoles(Role.GUEST, Role.ADMIN), dashboardController.guest);
dashboardRouter.get("/teacher", allowRoles(Role.TEACHER, Role.ADMIN), dashboardController.teacher);
dashboardRouter.get("/director", allowRoles(Role.DIRECTOR, Role.ADMIN), dashboardController.director);
dashboardRouter.get("/telecaller", allowRoles(Role.TELECALLER, Role.ADMIN, Role.DIRECTOR), dashboardController.telecaller);
dashboardRouter.get("/marketing", allowRoles(Role.MARKETING_COORDINATOR, Role.ADMIN, Role.DIRECTOR), dashboardController.marketing);

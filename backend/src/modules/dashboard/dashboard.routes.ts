import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { dashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(protect);

dashboardRouter.get("/student", allowRoles(Role.STUDENT, Role.ADMIN), dashboardController.student);
dashboardRouter.get("/parent", allowRoles(Role.PARENT, Role.ADMIN), dashboardController.parent);
dashboardRouter.get("/admin", allowRoles(Role.ADMIN), dashboardController.admin);
dashboardRouter.get("/guest", allowRoles(Role.GUEST, Role.ADMIN), dashboardController.guest);

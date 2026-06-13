import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { protect, type AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import type { NextFunction, Response } from "express";
import { dashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(protect);

function dashboardTemplate(req: AuthenticatedRequest) {
  const metadata = req.user?.roleMetadata && typeof req.user.roleMetadata === "object" ? req.user.roleMetadata : {};
  return typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
}

function unrestrictedAdmin(role?: Role, template = "") {
  return role === Role.ADMIN && !["ADMISSION_CELL", "MARKETING", "SALES_BOOSTER"].includes(template);
}

function allowDashboard(kind: "student" | "parent" | "admin" | "guest" | "teacher" | "academicHead" | "director" | "telecaller" | "marketing") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    const template = dashboardTemplate(req);
    const allowed =
      (kind === "student" && (role === Role.STUDENT || unrestrictedAdmin(role, template))) ||
      (kind === "parent" && (role === Role.PARENT || unrestrictedAdmin(role, template))) ||
      (kind === "admin" && unrestrictedAdmin(role, template)) ||
      (kind === "guest" && (role === Role.GUEST || unrestrictedAdmin(role, template))) ||
      (kind === "teacher" && (role === Role.TEACHER || template === "ACADEMIC_HEAD" || unrestrictedAdmin(role, template))) ||
      (kind === "academicHead" && template === "ACADEMIC_HEAD") ||
      (kind === "director" && (role === Role.DIRECTOR || unrestrictedAdmin(role, template))) ||
      (kind === "telecaller" && (role === Role.TELECALLER || role === Role.DIRECTOR || unrestrictedAdmin(role, template))) ||
      (kind === "marketing" && (role === Role.MARKETING_COORDINATOR || role === Role.DIRECTOR || (role === Role.ADMIN && ["MARKETING", "SALES_BOOSTER"].includes(template))));
    if (!allowed) {
      res.status(403).json({ success: false, message: "Forbidden for assigned dashboard scope" });
      return;
    }
    next();
  };
}

dashboardRouter.get("/student", allowDashboard("student"), dashboardController.student);
dashboardRouter.get("/parent", allowDashboard("parent"), dashboardController.parent);
dashboardRouter.get("/admin", allowDashboard("admin"), dashboardController.admin);
dashboardRouter.get("/guest", allowDashboard("guest"), dashboardController.guest);
dashboardRouter.get("/teacher", allowDashboard("teacher"), dashboardController.teacher);
dashboardRouter.get("/academic-head", allowDashboard("academicHead"), dashboardController.teacher);
dashboardRouter.get("/director", allowDashboard("director"), dashboardController.director);
dashboardRouter.get("/telecaller", allowDashboard("telecaller"), dashboardController.telecaller);
dashboardRouter.get("/marketing", allowDashboard("marketing"), dashboardController.marketing);

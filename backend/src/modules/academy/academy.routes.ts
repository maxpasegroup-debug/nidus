import { Router, type NextFunction, type Response } from "express";

import { Role } from "../../generated/prisma/client.js";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { academyController } from "./academy.controller.js";

const router = Router();

function requireAcademyRoles(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    next();
  };
}

const academicRoles = [Role.ADMIN, Role.DIRECTOR, Role.TEACHER];
const managementRoles = [Role.ADMIN, Role.DIRECTOR];

router.get("/batches", academyController.batches);
router.get("/employees", requireAcademyRoles(managementRoles), academyController.employees);
router.get("/teachers", requireAcademyRoles(academicRoles), academyController.teachers);
router.get("/teacher-assignments", requireAcademyRoles(academicRoles), academyController.teacherAssignments);
router.get("/my-plan", academyController.myAcademicPlan);
router.get("/academic-calendar", requireAcademyRoles(academicRoles), academyController.academicCalendar);

router.post("/academic-calendar", requireAcademyRoles(academicRoles), academyController.createAcademicCalendarItem);
router.patch("/academic-calendar/:id", requireAcademyRoles(academicRoles), academyController.updateAcademicCalendarItem);

router.post("/batches", requireAcademyRoles(managementRoles), academyController.createBatch);
router.post("/employees", requireAcademyRoles(managementRoles), academyController.createEmployee);
router.patch("/batches/:id", requireAcademyRoles(managementRoles), academyController.updateBatch);
router.patch("/employees/:id", requireAcademyRoles(managementRoles), academyController.updateEmployee);
router.post("/employees/:id/archive", requireAcademyRoles(managementRoles), academyController.archiveEmployee);
router.post("/employees/:id/reset-password", requireAcademyRoles(managementRoles), academyController.resetEmployeePassword);
router.post("/batches/:id/students", requireAcademyRoles(managementRoles), academyController.addStudent);
router.post("/batches/:id/teachers", requireAcademyRoles(academicRoles), academyController.assignTeacher);
router.post("/admissions/approve", requireAcademyRoles(managementRoles), academyController.approveAdmissionToBatch);

export { router as academyRouter, router as academyRoutes };

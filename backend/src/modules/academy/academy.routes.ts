import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/session.middleware.js";
import { academyController } from "./academy.controller.js";

const router = Router();

const academicRoles = ["ADMIN", "DIRECTOR", "TEACHER"] as const;
const managementRoles = ["ADMIN", "DIRECTOR"] as const;

router.use(requireAuth);

router.get("/batches", academyController.batches);
router.get("/teachers", requireRole(academicRoles), academyController.teachers);
router.get("/teacher-assignments", requireRole(academicRoles), academyController.teacherAssignments);
router.get("/my-plan", academyController.myAcademicPlan);
router.get("/academic-calendar", requireRole(academicRoles), academyController.academicCalendar);

router.post("/academic-calendar", requireRole(academicRoles), academyController.createAcademicCalendarItem);
router.patch("/academic-calendar/:id", requireRole(academicRoles), academyController.updateAcademicCalendarItem);

router.post("/batches", requireRole(managementRoles), academyController.createBatch);
router.patch("/batches/:id", requireRole(managementRoles), academyController.updateBatch);
router.post("/batches/:id/students", requireRole(managementRoles), academyController.addStudent);
router.post("/batches/:id/teachers", requireRole(academicRoles), academyController.assignTeacher);
router.post("/admissions/approve", requireRole(managementRoles), academyController.approveAdmissionToBatch);

export { router as academyRoutes };

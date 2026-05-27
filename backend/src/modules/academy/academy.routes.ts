import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { academyController } from "./academy.controller.js";

export const academyRouter = Router();

const academyRoles = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.TEACHER)];
const academyAdminRoles = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR)];

academyRouter.get("/batches", ...academyRoles, academyController.batches);
academyRouter.get("/teacher-assignments", ...academyRoles, academyController.teacherAssignments);
academyRouter.post(
  "/batches",
  ...academyAdminRoles,
  [
    body("name").trim().isLength({ min: 2 }),
    body("batchType").trim().notEmpty(),
    body("programSlug").trim().notEmpty(),
    body("courseId").optional({ nullable: true }).trim(),
    body("startDate").optional({ nullable: true }).isISO8601(),
    body("endDate").optional({ nullable: true }).isISO8601(),
    body("schedule").optional()
  ],
  academyController.createBatch
);
academyRouter.post(
  "/batches/:id/students",
  ...academyAdminRoles,
  [
    body("studentId").trim().notEmpty(),
    body("status").optional().trim(),
    body("remarks").optional({ nullable: true }).trim()
  ],
  academyController.addStudent
);
academyRouter.post(
  "/batches/:id/teachers",
  ...academyAdminRoles,
  [
    body("teacherId").trim().notEmpty(),
    body("subject").trim().notEmpty(),
    body("role").optional().trim(),
    body("status").optional().trim()
  ],
  academyController.assignTeacher
);

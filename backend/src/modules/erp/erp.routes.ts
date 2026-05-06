import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { erpController } from "./erp.controller.js";

export const attendanceRouter = Router();
export const timetableRouter = Router();
export const facultyRouter = Router();
export const payrollRouter = Router();
export const announcementsRouter = Router();

const admin = [protect, allowRoles(Role.ADMIN)];
const staff = [protect, allowRoles(Role.ADMIN, Role.STUDENT)];

attendanceRouter.post("/mark", ...admin, [body("userId").notEmpty(), body("date").isISO8601(), body("status").isIn(["PRESENT", "ABSENT", "LATE"])], erpController.markAttendance);
attendanceRouter.get("/student/:id", ...staff, erpController.studentAttendance);
attendanceRouter.get("/class", ...admin, erpController.classAttendance);

timetableRouter.get("/", protect, erpController.timetable);
timetableRouter.post("/", ...admin, [body("title").notEmpty(), body("batch").notEmpty(), body("subject").notEmpty(), body("instructor").notEmpty(), body("startTime").isISO8601(), body("endTime").isISO8601(), body("classroom").notEmpty()], erpController.createTimetable);
timetableRouter.put("/:id", ...admin, erpController.updateTimetable);
timetableRouter.delete("/:id", ...admin, erpController.deleteTimetable);

facultyRouter.get("/", ...admin, erpController.faculty);
facultyRouter.post("/", ...admin, [body("userId").notEmpty(), body("department").notEmpty(), body("designation").notEmpty(), body("joiningDate").isISO8601(), body("salary").isFloat({ min: 0 }), body("status").notEmpty()], erpController.createFaculty);

payrollRouter.get("/", ...admin, erpController.payroll);
payrollRouter.post("/", ...admin, [body("facultyId").notEmpty(), body("month").notEmpty(), body("basicSalary").isFloat({ min: 0 }), body("incentives").isFloat({ min: 0 }), body("deductions").isFloat({ min: 0 }), body("paidStatus").notEmpty()], erpController.createPayroll);

announcementsRouter.get("/", protect, erpController.announcements);
announcementsRouter.post("/", ...admin, [body("title").notEmpty(), body("description").notEmpty(), body("targetAudience").notEmpty()], erpController.createAnnouncement);

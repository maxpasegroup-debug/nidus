import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { fitnessController } from "./fitness.controller.js";

export const fitnessRouter = Router();

const fitnessRoles = [protect, allowRoles(Role.STUDENT, Role.TRAINER, Role.ADMIN)];
const trainerRoles = [protect, allowRoles(Role.TRAINER, Role.ADMIN)];

const profileValidators = [body("userId").optional().trim(), body("height").isFloat({ min: 100 }), body("weight").isFloat({ min: 25 }), body("runningTime").isFloat({ min: 0 }), body("pushups").isInt({ min: 0 }), body("pullups").isInt({ min: 0 }), body("situps").isInt({ min: 0 })];

fitnessRouter.get("/profile", ...fitnessRoles, fitnessController.profile);
fitnessRouter.post("/profile", ...fitnessRoles, profileValidators, fitnessController.upsertProfile);
fitnessRouter.put("/profile", ...fitnessRoles, profileValidators, fitnessController.upsertProfile);

fitnessRouter.get("/pt-schedules", ...fitnessRoles, fitnessController.ptSchedules);
fitnessRouter.post("/pt-schedules", ...trainerRoles, [body("title").trim().notEmpty(), body("description").trim().notEmpty(), body("scheduledDate").isISO8601(), body("trainerName").trim().notEmpty(), body("activityType").trim().notEmpty(), body("duration").isInt({ min: 1 })], fitnessController.createPTSchedule);

fitnessRouter.post("/attendance", ...trainerRoles, [body("studentId").notEmpty(), body("ptScheduleId").notEmpty(), body("attendanceStatus").trim().notEmpty(), body("remarks").optional().trim()], fitnessController.markAttendance);
fitnessRouter.get("/attendance/:studentId", ...fitnessRoles, fitnessController.attendance);

fitnessRouter.get("/eligibility", ...fitnessRoles, fitnessController.eligibility);
fitnessRouter.post("/eligibility/check", ...fitnessRoles, [body("userId").optional().trim(), body("examType").trim().notEmpty()], fitnessController.checkEligibility);

fitnessRouter.post("/log", ...fitnessRoles, [body("userId").optional().trim(), body("runningDistance").isFloat({ min: 0 }), body("caloriesBurned").isFloat({ min: 0 }), body("waterIntake").isFloat({ min: 0 }), body("workoutDuration").isInt({ min: 0 }), body("notes").optional().trim()], fitnessController.createLog);
fitnessRouter.get("/logs", ...fitnessRoles, fitnessController.logs);

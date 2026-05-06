import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { hostelController } from "./hostel.controller.js";

export const hostelsRouter = Router();
export const roomsRouter = Router();
export const hostelOpsRouter = Router();
export const messRouter = Router();
export const disciplineRouter = Router();
export const paradeRouter = Router();

const adminWarden = [protect, allowRoles(Role.ADMIN, Role.WARDEN)];
const hostelAccess = [protect, allowRoles(Role.ADMIN, Role.WARDEN, Role.STUDENT)];
const mealAccess = [protect, allowRoles(Role.ADMIN, Role.WARDEN, Role.STUDENT)];

hostelsRouter.get("/", ...hostelAccess, hostelController.hostels);
hostelsRouter.post("/", ...adminWarden, [body("name").trim().notEmpty(), body("type").isIn(["BOYS", "GIRLS"]), body("totalRooms").isInt({ min: 1 }), body("wardenName").trim().notEmpty()], hostelController.createHostel);

roomsRouter.get("/", ...hostelAccess, hostelController.rooms);
roomsRouter.post("/", ...adminWarden, [body("hostelId").notEmpty(), body("roomNumber").trim().notEmpty(), body("floor").isInt({ min: 0 }), body("capacity").isInt({ min: 1 }), body("status").optional().trim().notEmpty()], hostelController.createRoom);

hostelOpsRouter.post("/allocate", ...adminWarden, [body("studentId").notEmpty(), body("hostelId").notEmpty(), body("roomId").notEmpty(), body("status").optional().trim().notEmpty()], hostelController.allocate);
hostelOpsRouter.get("/student/:id", ...hostelAccess, hostelController.studentProfile);
hostelOpsRouter.post("/inout", ...hostelAccess, [body("studentId").notEmpty(), body("type").isIn(["IN", "OUT"]), body("entryTime").optional().isISO8601(), body("remarks").optional().trim()], hostelController.createInOut);
hostelOpsRouter.get("/inout/history", ...hostelAccess, hostelController.inOutHistory);
hostelOpsRouter.get("/leave", ...hostelAccess, hostelController.leaves);
hostelOpsRouter.post("/leave", ...hostelAccess, [body("studentId").notEmpty(), body("reason").trim().notEmpty(), body("fromDate").isISO8601(), body("toDate").isISO8601()], hostelController.createLeave);
hostelOpsRouter.put("/leave/:id", ...adminWarden, [body("status").isIn(["APPROVED", "REJECTED", "PENDING"])], hostelController.updateLeave);

messRouter.get("/menu", ...mealAccess, hostelController.messMenu);
messRouter.post("/menu", ...adminWarden, [body("date").isISO8601(), body("breakfast").trim().notEmpty(), body("lunch").trim().notEmpty(), body("snacks").trim().notEmpty(), body("dinner").trim().notEmpty()], hostelController.upsertMessMenu);

disciplineRouter.post("/", ...adminWarden, [body("studentId").notEmpty(), body("category").trim().notEmpty(), body("description").trim().notEmpty(), body("severity").isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]), body("actionTaken").trim().notEmpty()], hostelController.createDiscipline);
disciplineRouter.get("/student/:id", ...hostelAccess, hostelController.disciplineByStudent);

paradeRouter.post("/", ...adminWarden, [body("studentId").notEmpty(), body("attendance").isInt({ min: 0, max: 100 }), body("discipline").isInt({ min: 0, max: 100 }), body("leadership").isInt({ min: 0, max: 100 }), body("fitness").isInt({ min: 0, max: 100 }), body("remarks").optional().trim()], hostelController.createParade);
paradeRouter.get("/student/:id", ...hostelAccess, hostelController.paradeByStudent);

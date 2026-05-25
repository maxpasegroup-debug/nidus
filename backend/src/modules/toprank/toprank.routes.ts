import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { toprankController } from "./toprank.controller.js";
import { allowedToprankExams } from "./toprank.service.js";

export const toprankRouter = Router();

toprankRouter.post(
  "/session",
  protect,
  allowRoles(Role.STUDENT, Role.ADMIN, Role.DIRECTOR),
  [body("examSlug").isIn(allowedToprankExams).withMessage("Invalid TOPRANK exam route")],
  toprankController.createSession
);

toprankRouter.post(
  "/admin-session",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.TEACHER),
  [body("target").isIn(["admin", "ops"]).withMessage("Invalid TOPRANK admin target")],
  toprankController.createAdminSession
);

toprankRouter.get("/status", protect, allowRoles(Role.STUDENT, Role.ADMIN, Role.DIRECTOR), toprankController.status);

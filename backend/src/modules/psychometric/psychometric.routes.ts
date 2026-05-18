import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { psychometricController } from "./psychometric.controller.js";

export const psychometricRouter = Router();

psychometricRouter.get("/tests", psychometricController.list);
psychometricRouter.get("/tests/:id", psychometricController.details);
psychometricRouter.post(
  "/start",
  protect,
  allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN),
  [body("testId").notEmpty().withMessage("Test id is required")],
  psychometricController.start
);
psychometricRouter.post(
  "/submit",
  protect,
  allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN),
  [
    body("attemptId").notEmpty().withMessage("Attempt id is required"),
    body("answers").isArray().withMessage("Answers must be an array")
  ],
  psychometricController.submit
);
psychometricRouter.get("/results/:attemptId", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN), psychometricController.result);
psychometricRouter.get("/olq-report", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN), psychometricController.olqReport);
psychometricRouter.get("/intelligence", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.TEACHER, Role.ADMIN), psychometricController.intelligence);

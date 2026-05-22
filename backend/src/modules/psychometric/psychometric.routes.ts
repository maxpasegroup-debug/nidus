import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { psychometricController } from "./psychometric.controller.js";

export const psychometricRouter = Router();

psychometricRouter.get("/tests", psychometricController.list);
psychometricRouter.get("/admin/overview", protect, allowRoles(Role.ADMIN, Role.DIRECTOR), psychometricController.adminOverview);
psychometricRouter.get("/admin/readiness", protect, allowRoles(Role.ADMIN, Role.DIRECTOR), psychometricController.adminReadiness);
psychometricRouter.get("/admin/tests", protect, allowRoles(Role.ADMIN, Role.DIRECTOR), psychometricController.adminTests);
psychometricRouter.patch(
  "/admin/tests/:id",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR),
  [
    body("title").optional().isString(),
    body("description").optional().isString(),
    body("duration").optional().isInt({ min: 5, max: 180 }),
    body("instructions").optional().isString(),
    body("access").optional().isIn(["FREE", "CORE", "PREMIUM"]),
    body("category").optional().isString(),
    body("isActive").optional().isBoolean()
  ],
  psychometricController.updateTest
);
psychometricRouter.patch(
  "/admin/questions/:id",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR),
  [
    body("questionText").optional().isString(),
    body("questionType").optional().isString(),
    body("options").optional().isArray({ min: 2 }),
    body("order").optional().isInt({ min: 1 })
  ],
  psychometricController.updateQuestion
);
psychometricRouter.get("/tests/:id/history", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN), psychometricController.history);
psychometricRouter.get("/tests/:id", psychometricController.details);
psychometricRouter.get("/reports", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN), psychometricController.reports);
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
psychometricRouter.get("/results/:attemptId", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN, Role.DIRECTOR), psychometricController.result);
psychometricRouter.get("/results/:attemptId/pdf", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN, Role.DIRECTOR), psychometricController.resultPdf);
psychometricRouter.get("/olq-report", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.ADMIN), psychometricController.olqReport);
psychometricRouter.get("/intelligence", protect, allowRoles(Role.STUDENT, Role.GUEST, Role.TEACHER, Role.ADMIN), psychometricController.intelligence);

import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { testsController } from "./tests.controller.js";

export const testsRouter = Router();

function testValidators(optional = false) {
  const maybe = (chain: ReturnType<typeof body>) => (optional ? chain.optional() : chain);
  return [
    maybe(body("title")).trim().isLength({ min: 3 }).withMessage("Title must be at least 3 characters"),
    maybe(body("description")).trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
    maybe(body("examType")).trim().notEmpty().withMessage("Exam type is required"),
    maybe(body("category")).trim().notEmpty().withMessage("Category is required"),
    maybe(body("duration")).isInt({ min: 1 }).withMessage("Duration must be minutes"),
    maybe(body("totalMarks")).isFloat({ min: 1 }).withMessage("Total marks must be positive"),
    body("isMockTest").optional().isBoolean(),
    body("isLive").optional().isBoolean()
  ];
}

testsRouter.get("/", testsController.list);
testsRouter.get("/attempts/history", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.history);
testsRouter.get("/result/:attemptId", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.result);
testsRouter.get("/attempts/:attemptId/resume", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.resume);
testsRouter.get("/attempts/:attemptId/review-plan", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.reviewPlan);
testsRouter.get("/:id", testsController.details);
testsRouter.post("/", protect, allowRoles(Role.ADMIN), testValidators(), testsController.create);
testsRouter.put("/:id", protect, allowRoles(Role.ADMIN), testValidators(true), testsController.update);
testsRouter.delete("/:id", protect, allowRoles(Role.ADMIN), testsController.remove);
testsRouter.post("/start", protect, allowRoles(Role.STUDENT, Role.ADMIN), [body("testId").notEmpty()], testsController.start);
testsRouter.post(
  "/submit",
  protect,
  allowRoles(Role.STUDENT, Role.ADMIN),
  [
    body("attemptId").notEmpty(),
    body("answers").isArray(),
    body("timeTaken").isInt({ min: 0 })
  ],
  testsController.submit
);
testsRouter.post(
  "/autosave",
  protect,
  allowRoles(Role.STUDENT, Role.ADMIN),
  [body("attemptId").notEmpty(), body("answers").isArray()],
  testsController.saveState
);
testsRouter.post(
  "/integrity-event",
  protect,
  allowRoles(Role.STUDENT, Role.ADMIN),
  [body("attemptId").notEmpty(), body("eventType").trim().notEmpty(), body("severity").optional().isIn(["LOW", "MEDIUM", "HIGH"])],
  testsController.integrityEvent
);

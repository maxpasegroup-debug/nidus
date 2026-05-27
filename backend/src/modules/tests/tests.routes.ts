import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { testsController } from "./tests.controller.js";

export const testsRouter = Router();

function testValidators(optional = false) {
  const maybe = (chain: ReturnType<typeof body>) => (optional ? chain.optional() : chain);
  return [
    maybe(body("title")).trim().isLength({ min: 3 }).withMessage("Title must be at least 3 characters"),
    maybe(body("description")).trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
    maybe(body("examType")).trim().notEmpty().withMessage("Exam type is required"),
    maybe(body("category")).trim().notEmpty().withMessage("Category is required"),
    body("subject").optional({ nullable: true }).trim(),
    body("topic").optional({ nullable: true }).trim(),
    body("batchId").optional({ nullable: true }).trim(),
    body("teacherId").optional({ nullable: true }).trim(),
    body("publishAt").optional({ nullable: true }).isISO8601(),
    body("status").optional({ nullable: true }).trim(),
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
testsRouter.get("/attempts/:attemptId/intelligence", protect, allowRoles(Role.STUDENT, Role.TEACHER, Role.ADMIN), testsController.intelligenceReport);
testsRouter.post(
  "/ai-draft",
  protect,
  allowRoles(Role.ADMIN, Role.TEACHER),
  [
    body("prompt").trim().isLength({ min: 5 }).withMessage("Prompt must describe the test"),
    body("examType").optional({ nullable: true }).trim(),
    body("subject").optional({ nullable: true }).trim(),
    body("topic").optional({ nullable: true }).trim(),
    body("questionCount").optional({ nullable: true }).isInt({ min: 5, max: 100 }),
    body("difficultyLevel").optional({ nullable: true }).trim(),
    body("batchId").optional({ nullable: true }).trim()
  ],
  testsController.generateDraft
);
testsRouter.post("/publish-draft", protect, allowRoles(Role.ADMIN, Role.TEACHER), testValidators(), testsController.publishDraft);
testsRouter.get("/:id", testsController.details);
testsRouter.post("/", protect, allowRoles(Role.ADMIN, Role.TEACHER), testValidators(), testsController.create);
testsRouter.put("/:id", protect, allowRoles(Role.ADMIN, Role.TEACHER), testValidators(true), testsController.update);
testsRouter.delete("/:id", protect, allowRoles(Role.ADMIN, Role.TEACHER), testsController.remove);
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

import { Router } from "express";
import { body, query } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { testsController } from "./tests.controller.js";

export const testsRouter = Router();

function testValidators(optional = false) {
  const maybe = (chain: ReturnType<typeof body>) => (optional ? chain.optional() : chain);
  return [
    body("testId").optional({ nullable: true }).trim(),
    maybe(body("title")).trim().isLength({ min: 3 }).withMessage("Title must be at least 3 characters"),
    maybe(body("description")).trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
    maybe(body("examType")).trim().notEmpty().withMessage("Exam type is required"),
    maybe(body("category")).trim().notEmpty().withMessage("Category is required"),
    maybe(body("subject")).trim().notEmpty().withMessage("Subject is required"),
    maybe(body("topic")).trim().notEmpty().withMessage("Topic is required"),
    maybe(body("batchId")).trim().notEmpty().withMessage("Batch is required"),
    body("teacherId").optional({ nullable: true }).trim(),
    body("publishAt").optional({ nullable: true }).isISO8601(),
    maybe(body("examStartsAt")).isISO8601().withMessage("A valid exam start date and time are required"),
    body("examEndsAt").optional({ nullable: true }).isISO8601(),
    body("status").optional({ nullable: true }).trim(),
    maybe(body("duration")).isInt({ min: 1 }).withMessage("Duration must be minutes"),
    maybe(body("totalMarks")).isFloat({ min: 1 }).withMessage("Total marks must be positive"),
    maybe(body("expectedQuestionCount")).isInt({ min: 1 }).withMessage("Question count must be a whole number greater than zero"),
    body("authoritativeQuestionCount").optional({ nullable: true }).isInt({ min: 0 }),
    body("expectedTotalMarks").optional({ nullable: true }).isFloat({ min: 1 }),
    body("isMockTest").optional().isBoolean(),
    body("isLive").optional().isBoolean()
  ];
}

testsRouter.get("/", protect, allowRoles(Role.STUDENT, Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER), testsController.list);
testsRouter.get("/control", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD), [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be an integer greater than zero."),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be an integer between 1 and 100."),
  query("status").optional().isIn(["DRAFT", "IN_REVIEW", "SCHEDULED", "UPCOMING", "LIVE", "EXPIRED", "CLOSED", "ARCHIVED"]).withMessage("Invalid Exam Control status."),
  query("search").optional().trim().isLength({ max: 120 }).withMessage("Search must be 120 characters or fewer."),
  query("batchId").optional().trim().isLength({ min: 1, max: 128 }).matches(/^[A-Za-z0-9_-]+$/).withMessage("Invalid batch id."),
], testsController.control);
testsRouter.get("/available", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.available);
testsRouter.get("/attempts/history", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.history);
testsRouter.get("/result/:attemptId", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.result);
testsRouter.get("/attempts/:attemptId/resume", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.resume);
testsRouter.get("/attempts/:attemptId/review-plan", protect, allowRoles(Role.STUDENT, Role.ADMIN), testsController.reviewPlan);
testsRouter.get("/attempts/:attemptId/intelligence", protect, allowRoles(Role.STUDENT, Role.TEACHER, Role.ACADEMIC_HEAD, Role.ADMIN), testsController.intelligenceReport);
testsRouter.post(
  "/ai-draft",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
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
testsRouter.patch(
  "/:id/lifecycle",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
  [
    body("lifecycle").isIn(["DRAFT", "IN_REVIEW", "SCHEDULED", "LIVE", "CLOSED", "ARCHIVED"]),
    body("examStartsAt").optional({ nullable: true }).isISO8601(),
    body("examEndsAt").optional({ nullable: true }).isISO8601(),
  ],
  testsController.transitionLifecycle
);
testsRouter.post("/publish-draft", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER), testValidators(), testsController.publishDraft);
testsRouter.post(
  "/:id/approve",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
  [body("attestation").equals("TEACHER_REVIEW_CONFIRMED"), body("questionIds").isArray({ min: 1 })],
  testsController.approve
);
testsRouter.post(
  "/:id/publish",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
  [body("publishAt").optional({ nullable: true }).isISO8601(), body("batchId").optional({ nullable: true }).trim()],
  testsController.publishApproved
);
testsRouter.post(
  "/:id/release",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
  [body("action").isIn(["SAVE_DRAFT", "SCHEDULE", "PUBLISH_NOW"]), body("releaseAt").optional({ nullable: true }).isISO8601()],
  testsController.release
);
testsRouter.get("/:id", protect, allowRoles(Role.STUDENT, Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER), testsController.details);
testsRouter.get("/:id/review-summary", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER), testsController.reviewSummary);
testsRouter.post(
  "/:id/questions/:questionId/issues/:issueId/approve-as-is",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
  [body("reason").trim().notEmpty().withMessage("Approval reason is required")],
  testsController.approveReviewIssue
);
testsRouter.post(
  "/:id/review-reconcile",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
  [body("count").optional().isBoolean(), body("marks").optional().isBoolean()],
  testsController.reconcileReview
);
testsRouter.put(
  "/:id/questions/:questionId",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
  [
    body("questionText").trim().notEmpty(),
    body("optionA").trim().notEmpty(), body("optionB").trim().notEmpty(), body("optionC").trim().notEmpty(), body("optionD").trim().notEmpty(),
    body("correctAnswer").isIn(["A", "B", "C", "D"]),
    body("explanation").trim().notEmpty(), body("marks").isFloat({ min: 0.01 }), body("negativeMarks").isFloat({ min: 0 }),
    body("difficultyLevel").trim().notEmpty(), body("topic").trim().notEmpty(), body("reviewStatus").optional().trim(), body("changeReason").optional().trim(),
  ],
  testsController.updateDraftQuestion
);
testsRouter.post(
  "/:id/questions/clear",
  protect,
  allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER),
  testsController.clearDraftQuestions
);
testsRouter.post("/", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER), testValidators(), testsController.create);
testsRouter.put("/:id", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER), testValidators(true), testsController.update);
testsRouter.delete("/:id", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER), testsController.remove);
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

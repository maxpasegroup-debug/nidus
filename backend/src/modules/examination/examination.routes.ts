import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { examinationController } from "./examination.controller.js";

export const examinationRouter = Router();

const manageRoles = [Role.ADMIN, Role.DIRECTOR, Role.TEACHER];

function questionValidators(optional = false) {
  const maybe = (chain: ReturnType<typeof body>) => (optional ? chain.optional() : chain);
  return [
    maybe(body("questionText")).trim().isLength({ min: 5 }).withMessage("Question text is required"),
    body("questionType").optional().trim(),
    maybe(body("optionA")).trim().notEmpty().withMessage("Option A is required"),
    maybe(body("optionB")).trim().notEmpty().withMessage("Option B is required"),
    maybe(body("optionC")).trim().notEmpty().withMessage("Option C is required"),
    maybe(body("optionD")).trim().notEmpty().withMessage("Option D is required"),
    maybe(body("correctAnswer")).trim().isIn(["A", "B", "C", "D", "a", "b", "c", "d"]).withMessage("Correct answer must be A, B, C or D"),
    body("explanation").optional().trim(),
    body("category").optional().trim(),
    maybe(body("subCategory")).trim().notEmpty().withMessage("Sub category is required"),
    maybe(body("topic")).trim().notEmpty().withMessage("Topic is required"),
    body("subTopic").optional().trim(),
    body("difficulty").optional().trim(),
    body("marks").optional().isFloat({ min: 0 }),
    body("negativeMarks").optional().isFloat({ min: 0 }),
    body("status").optional().trim()
  ];
}

const examValidators = [
  body("title").trim().isLength({ min: 3 }).withMessage("Exam name is required"),
  body("description").optional().trim(),
  body("examType").trim().notEmpty().withMessage("Exam type is required"),
  body("category").optional().trim(),
  body("subject").optional().trim(),
  body("topic").optional().trim(),
  body("batchId").optional({ nullable: true }).trim(),
  body("batchIds").optional().isArray(),
  body("duration").isInt({ min: 1 }).withMessage("Duration is required"),
  body("totalQuestions").optional().isInt({ min: 1, max: 200 }),
  body("marks").optional().isFloat({ min: 0 }),
  body("negativeMarks").optional().isFloat({ min: 0 }),
  body("passingPercentage").optional().isInt({ min: 0, max: 100 }),
  body("randomization").optional().isBoolean(),
  body("questionSelection").optional().isIn(["MANUAL", "RANDOM", "HYBRID"]),
  body("questionIds").optional().isArray(),
  body("publishNow").optional().isBoolean(),
  body("publishAt").optional({ nullable: true }).isISO8601()
];

examinationRouter.use(protect, allowRoles(...manageRoles));

examinationRouter.get("/question-bank", examinationController.questionBank);
examinationRouter.post("/question-bank", questionValidators(), examinationController.createQuestion);
examinationRouter.put("/question-bank/:id", questionValidators(true), examinationController.updateQuestion);
examinationRouter.delete("/question-bank/:id", examinationController.deleteQuestion);
examinationRouter.post("/question-bank/import", examinationController.importQuestions);

examinationRouter.post("/exams/from-bank", examValidators, examinationController.createExamFromBank);
examinationRouter.post("/exams/:id/publish", examinationController.publishExam);
examinationRouter.post("/exams/:id/close", examinationController.closeExam);
examinationRouter.delete("/exams/:id", examinationController.deleteExam);

examinationRouter.get("/results", examinationController.results);
examinationRouter.get("/analytics", examinationController.analytics);

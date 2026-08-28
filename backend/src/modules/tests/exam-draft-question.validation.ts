import { body, type ValidationChain } from "express-validator";

export function draftQuestionValidators(): ValidationChain[] {
  return [
    body("questionText").isString().trim().notEmpty().withMessage("Question text is required."),
    body("optionA").isString().trim().notEmpty().withMessage("Option A is required."),
    body("optionB").isString().trim().notEmpty().withMessage("Option B is required."),
    body("optionC").isString().trim().notEmpty().withMessage("Option C is required."),
    body("optionD").isString().trim().notEmpty().withMessage("Option D is required."),
    body("correctAnswer").optional({ nullable: true }).isString().trim().toUpperCase().isIn(["", "A", "B", "C", "D"]).withMessage("Correct answer must be blank or one of A, B, C or D."),
    body("explanation").optional({ nullable: true }).isString().trim().isLength({ max: 5000 }).withMessage("Explanation must be 5000 characters or fewer."),
    body("marks").isFloat({ min: 0.01, max: 1000 }).withMessage("Marks must be greater than 0 and no more than 1000."),
    body("negativeMarks").isFloat({ min: 0, max: 1000 }).withMessage("Negative marks must be between 0 and 1000."),
    body("difficultyLevel").isString().trim().notEmpty().withMessage("Difficulty level is required."),
    body("topic").isString().trim().notEmpty().withMessage("Topic is required."),
    body("reviewStatus").optional({ nullable: true }).isString().trim().isLength({ max: 64 }).withMessage("Review status is invalid."),
    body("changeReason").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }).withMessage("Change reason must be 1000 characters or fewer."),
  ];
}

import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { learningHubController } from "./learning-hub.controller.js";

export const pyqRouter = Router();
export const currentAffairsRouter = Router();
export const quizBattlesRouter = Router();
export const leaderboardRouter = Router();

const authenticated = [protect];
const admin = [protect, allowRoles(Role.ADMIN, Role.TEACHER)];

const questionValidators = [body("categoryId").notEmpty(), body("year").isInt({ min: 1900 }), body("subject").trim().notEmpty(), body("topic").trim().notEmpty(), body("questionText").trim().notEmpty(), body("optionA").trim().notEmpty(), body("optionB").trim().notEmpty(), body("optionC").trim().notEmpty(), body("optionD").trim().notEmpty(), body("correctAnswer").trim().notEmpty(), body("explanation").trim().notEmpty(), body("difficultyLevel").trim().notEmpty()];

pyqRouter.get("/categories", ...authenticated, learningHubController.pyqCategories);
pyqRouter.get("/questions", ...authenticated, learningHubController.pyqQuestions);
pyqRouter.post("/questions", ...admin, questionValidators, learningHubController.createPYQQuestion);

currentAffairsRouter.get("/", ...authenticated, learningHubController.currentAffairs);
currentAffairsRouter.post("/", ...admin, [body("title").trim().notEmpty(), body("description").trim().notEmpty(), body("category").trim().notEmpty(), body("imageUrl").optional().isURL(), body("publishedDate").isISO8601(), body("quizzes").optional().isArray()], learningHubController.createCurrentAffair);

quizBattlesRouter.get("/", ...authenticated, learningHubController.quizBattles);
quizBattlesRouter.post("/", ...admin, [body("title").trim().notEmpty(), body("category").trim().notEmpty(), body("startTime").isISO8601(), body("endTime").isISO8601()], learningHubController.createQuizBattle);
quizBattlesRouter.post("/join", ...authenticated, [body("battleId").notEmpty()], learningHubController.joinBattle);
quizBattlesRouter.post("/submit", ...authenticated, [body("battleId").notEmpty(), body("score").isInt({ min: 0 }), body("timeTaken").isInt({ min: 0 })], learningHubController.submitBattle);

leaderboardRouter.get("/", ...authenticated, learningHubController.leaderboard);

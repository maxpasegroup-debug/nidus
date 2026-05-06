import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { aiEngineController } from "./ai-engine.controller.js";

export const aiEngineRouter = Router();
const aiRoles = [protect, allowRoles(Role.STUDENT, Role.ADMIN)];

aiEngineRouter.post("/interview/start", ...aiRoles, [body("examType").trim().notEmpty(), body("interviewType").trim().notEmpty()], aiEngineController.startInterview);
aiEngineRouter.post("/interview/next-question", ...aiRoles, [body("sessionId").notEmpty()], aiEngineController.nextQuestion);
aiEngineRouter.post("/interview/submit-answer", ...aiRoles, [body("questionId").notEmpty(), body("userAnswer").trim().notEmpty()], aiEngineController.submitAnswer);
aiEngineRouter.get("/interview/result/:sessionId", ...aiRoles, aiEngineController.result);
aiEngineRouter.post("/doubt", ...aiRoles, [body("question").trim().notEmpty(), body("subject").trim().notEmpty()], aiEngineController.doubt);
aiEngineRouter.get("/doubts/history", ...aiRoles, aiEngineController.doubtsHistory);
aiEngineRouter.get("/recommendations", ...aiRoles, aiEngineController.recommendations);
aiEngineRouter.get("/officer-potential", ...aiRoles, aiEngineController.officerPotential);

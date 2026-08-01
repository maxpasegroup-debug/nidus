import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { uploadRateLimiter } from "../../middlewares/security.js";
import { ndieController } from "./ndie.controller.js";
import { ndieErrorHandler, ndieUpload, requireNdieEnabled } from "./security/ndie-security.js";

export const ndieRouter = Router();

ndieRouter.get("/health", ndieController.health);

const manageRoles = [Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER];

ndieRouter.use(protect, allowRoles(...manageRoles));
ndieRouter.use(requireNdieEnabled);
ndieRouter.get("/analytics", ndieController.analytics);
ndieRouter.post("/imports", uploadRateLimiter, ndieUpload.single("file"), ndieController.createImport);
ndieRouter.get("/imports/:id", ndieController.getImport);
ndieRouter.post("/imports/:id/analyze-layout", ndieController.analyzeLayout);
ndieRouter.post("/imports/:id/detect-formulas", ndieController.detectFormulas);
ndieRouter.post("/imports/:id/detect-visuals", ndieController.detectVisuals);
ndieRouter.post("/imports/:id/detect-questions", ndieController.detectQuestions);
ndieRouter.post("/imports/:id/map-answers", ndieController.mapAnswers);
ndieRouter.post("/imports/:id/validate-ai", ndieController.validateAi);
ndieRouter.get("/imports/:id/review", ndieController.reviewWorkspace);
ndieRouter.post("/imports/:id/publish", ndieController.publish);
ndieRouter.post("/imports/:id/replay", ndieController.replay);
ndieRouter.post("/imports/:id/cancel", ndieController.cancelImport);
ndieRouter.get("/imports/:id/replay-runs", ndieController.replayRuns);
ndieRouter.post("/imports/:id/quality-report", ndieController.qualityReport);
ndieRouter.patch("/imports/:id/review-session", ndieController.saveReviewSession);
ndieRouter.patch("/imports/:id/review/bulk", ndieController.bulkReview);
ndieRouter.patch("/questions/:candidateId/review", ndieController.reviewCandidate);
ndieRouter.use(ndieErrorHandler);

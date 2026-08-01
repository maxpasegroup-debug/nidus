import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { upload } from "../media/media.middleware.js";
import { ndieController } from "./ndie.controller.js";

export const ndieRouter = Router();

ndieRouter.get("/health", ndieController.health);

const manageRoles = [Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER];

ndieRouter.use(protect, allowRoles(...manageRoles));
ndieRouter.get("/analytics", ndieController.analytics);
ndieRouter.post("/imports", upload.single("file"), ndieController.createImport);
ndieRouter.get("/imports/:id", ndieController.getImport);
ndieRouter.post("/imports/:id/analyze-layout", ndieController.analyzeLayout);
ndieRouter.post("/imports/:id/detect-visuals", ndieController.detectVisuals);
ndieRouter.post("/imports/:id/detect-questions", ndieController.detectQuestions);
ndieRouter.post("/imports/:id/map-answers", ndieController.mapAnswers);
ndieRouter.post("/imports/:id/validate-ai", ndieController.validateAi);
ndieRouter.get("/imports/:id/review", ndieController.reviewWorkspace);
ndieRouter.post("/imports/:id/publish", ndieController.publish);
ndieRouter.post("/imports/:id/replay", ndieController.replay);
ndieRouter.get("/imports/:id/replay-runs", ndieController.replayRuns);
ndieRouter.post("/imports/:id/quality-report", ndieController.qualityReport);
ndieRouter.patch("/questions/:candidateId/review", ndieController.reviewCandidate);

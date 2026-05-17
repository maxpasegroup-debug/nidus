import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { aiPlannerController } from "./ai-planner.controller.js";

export const aiPlannerRouter = Router();
export const analyticsRouter = Router();
export const revisionScheduleRouter = Router();

const studentOnly = [protect, allowRoles(Role.STUDENT, Role.ADMIN)];

aiPlannerRouter.post(
  "/generate",
  ...studentOnly,
  [
    body("targetExam").notEmpty(),
    body("studyHoursPerDay").isInt({ min: 1, max: 16 }),
    body("targetDate").isISO8601(),
    body("strengths").isArray(),
    body("weaknesses").isArray()
  ],
  aiPlannerController.generate
);
aiPlannerRouter.get("/my-plan", ...studentOnly, aiPlannerController.myPlan);

analyticsRouter.get("/performance", ...studentOnly, aiPlannerController.performance);
analyticsRouter.get("/recommendations", ...studentOnly, aiPlannerController.recommendations);

revisionScheduleRouter.post(
  "/create",
  ...studentOnly,
  [body("topic").notEmpty(), body("revisionDate").isISO8601(), body("priority").isIn(["LOW", "MEDIUM", "HIGH"])],
  aiPlannerController.createRevision
);
revisionScheduleRouter.get("/", ...studentOnly, aiPlannerController.revisionSchedule);

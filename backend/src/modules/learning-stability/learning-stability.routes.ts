import { Router } from "express";
import type { NextFunction, Response } from "express";
import { body, validationResult } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect, type AuthenticatedRequest } from "../auth/auth.middleware.js";
import { learningStabilityService } from "./learning-stability.service.js";

export const learningStabilityRouter = Router();

function userId(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user.id;
}

function assertValid(req: AuthenticatedRequest) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function param(req: AuthenticatedRequest, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

learningStabilityRouter.use(protect);

learningStabilityRouter.post("/offline/sync", [body("events").isArray()], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { assertValid(req); res.json(await learningStabilityService.offlineSync(userId(req), req.body.events)); } catch (error) { next(error); }
});

learningStabilityRouter.get("/analytics", async (req: AuthenticatedRequest, res, next) => {
  try { res.json({ analytics: await learningStabilityService.analytics(userId(req)) }); } catch (error) { next(error); }
});

learningStabilityRouter.get("/adaptive", async (req: AuthenticatedRequest, res, next) => {
  try { res.json({ adaptive: await learningStabilityService.adaptiveLearning(userId(req)) }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/tutor/sessions", [body("subject").trim().notEmpty(), body("topic").optional().trim(), body("examType").optional().trim()], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { assertValid(req); res.status(201).json({ session: await learningStabilityService.createTutorSession(userId(req), req.body) }); } catch (error) { next(error); }
});

learningStabilityRouter.get("/tutor/sessions/:id", async (req: AuthenticatedRequest, res, next) => {
  try { res.json({ session: await learningStabilityService.tutorSession(userId(req), param(req, "id")) }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/tutor/sessions/:id/message", [body("content").trim().notEmpty()], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { assertValid(req); res.status(201).json({ message: await learningStabilityService.tutorMessage(userId(req), param(req, "id"), req.body.content) }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/tutor/sessions/:id/feedback", [body("rating").isInt({ min: 1, max: 5 }), body("feedback").optional().trim(), body("escalationRequested").optional().isBoolean()], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { assertValid(req); res.status(201).json({ feedback: await learningStabilityService.tutorFeedback(userId(req), param(req, "id"), req.body) }); } catch (error) { next(error); }
});

learningStabilityRouter.get("/daily-intelligence", allowRoles(Role.ADMIN, Role.TEACHER, Role.MARKETING_COORDINATOR), async (_req, res, next) => {
  try { res.json({ issues: await learningStabilityService.dailyIssues() }); } catch (error) { next(error); }
});

learningStabilityRouter.get("/daily-intelligence/moderation", allowRoles(Role.ADMIN, Role.TEACHER, Role.MARKETING_COORDINATOR), async (_req, res, next) => {
  try { res.json({ items: await learningStabilityService.moderationQueue() }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/daily-intelligence", allowRoles(Role.ADMIN, Role.TEACHER, Role.MARKETING_COORDINATOR), [body("title").trim().notEmpty(), body("issueDate").isISO8601(), body("categories").isArray()], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { assertValid(req); res.status(201).json({ issue: await learningStabilityService.dailyIssueDraft(req.body) }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/daily-intelligence/schedule", allowRoles(Role.ADMIN, Role.MARKETING_COORDINATOR), [body("title").trim().notEmpty(), body("issueDate").isISO8601(), body("categories").isArray(), body("publishAt").optional().isISO8601()], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { assertValid(req); res.status(201).json({ issue: await learningStabilityService.scheduleIssue(req.body) }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/daily-intelligence/:id/publish", allowRoles(Role.ADMIN, Role.MARKETING_COORDINATOR), async (req, res, next) => {
  try { res.json({ issue: await learningStabilityService.publishIssue(param(req as AuthenticatedRequest, "id")) }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/daily-intelligence/:id/archive", allowRoles(Role.ADMIN, Role.MARKETING_COORDINATOR), async (req, res, next) => {
  try { res.json({ issue: await learningStabilityService.archiveIssue(param(req as AuthenticatedRequest, "id")) }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/content/generate", allowRoles(Role.ADMIN, Role.TEACHER, Role.MARKETING_COORDINATOR), [body("contentType").trim().notEmpty(), body("title").trim().notEmpty(), body("prompt").trim().notEmpty(), body("sourceId").optional().trim(), body("tags").optional().isArray()], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { assertValid(req); res.status(201).json({ asset: await learningStabilityService.generateContent(userId(req), req.body) }); } catch (error) { next(error); }
});

learningStabilityRouter.post("/ingestion/jobs", allowRoles(Role.ADMIN, Role.TEACHER, Role.MARKETING_COORDINATOR), [body("sourceType").trim().notEmpty(), body("targetModule").isIn(["CBT", "PSYCHOMETRIC", "SSB", "CURRENT_AFFAIRS", "COURSE", "MEDIA"]), body("sourceUrl").optional().trim(), body("uploadUrl").optional().trim()], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { assertValid(req); res.status(201).json({ job: await learningStabilityService.createIngestionJob(userId(req), req.body) }); } catch (error) { next(error); }
});

learningStabilityRouter.get("/ingestion/jobs", allowRoles(Role.ADMIN, Role.TEACHER, Role.MARKETING_COORDINATOR), async (_req, res, next) => {
  try { res.json({ jobs: await learningStabilityService.ingestionJobs() }); } catch (error) { next(error); }
});

learningStabilityRouter.get("/ai-governance", allowRoles(Role.ADMIN, Role.DIRECTOR), async (_req, res, next) => {
  try { res.json({ governance: await learningStabilityService.aiGovernance() }); } catch (error) { next(error); }
});

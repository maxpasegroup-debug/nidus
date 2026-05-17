import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { aiPlannerService } from "./ai-planner.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function userId(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user.id;
}

export const aiPlannerController = {
  async generate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const plan = await aiPlannerService.generate(userId(req), req.body);
      res.status(201).json({ plan });
    } catch (error) {
      next(error);
    }
  },

  async myPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const plan = await aiPlannerService.myPlan(userId(req));
      res.json({ plan });
    } catch (error) {
      next(error);
    }
  },

  async performance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await aiPlannerService.performance(userId(req));
      res.json({ analytics });
    } catch (error) {
      next(error);
    }
  },

  async recommendations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const recommendations = await aiPlannerService.recommendations(userId(req));
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  },

  async createRevision(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const revision = await aiPlannerService.createRevision(userId(req), req.body);
      res.status(201).json({ revision });
    } catch (error) {
      next(error);
    }
  },

  async revisionSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const revisions = await aiPlannerService.revisionSchedule(userId(req));
      res.json({ revisions });
    } catch (error) {
      next(error);
    }
  }
};

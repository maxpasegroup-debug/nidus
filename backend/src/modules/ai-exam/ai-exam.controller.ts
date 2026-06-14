import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { aiExamService } from "./ai-exam.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

export const aiExamController = {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await aiExamService.create(actor(req), req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async review(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await aiExamService.review(actor(req), req.body));
    } catch (error) {
      next(error);
    }
  },

  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await aiExamService.approve(actor(req), req.body));
    } catch (error) {
      next(error);
    }
  },

  async publish(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await aiExamService.publish(actor(req), req.body));
    } catch (error) {
      next(error);
    }
  }
};

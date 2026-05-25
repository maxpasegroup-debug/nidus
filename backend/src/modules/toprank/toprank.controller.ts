import type { NextFunction, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { toprankService } from "./toprank.service.js";

function assertValid(req: AuthenticatedRequest) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function user(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}

export const toprankController = {
  async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const result = await toprankService.createSession(user(req), req.body.examSlug);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async createAdminSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const result = await toprankService.createAdminSession(user(req), req.body.target);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async status(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await toprankService.status(user(req).id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};

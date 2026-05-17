import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { psychometricService } from "./psychometric.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

function userId(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user.id;
}

export const psychometricController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const tests = await psychometricService.listTests();
      res.json({ tests });
    } catch (error) {
      next(error);
    }
  },

  async details(req: Request, res: Response, next: NextFunction) {
    try {
      const test = await psychometricService.getTest(param(req, "id"));
      res.json({ test });
    } catch (error) {
      next(error);
    }
  },

  async start(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const attempt = await psychometricService.start(userId(req), req.body.testId);
      res.status(201).json({ attempt });
    } catch (error) {
      next(error);
    }
  },

  async submit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const attempt = await psychometricService.submit(userId(req), req.body.attemptId, req.body.answers);
      res.json({ attempt });
    } catch (error) {
      next(error);
    }
  },

  async result(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await psychometricService.result(userId(req), param(req, "attemptId"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async olqReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await psychometricService.olqReport(userId(req));
      res.json(report);
    } catch (error) {
      next(error);
    }
  },

  async intelligence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const intelligence = await psychometricService.intelligence(userId(req));
      res.json({ intelligence });
    } catch (error) {
      next(error);
    }
  }
};

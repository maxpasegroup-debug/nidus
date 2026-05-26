import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { Role } from "../../generated/prisma/client.js";
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

function userRole(req: AuthenticatedRequest): Role {
  if (!req.user) throw new Error("Unauthorized");
  return req.user.role;
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

  async adminTests(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tests = await psychometricService.adminTests();
      res.json({ tests });
    } catch (error) {
      next(error);
    }
  },

  async updateTest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const test = await psychometricService.updateTest(param(req, "id"), req.body);
      res.json({ test });
    } catch (error) {
      next(error);
    }
  },

  async updateQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const question = await psychometricService.updateQuestion(param(req, "id"), req.body);
      res.json({ question });
    } catch (error) {
      next(error);
    }
  },

  async start(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const attempt = await psychometricService.start(userId(req), req.body.testId, userRole(req));
      res.status(201).json({ attempt });
    } catch (error) {
      next(error);
    }
  },

  async activeAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const attempt = await psychometricService.activeAttempt(userId(req), param(req, "attemptId"));
      res.json({ attempt });
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
      const result = await psychometricService.result(userId(req), param(req, "attemptId"), userRole(req));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async resultPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await psychometricService.resultPdf(userId(req), param(req, "attemptId"), userRole(req));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
      res.send(report.buffer);
    } catch (error) {
      next(error);
    }
  },

  async reports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reports = await psychometricService.reports(userId(req));
      res.json(reports);
    } catch (error) {
      next(error);
    }
  },

  async history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const history = await psychometricService.history(userId(req), param(req, "id"));
      res.json(history);
    } catch (error) {
      next(error);
    }
  },

  async adminOverview(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = await psychometricService.adminOverview();
      res.json(overview);
    } catch (error) {
      next(error);
    }
  },

  async adminAnalytics(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await psychometricService.adminAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  },

  async adminReadiness(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const readiness = await psychometricService.adminReadiness();
      res.json(readiness);
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

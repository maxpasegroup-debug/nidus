import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { testsService } from "./tests.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new Error(errors.array().map((error) => error.msg).join(", "));
  }
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

export const testsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tests = await testsService.list({
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        examType: typeof req.query.examType === "string" ? req.query.examType : undefined,
        topic: typeof req.query.topic === "string" ? req.query.topic : undefined
      });
      res.json({ tests });
    } catch (error) {
      next(error);
    }
  },

  async details(req: Request, res: Response, next: NextFunction) {
    try {
      const test = await testsService.details(param(req, "id"));
      res.json({ test });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const test = await testsService.create(req.body);
      res.status(201).json({ test });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const test = await testsService.update(param(req, "id"), req.body);
      res.json({ test });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await testsService.remove(param(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async start(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const attempt = await testsService.start(userId(req), req.body.testId);
      res.status(201).json({ attempt });
    } catch (error) {
      next(error);
    }
  },

  async submit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const result = await testsService.submit(userId(req), req.body.attemptId, req.body.answers, req.body.timeTaken);
      res.json({ result });
    } catch (error) {
      next(error);
    }
  },

  async resume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const attempt = await testsService.resume(userId(req), param(req, "attemptId"));
      res.json({ attempt });
    } catch (error) {
      next(error);
    }
  },

  async saveState(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const attempt = await testsService.saveState(userId(req), req.body);
      res.json({ attempt });
    } catch (error) {
      next(error);
    }
  },

  async integrityEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const event = await testsService.integrityEvent(userId(req), req.body);
      res.status(201).json({ event });
    } catch (error) {
      next(error);
    }
  },

  async reviewPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const plan = await testsService.reviewPlan(userId(req), param(req, "attemptId"));
      res.json({ plan });
    } catch (error) {
      next(error);
    }
  },

  async intelligenceReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await testsService.intelligenceReport(userId(req), param(req, "attemptId"));
      res.json({ report });
    } catch (error) {
      next(error);
    }
  },

  async history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const attempts = await testsService.history(userId(req));
      res.json({ attempts });
    } catch (error) {
      next(error);
    }
  },

  async result(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await testsService.result(userId(req), param(req, "attemptId"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};

import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { examinationService } from "./examination.service.js";

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

function requester(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}

export const examinationController = {
  async questionBank(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const questions = await examinationService.questionBank(requester(req), {
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        category: typeof req.query.category === "string" ? req.query.category : undefined,
        subCategory: typeof req.query.subCategory === "string" ? req.query.subCategory : undefined,
        topic: typeof req.query.topic === "string" ? req.query.topic : undefined,
        difficulty: typeof req.query.difficulty === "string" ? req.query.difficulty : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined
      });
      res.json({ questions });
    } catch (error) {
      next(error);
    }
  },

  async createQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const question = await examinationService.createQuestion(requester(req), req.body);
      res.status(201).json({ question });
    } catch (error) {
      next(error);
    }
  },

  async updateQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const question = await examinationService.updateQuestion(requester(req), param(req, "id"), req.body);
      res.json({ question });
    } catch (error) {
      next(error);
    }
  },

  async approveQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const question = await examinationService.approveQuestion(requester(req), param(req, "id"), req.body?.attestation);
      res.json({ question });
    } catch (error) {
      next(error);
    }
  },

  async deleteQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await examinationService.deleteQuestion(requester(req), param(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async importQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await examinationService.importQuestions(requester(req), req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async createExamFromBank(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const exam = await examinationService.createExamFromBank(requester(req), req.body);
      res.status(201).json({ exam });
    } catch (error) {
      next(error);
    }
  },

  async publishExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const exam = await examinationService.publishExam(requester(req), param(req, "id"), req.body ?? {});
      res.json({ exam });
    } catch (error) {
      next(error);
    }
  },

  async closeExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const exam = await examinationService.closeExam(requester(req), param(req, "id"));
      res.json({ exam });
    } catch (error) {
      next(error);
    }
  },

  async deleteExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await examinationService.deleteExam(requester(req), param(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async results(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const attempts = await examinationService.results(requester(req));
      res.json({ attempts });
    } catch (error) {
      next(error);
    }
  },

  async analytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await examinationService.analytics(requester(req));
      res.json({ analytics });
    } catch (error) {
      next(error);
    }
  }
};

import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { academyService } from "./academy.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
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

export const academyController = {
  async batches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({
        batches: await academyService.batches(requester(req), {
          programSlug: typeof req.query.programSlug === "string" ? req.query.programSlug : undefined,
          batchType: typeof req.query.batchType === "string" ? req.query.batchType : undefined,
          status: typeof req.query.status === "string" ? req.query.status : undefined
        })
      });
    } catch (error) {
      next(error);
    }
  },

  async createBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ batch: await academyService.createBatch(requester(req), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async addStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ assignment: await academyService.addStudent(requester(req), param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async assignTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ assignment: await academyService.assignTeacher(requester(req), param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async teacherAssignments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ assignments: await academyService.teacherAssignments(requester(req)) });
    } catch (error) {
      next(error);
    }
  }
};

import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { liveClassesService } from "./live-classes.service.js";

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

export const liveClassesController = {
  async listLiveClasses(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ liveClasses: await liveClassesService.listLiveClasses() });
    } catch (error) {
      next(error);
    }
  },
  async createLiveClass(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ liveClass: await liveClassesService.createLiveClass(req.body) });
    } catch (error) {
      next(error);
    }
  },
  async updateLiveClass(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ liveClass: await liveClassesService.updateLiveClass(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },
  async deleteLiveClass(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await liveClassesService.deleteLiveClass(param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
  async listLectures(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ lectures: await liveClassesService.listLectures() });
    } catch (error) {
      next(error);
    }
  },
  async lectureDetails(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ lecture: await liveClassesService.getLecture(param(req, "id")) });
    } catch (error) {
      next(error);
    }
  },
  async updateProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ progress: await liveClassesService.updateProgress(userId(req), req.body) });
    } catch (error) {
      next(error);
    }
  },
  async progress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ progress: await liveClassesService.progress(userId(req), param(req, "lectureId")) });
    } catch (error) {
      next(error);
    }
  }
};

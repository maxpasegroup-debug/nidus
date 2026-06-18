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
  async listLiveClasses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      res.json({ liveClasses: await liveClassesService.listLiveClasses(req.user) });
    } catch (error) {
      next(error);
    }
  },
  async createLiveClass(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      const template = req.user.roleMetadata && typeof req.user.roleMetadata === "object" && typeof req.user.roleMetadata.dashboardTemplate === "string"
        ? req.user.roleMetadata.dashboardTemplate.toUpperCase()
        : "";
      const canAssignTeacher = req.user.role === "ADMIN" || req.user.role === "DIRECTOR" || req.user.role === "ACADEMIC_HEAD" || template === "ACADEMIC_HEAD";
      const payload = canAssignTeacher ? req.body : { ...req.body, teacherId: req.user.id };
      res.status(201).json({ liveClass: await liveClassesService.createLiveClass(req.user, payload) });
    } catch (error) {
      next(error);
    }
  },
  async updateLiveClass(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      res.json({ liveClass: await liveClassesService.updateLiveClass(req.user, param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },
  async deleteLiveClass(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      res.json(await liveClassesService.deleteLiveClass(req.user, param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
  async listLectures(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      res.json({ lectures: await liveClassesService.listLectures(req.user) });
    } catch (error) {
      next(error);
    }
  },
  async lectureDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      res.json({ lecture: await liveClassesService.getLecture(req.user, param(req, "id")) });
    } catch (error) {
      next(error);
    }
  },
  async updateProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      res.json({ progress: await liveClassesService.updateProgress(req.user, req.body) });
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

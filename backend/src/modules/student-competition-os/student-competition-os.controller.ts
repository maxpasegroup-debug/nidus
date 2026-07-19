import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { studentCompetitionOsService } from "./student-competition-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

function period(value: unknown) {
  const normalized = String(value || "").toUpperCase();
  if (["DAILY", "MONTHLY", "FINAL", "ALL_TIME"].includes(normalized)) {
    return normalized as "DAILY" | "MONTHLY" | "FINAL" | "ALL_TIME";
  }
  return "MONTHLY";
}

function stringParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const studentCompetitionOsController = {
  framework(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(studentCompetitionOsService.framework());
    } catch (error) {
      next(error);
    }
  },

  async leaderboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await studentCompetitionOsService.leaderboard(actor(req), period(req.query.period), stringParam(req.query.batchId)));
    } catch (error) {
      next(error);
    }
  },

  async student(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = stringParam(req.params.userId);
      if (!userId) throw Object.assign(new Error("Student id is required"), { statusCode: 400 });
      res.json(await studentCompetitionOsService.student(actor(req), userId));
    } catch (error) {
      next(error);
    }
  }
};

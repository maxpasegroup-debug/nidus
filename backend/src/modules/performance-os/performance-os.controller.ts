import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { performanceOsService } from "./performance-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

function period(value: unknown): "MONTH" | "YEAR" {
  return String(value || "").toUpperCase() === "YEAR" ? "YEAR" : "MONTH";
}

export const performanceOsController = {
  framework(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(performanceOsService.framework());
    } catch (error) {
      next(error);
    }
  },

  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await performanceOsService.dashboard(actor(req), period(req.query.period)));
    } catch (error) {
      next(error);
    }
  },

  async staffMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rawUserId = req.params.userId;
      const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
      if (!userId) throw Object.assign(new Error("User id is required"), { statusCode: 400 });
      res.json(await performanceOsService.staffMember(actor(req), userId, period(req.query.period)));
    } catch (error) {
      next(error);
    }
  }
};
